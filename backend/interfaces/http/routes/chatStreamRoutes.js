const express = require("express");
const router = express.Router();

const ChatStreamController = require("../../http/controllers/ChatStreamController");

router.get("/api/chat/stream", ChatStreamController.stream);

module.exports = router;
