const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSessionSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["career_guidance", "resume_review", "interview_prep", "roadmap"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "New Chat",
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

// List chats per user efficiently
chatSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ChatSession", chatSessionSchema);