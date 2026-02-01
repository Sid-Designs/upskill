/**
 * Payment Domain Entity
 * 
 * This entity represents a payment in the system.
 * Updated to use Razorpay instead of manual UPI/UTR flow.
 * 
 * Key changes from UPI flow:
 * - Removed: upiRef, utr, submitForVerification(), pending_verification status
 * - Added: razorpayOrderId, razorpayPaymentId, razorpaySignature
 * - Payment success is determined ONLY by webhook verification
 */
class Payment {
  static STATUS = {
    PENDING: "pending",           // Order created, awaiting payment
    SUCCESS: "success",           // Payment verified via webhook
    FAILED: "failed",             // Payment failed
    EXPIRED: "expired",           // Payment window expired
    CANCELLED: "cancelled",       // User cancelled
  };

  constructor({
    id,
    userId,
    amount,
    currency = "INR",
    razorpayOrderId,
    razorpayPaymentId = null,
    razorpaySignature = null,
    status = Payment.STATUS.PENDING,
    expiresAt,
    createdAt = new Date(),
    verifiedAt = null,
    metadata = {},
  }) {
    if (!userId) throw new Error("Payment must belong to a user");
    if (amount <= 0) throw new Error("Invalid payment amount");
    if (!razorpayOrderId) throw new Error("Razorpay order ID is required");
    if (!expiresAt) throw new Error("Payment expiry is required");

    this.id = id;
    this.userId = userId;
    this.amount = amount;
    this.currency = currency;
    this.razorpayOrderId = razorpayOrderId;
    this.razorpayPaymentId = razorpayPaymentId;
    this.razorpaySignature = razorpaySignature;
    this._status = status;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.verifiedAt = verifiedAt;
    this.metadata = metadata; // For storing additional info like credits to add
  }

  get status() {
    return this._status;
  }

  /**
   * Mark payment as successful after webhook verification.
   * This should ONLY be called after verifying Razorpay webhook signature.
   * 
   * @param {string} razorpayPaymentId - Payment ID from Razorpay
   * @param {string} razorpaySignature - Signature from Razorpay webhook
   */
  markSuccessFromWebhook(razorpayPaymentId, razorpaySignature) {
    if (this._status !== Payment.STATUS.PENDING) {
      throw new Error(`Cannot mark payment as success from status: ${this._status}`);
    }
    
    this.razorpayPaymentId = razorpayPaymentId;
    this.razorpaySignature = razorpaySignature;
    this._status = Payment.STATUS.SUCCESS;
    this.verifiedAt = new Date();
  }

  /**
   * Mark payment as failed.
   * Called when webhook indicates payment failure.
   */
  markFailed() {
    if (this._status !== Payment.STATUS.PENDING) {
      throw new Error(`Cannot mark payment as failed from status: ${this._status}`);
    }
    this._status = Payment.STATUS.FAILED;
    this.verifiedAt = new Date();
  }

  /**
   * Cancel the payment.
   * Can only cancel pending payments.
   */
  cancel() {
    if (this._status !== Payment.STATUS.PENDING) {
      throw new Error(`Cannot cancel payment with status: ${this._status}`);
    }
    this._status = Payment.STATUS.CANCELLED;
  }

  /**
   * Mark payment as expired.
   * Idempotent - safe to call multiple times.
   */
  expire(now = new Date()) {
    if (this._status !== Payment.STATUS.PENDING) return;

    if (now > this.expiresAt) {
      this._status = Payment.STATUS.EXPIRED;
    }
  }

  isExpired(now = new Date()) {
    return now > this.expiresAt;
  }

  isPending() {
    return this._status === Payment.STATUS.PENDING;
  }

  isSuccess() {
    return this._status === Payment.STATUS.SUCCESS;
  }

  isFinalized() {
    return [
      Payment.STATUS.SUCCESS,
      Payment.STATUS.FAILED,
      Payment.STATUS.EXPIRED,
      Payment.STATUS.CANCELLED,
    ].includes(this._status);
  }

  /**
   * Calculate credits to add based on payment amount.
   * Can be customized based on pricing tiers.
   * 
   * @returns {number} Credits to add
   */
  getCreditsToAdd() {
    // Default: 1 credit = 1 INR
    // Customize this based on your pricing model
    return this.metadata.creditsToAdd || Math.floor(this.amount);
  }
}

module.exports = Payment;
