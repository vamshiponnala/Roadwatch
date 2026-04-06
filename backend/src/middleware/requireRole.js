// middleware/requireRole.js
exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error:"Insufficient permissions." });
  next();
};
 
// ─────────────────────────────────────────────────────────────────────────────
