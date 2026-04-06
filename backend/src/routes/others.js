// routes/rewards.js
const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/rewardController");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
 
router.use(authenticate);
router.get("/balance", ctrl.balance);
router.get("/history", ctrl.history);
router.post("/withdraw",
  [body("upiId").notEmpty(), body("amount").isFloat({min:10})],
  validate, ctrl.withdraw);
module.exports = router;
 
// ─────────────────────────────────────────────────────────────────────────────
 
// routes/map.js
const mapRouter = require("express").Router();
const mapCtrl = require("../controllers/mapController");
const { authenticate: auth } = require("../middleware/auth");
mapRouter.use(auth);
mapRouter.get("/heatmap",  mapCtrl.heatmap);
mapRouter.get("/hotspots", mapCtrl.hotspots);
mapRouter.get("/nearby",   mapCtrl.nearby);
module.exports = { rewards: router, map: mapRouter };
 
// ─────────────────────────────────────────────────────────────────────────────
 
// routes/users.js
const userRouter = require("express").Router();
const { authenticate: authUser } = require("../middleware/auth");
userRouter.use(authUser);
userRouter.get("/leaderboard", async (req, res) => {
  const prisma = require("../utils/prisma");
  const users  = await prisma.user.findMany({
    where:   { role:"CITIZEN" },
    orderBy: { pointsBalance:"desc" },
    take:    20,
    select:  { id:true, name:true, phone:true, pointsBalance:true, _count:{ select:{ reports:true } } }
  });
  res.json({ leaderboard: users.map((u,i) => ({ ...u, rank:i+1, phone: u.phone.replace(/(\d{2})\d{6}(\d{2})/, "$1xxxxxx$2") })) });
});
module.exports = userRouter;
 