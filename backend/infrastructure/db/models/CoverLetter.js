const mongoose = require("mongoose");

const CoverLetterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobTitle: {
      type: String,
      required: true,
    },

    companyName: {
      type: String,
      required: true,
    },

    jobDescription: {
      type: String,
      required: true,
    },

    generatedText: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    provider: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CoverLetter", CoverLetterSchema);
