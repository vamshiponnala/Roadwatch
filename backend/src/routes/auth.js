// routes/auth.js
const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
 
router.post("/send-otp",
  [body("phone").isMobilePhone("en-IN")], validate, ctrl.sendOtp);
router.post("/verify-otp",
  [body("phone").isMobilePhone("en-IN"), body("otp").isLength({min:6,max:6}).isNumeric()], validate, ctrl.verifyOtp);
router.post("/refresh", ctrl.refreshToken);
router.post("/logout", authenticate, ctrl.logout);
router.get("/me", authenticate, ctrl.me);
 
module.exports = router;