// middleware/auth.js
const jwt    = require("jsonwebtoken");
const prisma = require("../utils/prisma");
 
exports.authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error:"Authorization header missing." });
    const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user    = await prisma.user.findUnique({ where:{id:payload.sub}, select:{id:true,role:true,isActive:true} });
    if (!user || !user.isActive) return res.status(401).json({ error:"User not found." });
    req.user = user;
    next();
  } catch (err) {
    if (err.name==="TokenExpiredError") return res.status(401).json({ error:"Token expired.", code:"TOKEN_EXPIRED" });
    return res.status(401).json({ error:"Invalid token." });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────