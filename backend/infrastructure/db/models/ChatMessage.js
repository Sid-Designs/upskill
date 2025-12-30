const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    chatSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: null,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Load chat messages in order
chatMessageSchema.index({ chatSessionId: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
