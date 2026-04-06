const prisma = require("../utils/prisma");

exports.leaderboard = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role:"CITIZEN" },
      orderBy: { pointsBalance:"desc" },
      take: 20,
      select: { id:true, name:true, phone:true, pointsBalance:true, _count: { select: { reports:true } } }
    });
    res.json({ leaderboard: users.map((u,i) => ({
      ...u, rank:i+1,
      phone: u.phone.replace(/(\d{2})\d{6}(\d{2})/, "$1xxxxxx$2")
    }))});
  } catch (err) { next(err); }
};