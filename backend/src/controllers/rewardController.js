// controllers/rewardController.js
const rwPrisma  = require("../utils/prisma");
const Razorpay  = require("razorpay");
 
exports.balance = async (req, res, next) => {
  try {
    const user = await rwPrisma.user.findUnique({ where:{id:req.user.id}, select:{pointsBalance:true} });
    res.json({ points:user.pointsBalance, rupees:user.pointsBalance/2, canWithdraw:user.pointsBalance>=20 });
  } catch (err) { next(err); }
};
 
exports.history = async (req, res, next) => {
  try {
    const rewards = await rwPrisma.reward.findMany({ where:{userId:req.user.id}, orderBy:{createdAt:"desc"}, take:50,
      include:{ report:{ select:{violationType:true, address:true} } } });
    res.json({ rewards });
  } catch (err) { next(err); }
};
 
exports.withdraw = async (req, res, next) => {
  try {
    const { upiId, amount } = req.body;
    const user = await rwPrisma.user.findUnique({ where:{id:req.user.id} });
    if (amount > user.pointsBalance/2) return res.status(400).json({ error:`Max withdrawal: ₹${user.pointsBalance/2}` });
 
    const razorpay = new Razorpay({ key_id:process.env.RAZORPAY_KEY_ID, key_secret:process.env.RAZORPAY_KEY_SECRET });
    const payout   = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      amount: Math.round(amount*100), currency:"INR", mode:"UPI", purpose:"payout",
      fund_account:{ account_type:"vpa", vpa:{ address:upiId }, contact:{ name:user.name||"User", contact:user.phone, type:"customer" } },
      queue_if_low_balance: true, reference_id:`RW_${user.id}_${Date.now()}`,
    });
 
    await rwPrisma.$transaction([
      rwPrisma.withdrawal.create({ data:{ userId:req.user.id, amount, upiId, razorpayPayId:payout.id } }),
      rwPrisma.user.update({ where:{id:req.user.id}, data:{ pointsBalance:{decrement:Math.round(amount*2)} } }),
    ]);
    res.json({ success:true, payoutId:payout.id, amount, status:payout.status });
  } catch (err) { next(err); }
};
 
// ─────────────────────────────────────────────────────────────────────────────
