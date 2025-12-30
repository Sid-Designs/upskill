const express = require("express");
const router = express.Router();

//Controllers
const UserController = require("../controllers/UserController");

//Middlewares
const asyncHandler = require("../../middleware/asyncHandler");
const authenticateJWT = require("../../middleware/authenticateJWT");
const requireAdmin = require("../../middleware/requireAdmin");
const rateLimiter = require("../../middleware/rateLimiter");

// User Registration 
router.post(
  "/register",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  asyncHandler(UserController.register)
);

// Admin Registration
router.post(
  "/register-admin",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  authenticateJWT,
  requireAdmin,
  asyncHandler(UserController.registerAdmin)
);

module.exports = router;
