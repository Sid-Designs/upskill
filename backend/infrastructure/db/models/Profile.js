const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Profile Schema
const profileSchema = Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: process.env.APP_LOGO_URL,
    },
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    bio: {
      type: String,
      trim: true,
    },
    preferences: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Export
module.exports = mongoose.model("Profile", profileSchema);
