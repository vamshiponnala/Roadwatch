// routes/admin.js
const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/adminController");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { validate } = require("../middleware/validate");
 
router.use(authenticate, requireRole("AUTHORITY","ADMIN"));
router.get("/reports", ctrl.listReports);
router.get("/reports/:id", ctrl.getReport);
router.patch("/reports/:id/review",
  [body("action").isIn(["APPROVE","REJECT"]), body("notes").optional().isLength({max:500})],
  validate, ctrl.reviewReport);
router.get("/stats", ctrl.stats);
router.get("/export", ctrl.exportCsv);
module.exports = router;
 