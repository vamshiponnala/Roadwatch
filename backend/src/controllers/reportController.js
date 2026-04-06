// controllers/reportController.js
const prisma = require("../utils/prisma");
const POINTS = { NO_HELMET:50, TRIPLE_RIDING:75, SIGNAL_VIOLATION:60, ILLEGAL_PARKING:40, WRONG_ROUTE:55, OVER_SPEEDING:80 };
 
exports.create = async (req, res, next) => {
  try {
    const { violationType, latitude, longitude, description, vehiclePlate, isAnonymous } = req.body;
    const photos   = (req.files?.photos || []).map(f => f.location);
    const videoUrl = req.files?.video?.[0]?.location || null;
    if (!photos.length) return res.status(400).json({ error:"At least one photo required." });
 
    // Reverse geocode
    let address = null, city = null;
    try {
      const https = require("https");
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      const geoData = await new Promise((resolve) => {
        https.get(geoUrl, res => { let d=""; res.on("data",c=>d+=c); res.on("end",()=>resolve(JSON.parse(d))); }).on("error",()=>resolve({}));
      });
      address = geoData.results?.[0]?.formatted_address;
      city = geoData.results?.[0]?.address_components?.find(c=>c.types.includes("locality"))?.long_name;
    } catch {}
 
    const report = await prisma.report.create({
      data: { reporterId:req.user.id, violationType, description, vehiclePlate:vehiclePlate?.toUpperCase(),
              latitude:parseFloat(latitude), longitude:parseFloat(longitude), address, city,
              photoUrls:photos, videoUrl, thumbnailUrl:photos[0],
              isAnonymous: isAnonymous==="true"||isAnonymous===true },
    });
 
    req.app.get("io")?.to("admins").emit("new_report", { id:report.id, violationType, city, createdAt:report.createdAt });
    res.status(201).json({ success:true, report, potentialPoints:POINTS[violationType] });
  } catch (err) { next(err); }
};
 
exports.list = async (req, res, next) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20;
    const where = { reporterId:req.user.id, ...(req.query.status && { status:req.query.status }) };
    const [reports, total] = await Promise.all([
      prisma.report.findMany({ where, orderBy:{createdAt:"desc"}, skip:(page-1)*limit, take:limit }),
      prisma.report.count({ where }),
    ]);
    res.json({ reports, pagination:{ page, limit, total, pages:Math.ceil(total/limit) } });
  } catch (err) { next(err); }
};
 
exports.getOne = async (req, res, next) => {
  try {
    const report = await prisma.report.findFirst({ where:{ id:req.params.id, reporterId:req.user.id } });
    if (!report) return res.status(404).json({ error:"Not found." });
    res.json({ report });
  } catch (err) { next(err); }
};
 
exports.remove = async (req, res, next) => {
  try {
    const report = await prisma.report.findFirst({ where:{ id:req.params.id, reporterId:req.user.id } });
    if (!report) return res.status(404).json({ error:"Not found." });
    if (Date.now() - new Date(report.createdAt).getTime() > 5*60*1000)
      return res.status(403).json({ error:"Can only delete within 5 minutes." });
    await prisma.report.delete({ where:{ id:report.id } });
    res.json({ success:true });
  } catch (err) { next(err); }
};
 
// ─────────────────────────────────────────────────────────────────────────────
