const router = require("express").Router();
const ctrl = require("../controllers/mapController");
const { authenticate } = require("../middleware/auth");
router.use(authenticate);
router.get("/heatmap", ctrl.heatmap);
router.get("/hotspots", ctrl.hotspots);
router.get("/nearby", ctrl.nearby);
module.exports = router;
