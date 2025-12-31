const express = require("express");
const router = express.Router();

const ChatController = require("../controllers/ChatController");

// Middlewares
const asyncHandler = require("../../../interfaces/middleware/asyncHandler");
const authenticateJWT = require("../../../interfaces/middleware/authenticateJWT");
const rateLimiter = require("../../../interfaces/middleware/rateLimiter");

router.post(
  "/create-session",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  authenticateJWT,
  asyncHandler(ChatController.createSession)
);

router.post(
  "/send-message",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  authenticateJWT,
  asyncHandler(ChatController.sendMessage)
);

router.get(
  "/session",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  authenticateJWT,
  asyncHandler(ChatController.getSessions)
);

router.get(
  "/session/:chatSessionId/messages",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  authenticateJWT,
  asyncHandler(ChatController.getMessages)
);

router.delete(
  "/session/:chatSessionId",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  authenticateJWT,
  asyncHandler(ChatController.deleteChatSession)
);

// Cover Letter
router.post(
  "/cover-letter",
  authenticateJWT,
  ChatController.generateCoverLetter
);

// Get Cover Letter by ID
router.get(
  "/cover-letter/:coverLetterId",
  authenticateJWT,
  asyncHandler(ChatController.getCoverLetterById)
);

// Delete Cover Letter by ID
router.delete(
  "/cover-letter/:coverLetterId",
  authenticateJWT,
  asyncHandler(ChatController.deleteCoverLetterById)
);

// Get All Cover Letters for User
router.get("/cover-letters", authenticateJWT, asyncHandler(ChatController.getAllCoverLetters));

module.exports = router;
