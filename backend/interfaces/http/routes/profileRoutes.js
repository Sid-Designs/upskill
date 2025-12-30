const express = require("express");
const router = express.Router();

const profileController = require("../controllers/ProfileController");

// Controller
const ProfileController = require("../controllers/ProfileController");

// Middleware
const authenticateJWT = require("../../middleware/authenticateJWT");

// Get logged-in user's profile
router.get("/get", authenticateJWT, profileController.getProfile);

// Create or update profile
router.put("/update", authenticateJWT, profileController.upsertProfile);

module.exports = router;
