// controllers/adminController.js
const adminPrisma = require("../utils/prisma");
const ADMIN_POINTS = { NO_HELMET:50, TRIPLE_RIDING:75, SIGNAL_VIOLATION:60, ILLEGAL_PARKING:40, WRONG_ROUTE:55, OVER_SPEEDING:80 };
 
exports.listReports = async (req, res, next) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20;
    const status = req.query.status || "PENDING";
    const where  = { status, ...(req.query.violationType && { violationType:req.query.violationType }) };
    const [reports, total] = await Promise.all([
      adminPrisma.report.findMany({ where, orderBy:{createdAt:"asc"}, skip:(page-1)*limit, take:limit,
        include:{ reporter:{ select:{id:true,name:true,phone:true} } } }),
      adminPrisma.report.count({ where }),
    ]);
    res.json({ reports, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
  } catch (err) { next(err); }
};
 
exports.getReport = async (req, res, next) => {
  try {
    const report = await adminPrisma.report.findUnique({ where:{ id:req.params.id },
      include:{ reporter:{ select:{id:true,name:true,phone:true,pointsBalance:true} }, rewards:true } });
    if (!report) return res.status(404).json({ error:"Not found." });
    res.json({ report });
  } catch (err) { next(err); }
};
 
exports.reviewReport = async (req, res, next) => {
  try {
    const { action, notes, challanNumber } = req.body;
    const report = await adminPrisma.report.findUnique({ where:{ id:req.params.id } });
    if (!report) return res.status(404).json({ error:"Not found." });
    if (!["PENDING","UNDER_REVIEW"].includes(report.status)) return res.status(400).json({ error:"Already reviewed." });
 
    if (action === "APPROVE") {
      const points = ADMIN_POINTS[report.violationType] || 50;
      const [updatedReport] = await adminPrisma.$transaction([
        adminPrisma.report.update({ where:{id:report.id}, data:{ status:"VERIFIED", reviewerId:req.user.id, reviewedAt:new Date(), reviewNotes:notes, challanNumber, pointsAwarded:points } }),
        adminPrisma.reward.create({ data:{ userId:report.reporterId, reportId:report.id, points, rupees:points/2 } }),
        adminPrisma.user.update({ where:{id:report.reporterId}, data:{ pointsBalance:{increment:points} } }),
      ]);
      req.app.get("io")?.to(`user:${report.reporterId}`).emit("report_verified", { reportId:report.id, points, challanNumber });
      return res.json({ success:true, report:updatedReport, pointsAwarded:points });
    }
 
    const updatedReport = await adminPrisma.report.update({ where:{id:report.id},
      data:{ status:"REJECTED", reviewerId:req.user.id, reviewedAt:new Date(), reviewNotes:notes } });
    req.app.get("io")?.to(`user:${report.reporterId}`).emit("report_rejected", { reportId:report.id, notes });
    res.json({ success:true, report:updatedReport });
  } catch (err) { next(err); }
};
 
exports.stats = async (req, res, next) => {
  try {
    const [total,pending,verified,rejected,byType] = await Promise.all([
      adminPrisma.report.count(),
      adminPrisma.report.count({ where:{status:"PENDING"} }),
      adminPrisma.report.count({ where:{status:"VERIFIED"} }),
      adminPrisma.report.count({ where:{status:"REJECTED"} }),
      adminPrisma.report.groupBy({ by:["violationType"], _count:{_all:true} }),
    ]);
    const totalRewards = await adminPrisma.reward.aggregate({ _sum:{points:true} });
    res.json({ stats:{ total,pending,verified,rejected, totalPointsAwarded:totalRewards._sum.points||0 },
      byType: byType.map(b=>({ type:b.violationType, count:b._count._all })) });
  } catch (err) { next(err); }
};
 
exports.exportCsv = async (req, res, next) => {
  try {
    const reports = await adminPrisma.report.findMany({ orderBy:{createdAt:"desc"}, take:1000,
      include:{ reporter:{ select:{phone:true} } } });
    const header = "ID,Violation,Location,Status,Reporter,Challan,Date\n";
    const rows   = reports.map(r => `${r.id},${r.violationType},"${r.address||""}",${r.status},${r.reporter.phone},${r.challanNumber||""},${r.createdAt.toISOString()}`).join("\n");
    res.setHeader("Content-Type","text/csv");
    res.setHeader("Content-Disposition",`attachment; filename="reports_${Date.now()}.csv"`);
    res.send(header+rows);
  } catch (err) { next(err); }
};
 
// ─────────────────────────────────────────────────────────────────────────────
