const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roadmapSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    goalTitle: {
      type: String,
      required: true,
      trim: true
    },
    durationDays: {
      type: Number,
      required: true,
      min: 7
    },
    currentSkillLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
      required: true
    },
    targetSkillLevel: {
      type: String,
      enum: ["Job-Ready", "Interview-Ready", "Advanced"],
      required: true
    },
    educationalBackground: {
      type: String,
      trim: true,
      required: true
    },
    priorKnowledge: {
      type: [String], 
      default: []
    },
    learningStyle: {
      type: [String],
      enum: ["Hands-on", "Projects", "Videos", "Reading"],
      required: true
    },
    resourceConstraints: {
      type: String,
      default: null
    },
    careerGoal: {
      type: String,
      default: null
    },
    additionalNotes: {
      type: String,
      trim: true,
      default: null
    },
    generatedContent: {
      type: Schema.Types.Mixed,
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },
    provider: {
      type: String,
      default: null
    },
    completedNodes: {
      type: [String],
      default: []
    },
    totalNodes: {
      type: Number,
      default: 0
    },
    progressPercent: {
      type: Number,
      default: 0
    },
    learningStatus: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started"
    },
    capstoneStatus: {
      type: String,
      enum: ["not_started", "submitted", "passed", "failed"],
      default: "not_started"
    },
    capstoneSubmissions: [
      {
        githubUrl: { type: String, required: true },
        verdict: { type: String, enum: ["pass", "partial", "fail"], required: true },
        score: { type: Number, default: 0 },
        requirementResults: [
          {
            requirement: String,
            met: Boolean,
            feedback: String,
          }
        ],
        strengths: [String],
        improvements: [String],
        overallFeedback: String,
        submittedAt: { type: Date, default: Date.now },
      }
    ]
  },
  {
    timestamps: true
  }
);

// Index for fast queries by userId
roadmapSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Roadmap", roadmapSchema);
