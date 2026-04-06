// controllers/mapController.js
const mapPrisma = require("../utils/prisma");
const mapRedis  = require("../utils/redis");
 
exports.heatmap = async (req, res, next) => {
  try {
    const { violationType } = req.query;
    const cacheKey = `heatmap:${violationType||"all"}`;
    const cached   = await mapRedis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
 
    const points = await mapPrisma.report.findMany({
      where: { status:"VERIFIED", ...(violationType && { violationType }) },
      select:{ latitude:true, longitude:true, violationType:true },
    });
    const data = { count:points.length, points:points.map(p=>({ lat:p.latitude, lng:p.longitude, weight:1 })) };
    await mapRedis.setex(cacheKey, 120, JSON.stringify(data));
    res.json(data);
  } catch (err) { next(err); }
};
 
exports.hotspots = async (req, res, next) => {
  try {
    const cached = await mapRedis.get("hotspots");
    if (cached) return res.json(JSON.parse(cached));
    const rows = await mapPrisma.$queryRaw`
      SELECT ROUND(latitude::numeric,2) AS lat, ROUND(longitude::numeric,2) AS lng, COUNT(*)::int AS count, city
      FROM "Report" WHERE status='VERIFIED'
      GROUP BY ROUND(latitude::numeric,2), ROUND(longitude::numeric,2), city
      ORDER BY count DESC LIMIT 10`;
    const data = { hotspots:rows };
    await mapRedis.setex("hotspots", 120, JSON.stringify(data));
    res.json(data);
  } catch (err) { next(err); }
};
 
exports.nearby = async (req, res, next) => {
  try {
    const lat=parseFloat(req.query.lat), lng=parseFloat(req.query.lng), radius=parseFloat(req.query.radius)||2000;
    if (isNaN(lat)||isNaN(lng)) return res.status(400).json({ error:"lat and lng required." });
    const degLat=radius/111320, degLng=radius/(111320*Math.cos(lat*Math.PI/180));
    const reports = await mapPrisma.report.findMany({
      where:{ status:"VERIFIED", latitude:{gte:lat-degLat,lte:lat+degLat}, longitude:{gte:lng-degLng,lte:lng+degLng} },
      orderBy:{createdAt:"desc"}, take:50,
      select:{ id:true, violationType:true, address:true, latitude:true, longitude:true, createdAt:true },
    });
    res.json({ count:reports.length, reports });
  } catch (err) { next(err); }
};