const express = require("express");
const router = express.Router();

const ChatController = require("../controllers/ChatController");

// Middlewares
const asyncHandler = require("../../../interfaces/middleware/asyncHandler");
const authenticateJWT = require("../../../interfaces/middleware/authenticateJWT");
const rateLimiter = require("../../../interfaces/middleware/rateLimiter");

router.post(
  "/create-session",
  authenticateJWT,
  asyncHandler(ChatController.createSession)
);

router.post(
  "/send-message",
  authenticateJWT,
  asyncHandler(ChatController.sendMessage)
);

router.get(
  "/session",
  authenticateJWT,
  asyncHandler(ChatController.getSessions)
);

router.get(
  "/session/:chatSessionId/messages",
  authenticateJWT,
  asyncHandler(ChatController.getMessages)
);

router.delete(
  "/session/:chatSessionId",
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
