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
