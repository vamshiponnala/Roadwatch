const router = require("express").Router();
const ctrl = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");
router.use(authenticate);
router.get("/leaderboard", ctrl.leaderboard);
module.exports = router;
