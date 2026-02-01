/**
 * VerifyPaymentCallback Use Case
 * 
 * Verifies the payment callback received from Razorpay Checkout on frontend.
 * This is an OPTIONAL verification step - it does NOT credit the wallet.
 * 
 * IMPORTANT: 
 * - This only verifies that the frontend callback is authentic
 * - Credits are ONLY added via webhook (HandleRazorpayWebhook)
 * - This endpoint is for frontend to confirm payment status to user
 * 
 * Frontend flow after Razorpay Checkout:
 * 1. User completes payment on Razorpay
 * 2. Razorpay redirects/callbacks to frontend with payment details
 * 3. Frontend calls this endpoint to verify the callback
 * 4. Frontend shows success/failure message to user
 * 5. Webhook handles actual credit addition (async)
 */
class VerifyPaymentCallback {
  constructor({ razorpayService, paymentRepository }) {
    this.razorpayService = razorpayService;
    this.paymentRepository = paymentRepository;
  }

  /**
   * Execute the verification
   * 
   * @param {Object} params
   * @param {string} params.razorpayOrderId - Order ID from Razorpay
   * @param {string} params.razorpayPaymentId - Payment ID from Razorpay
   * @param {string} params.razorpaySignature - Signature from Razorpay
   * @returns {Object} Verification result
   */
  async execute({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    // Validate input
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new Error("Missing required parameters: razorpayOrderId, razorpayPaymentId, razorpaySignature");
    }

    // Find payment by order ID
    const payment = await this.paymentRepository.findByRazorpayOrderId(razorpayOrderId);
    
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Verify the signature from Razorpay checkout
    const isValid = this.razorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      console.warn(`[VerifyPaymentCallback] Invalid signature for order ${razorpayOrderId}`);
      return {
        verified: false,
        message: "Payment signature verification failed",
        paymentId: payment.id,
        status: payment.status,
      };
    }

    console.log(`[VerifyPaymentCallback] Signature verified for order ${razorpayOrderId}`);

    // Return current payment status
    // Note: If webhook hasn't processed yet, status might still be "pending"
    // Frontend should handle this gracefully
    return {
      verified: true,
      message: payment.isSuccess() 
        ? "Payment successful. Credits have been added."
        : "Payment verified. Credits will be added shortly.",
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      // Indicate if webhook has processed
      webhookProcessed: payment.isSuccess(),
    };
  }
}

module.exports = VerifyPaymentCallback;
