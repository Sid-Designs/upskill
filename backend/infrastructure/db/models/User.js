const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// User Schema
const userSchema = Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "expert", "admin"],
      default: "user",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending","active", "blocked"],
      default: "pending",
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpiresAt: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Export
module.exports = mongoose.model("User", userSchema);
