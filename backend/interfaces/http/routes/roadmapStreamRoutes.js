const express = require("express");
const router = express.Router();

const RoadmapStreamController = require("../controllers/RoadmapStreamController");

router.get("/api/roadmap/stream", RoadmapStreamController.stream);

module.exports = router;
