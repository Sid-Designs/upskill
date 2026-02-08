const express = require("express");
const router = express.Router();

const RoadmapController = require("../controllers/RoadmapController");

// Middlewares
const asyncHandler = require("../../middleware/asyncHandler");
const authenticateJWT = require("../../middleware/authenticateJWT");

// PUBLIC: Verify certificate (no auth required - for QR code scanning)
router.get(
  "/verify/:roadmapId",
  asyncHandler(RoadmapController.verifyCertificate)
);

// Generate a new roadmap (triggers async AI generation)
router.post(
  "/generate",
  authenticateJWT,
  asyncHandler(RoadmapController.generate)
);

// Get all roadmaps for the authenticated user
router.get(
  "/",
  authenticateJWT,
  asyncHandler(RoadmapController.getAll)
);

// Get a single roadmap by ID
router.get(
  "/:roadmapId",
  authenticateJWT,
  asyncHandler(RoadmapController.getById)
);

// Update roadmap progress (completed nodes)
router.patch(
  "/:roadmapId/progress",
  authenticateJWT,
  asyncHandler(RoadmapController.updateRoadmapProgress)
);

// Verify capstone project via GitHub repo
router.post(
  "/:roadmapId/verify-capstone",
  authenticateJWT,
  asyncHandler(RoadmapController.verifyCapstone)
);

// Delete a roadmap
router.delete(
  "/:roadmapId",
  authenticateJWT,
  asyncHandler(RoadmapController.deleteRoadmap)
);

module.exports = router;
