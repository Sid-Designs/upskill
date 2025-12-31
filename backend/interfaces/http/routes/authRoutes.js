const express = require("express");
const router = express.Router();

//Controllers
const AuthController = require("../controllers/AuthController");

// Middlewares
const asyncHandler = require("../../../interfaces/middleware/asyncHandler");
const rateLimiter = require("../../../interfaces/middleware/rateLimiter");
const authenticateJWT = require("../../middleware/authenticateJWT");

router.post(
  "/login",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  asyncHandler(AuthController.login)
);

router.get("/me", authenticateJWT, asyncHandler(AuthController.getMe));

router.get(
  "/verify-email",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  asyncHandler(AuthController.verifyEmail)
);

router.post(
  "/resend-verification",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  asyncHandler(AuthController.resendVerification)
);

router.post(
  "/forgot-password",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  asyncHandler(AuthController.requestPasswordReset)
);

router.post(
  "/reset-password",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  asyncHandler(AuthController.resetPassword)
);

router.post(
  "/logout",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  asyncHandler(AuthController.logout)
);

module.exports = router;
