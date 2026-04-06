// controllers/authController.js
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const prisma  = require("../utils/prisma");
const redis   = require("../utils/redis");
 
const issueTokens = (userId, role) => ({
  access:  jwt.sign({ sub:userId, role }, process.env.JWT_SECRET,         { expiresIn:"15m" }),
  refresh: jwt.sign({ sub:userId, role, jti:uuid() }, process.env.JWT_REFRESH_SECRET, { expiresIn:"30d" }),
});
 
exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const throttled = await redis.get(`otp:throttle:${phone}`);
    if (throttled) return res.status(429).json({ error:"Wait 60 seconds before requesting again." });
 
    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(otp, 8);
    await redis.setex(`otp:${phone}`, 300, hashed);
    await redis.setex(`otp:throttle:${phone}`, 60, "1");
 
    // Send SMS via Twilio
    const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const e164   = phone.startsWith("+") ? phone : `+91${phone}`;
    await twilio.messages.create({
      body: `Your RoadWatch OTP is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to:   e164,
    });
 
    res.json({ success:true, message:"OTP sent.", expiresIn:300 });
  } catch (err) { next(err); }
};
 
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const stored = await redis.get(`otp:${phone}`);
    if (!stored) return res.status(400).json({ error:"OTP expired. Request a new one." });
 
    const valid = await bcrypt.compare(otp, stored);
    if (!valid)  return res.status(400).json({ error:"Invalid OTP." });
    await redis.del(`otp:${phone}`);
 
    const user   = await prisma.user.upsert({
      where:  { phone },
      update: { isActive:true },
      create: { phone, isVerified:true },
    });
    const tokens = issueTokens(user.id, user.role);
    await redis.setex(`refresh:${user.id}`, 30*24*3600, tokens.refresh);
 
    res.json({ success:true, user:{ id:user.id, phone:user.phone, name:user.name, role:user.role, pointsBalance:user.pointsBalance }, tokens });
  } catch (err) { next(err); }
};
 
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error:"Refresh token required." });
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const stored  = await redis.get(`refresh:${payload.sub}`);
    if (!stored || stored !== refreshToken) return res.status(401).json({ error:"Invalid token." });
    const tokens = issueTokens(payload.sub, payload.role);
    await redis.setex(`refresh:${payload.sub}`, 30*24*3600, tokens.refresh);
    res.json({ tokens });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") return res.status(401).json({ error:"Invalid token." });
    next(err);
  }
};
 
exports.logout = async (req, res, next) => {
  try {
    await redis.del(`refresh:${req.user.id}`);
    res.json({ success:true });
  } catch (err) { next(err); }
};
 
exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id:req.user.id },
      select: { id:true, phone:true, name:true, role:true, pointsBalance:true, isVerified:true },
    });
    res.json({ user });
  } catch (err) { next(err); }
};