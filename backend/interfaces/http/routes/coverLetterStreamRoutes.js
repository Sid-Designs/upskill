const express = require("express");
const router = express.Router();

const CoverLetterStreamController = require("../controllers/CoverLetterStreamController");

router.get("/api/cover-letter/stream", CoverLetterStreamController.stream);

module.exports = router;
