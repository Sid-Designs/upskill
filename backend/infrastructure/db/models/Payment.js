const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Payment Schema - Updated for Razorpay Integration
 * 
 * Changes from UPI flow:
 * - Removed: upiRef, utr, submittedAt, pending_verification status
 * - Added: razorpayOrderId, razorpayPaymentId, razorpaySignature, currency, metadata
 * 
 * The payment flow now works as:
 * 1. Backend creates Razorpay order → status: pending
 * 2. Frontend completes payment via Razorpay Checkout
 * 3. Razorpay sends webhook → status: success/failed
 * 4. Credits are added ONLY after webhook verification
 */
const paymentSchema = Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "INR",
    },
    // Razorpay order ID (created by backend before payment)
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Razorpay payment ID (received after successful payment)
    razorpayPaymentId: {
      type: String,
      default: undefined,
    },
    // Razorpay signature (for verification)
    razorpaySignature: {
      type: String,
      default: undefined,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "expired", "cancelled"],
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    // Additional metadata (credits to add, etc.)
    metadata: {
      type: Object,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Index for finding pending payments by user
paymentSchema.index(
  { userId: 1, status: 1 },
  { partialFilterExpression: { status: "pending" } }
);

// Unique index on razorpayPaymentId, but ONLY for documents where it actually exists
// This avoids E11000 duplicate key errors when multiple pending payments have no paymentId yet
paymentSchema.index(
  { razorpayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      razorpayPaymentId: { $exists: true, $type: "string" },
    },
  }
);

// Export
module.exports = mongoose.model("Payment", paymentSchema);

