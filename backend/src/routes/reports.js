// routes/reports.js
const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/reportController");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const upload = require("../middleware/upload");
 
router.use(authenticate);
router.get("/", ctrl.list);
router.post("/",
  upload.fields([{ name:"photos", maxCount:4 }, { name:"video", maxCount:1 }]),
  [
    body("violationType").isIn(["NO_HELMET","TRIPLE_RIDING","SIGNAL_VIOLATION","ILLEGAL_PARKING","WRONG_ROUTE","OVER_SPEEDING"]),
    body("latitude").isFloat({ min:-90, max:90 }),
    body("longitude").isFloat({ min:-180, max:180 }),
  ],
  validate, ctrl.create);
router.get("/:id", ctrl.getOne);
router.delete("/:id", ctrl.remove);
module.exports = router;
 
// ─────────────────────────────────────────────────────────────────────────────

 