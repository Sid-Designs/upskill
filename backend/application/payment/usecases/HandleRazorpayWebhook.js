/**
 * HandleRazorpayWebhook Use Case
 * 
 * Processes Razorpay webhook events for payment completion.
 * This is the ONLY place where payment success is confirmed and credits are added.
 * 
 * CRITICAL SECURITY:
 * - Webhook signature MUST be verified before processing
 * - Never trust frontend callbacks for crediting wallet
 * - Idempotency: Same webhook can be received multiple times
 * 
 * Supported Events:
 * - payment.captured: Payment was successful
 * - payment.failed: Payment failed
 * - order.paid: Order was paid (alternative to payment.captured)
 */
class HandleRazorpayWebhook {
  constructor({ razorpayService, paymentRepository, profileRepository }) {
    this.razorpayService = razorpayService;
    this.paymentRepository = paymentRepository;
    this.profileRepository = profileRepository;
  }

  /**
   * Execute the webhook handler
   * 
   * @param {Object} params
   * @param {string} params.rawBody - Raw request body string (for signature verification)
   * @param {string} params.signature - X-Razorpay-Signature header value
   * @param {Object} params.payload - Parsed webhook payload
   * @returns {Object} Processing result
   */
  async execute({ rawBody, signature, payload }) {
    // Step 1: Verify webhook signature
    // This is CRITICAL - never process webhooks without verification
    const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);
    
    if (!isValid) {
      console.error("[HandleRazorpayWebhook] Invalid webhook signature");
      throw new Error("Invalid webhook signature");
    }

    console.log(`[HandleRazorpayWebhook] Received event: ${payload.event}`);

    // Step 2: Route to appropriate handler based on event type
    switch (payload.event) {
      case "payment.captured":
        return await this._handlePaymentCaptured(payload);
      
      case "payment.failed":
        return await this._handlePaymentFailed(payload);
      
      case "order.paid":
        return await this._handleOrderPaid(payload);
      
      default:
        console.log(`[HandleRazorpayWebhook] Ignoring event: ${payload.event}`);
        return { status: "ignored", event: payload.event };
    }
  }

  /**
   * Handle successful payment capture
   * This is where credits are added to the user's wallet
   */
  async _handlePaymentCaptured(payload) {
    const paymentData = payload.payload.payment.entity;
    const orderId = paymentData.order_id;
    const paymentId = paymentData.id;

    console.log(`[HandleRazorpayWebhook] Processing payment.captured for order ${orderId}`);

    // Find payment by Razorpay order ID
    const payment = await this.paymentRepository.findByRazorpayOrderId(orderId);
    
    if (!payment) {
      console.error(`[HandleRazorpayWebhook] Payment not found for order ${orderId}`);
      throw new Error("Payment not found");
    }

    // Idempotency check: If already processed, return success
    if (payment.isSuccess()) {
      console.log(`[HandleRazorpayWebhook] Payment ${payment.id} already processed`);
      return { 
        status: "already_processed", 
        paymentId: payment.id,
        razorpayOrderId: orderId,
      };
    }

    // Check if payment is in valid state
    if (!payment.isPending()) {
      console.warn(`[HandleRazorpayWebhook] Payment ${payment.id} is not pending, status: ${payment.status}`);
      return { 
        status: "invalid_state", 
        paymentId: payment.id,
        currentStatus: payment.status,
      };
    }

    // Mark payment as successful
    // The signature in webhook is the webhook signature, not payment signature
    // For payment signature, we'd need razorpay_signature from frontend callback
    payment.markSuccessFromWebhook(paymentId, "webhook_verified");

    // Save payment update
    await this.paymentRepository.save(payment);

    // Add credits to user's wallet
    const creditsToAdd = payment.getCreditsToAdd();
    await this.profileRepository.addCredits(payment.userId, creditsToAdd);

    console.log(`[HandleRazorpayWebhook] Payment ${payment.id} successful. Added ${creditsToAdd} credits to user ${payment.userId}`);

    return {
      status: "success",
      paymentId: payment.id,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      creditsAdded: creditsToAdd,
      userId: payment.userId,
    };
  }

  /**
   * Handle failed payment
   */
  async _handlePaymentFailed(payload) {
    const paymentData = payload.payload.payment.entity;
    const orderId = paymentData.order_id;
    const errorCode = paymentData.error_code;
    const errorDescription = paymentData.error_description;

    console.log(`[HandleRazorpayWebhook] Processing payment.failed for order ${orderId}: ${errorDescription}`);

    // Find payment by Razorpay order ID
    const payment = await this.paymentRepository.findByRazorpayOrderId(orderId);
    
    if (!payment) {
      console.error(`[HandleRazorpayWebhook] Payment not found for order ${orderId}`);
      throw new Error("Payment not found");
    }

    // Idempotency check
    if (payment.isFinalized()) {
      console.log(`[HandleRazorpayWebhook] Payment ${payment.id} already finalized`);
      return { 
        status: "already_processed", 
        paymentId: payment.id,
        razorpayOrderId: orderId,
      };
    }

    // Mark payment as failed
    payment.markFailed();
    payment.metadata = {
      ...payment.metadata,
      failureReason: errorDescription,
      errorCode: errorCode,
    };

    // Save payment update
    await this.paymentRepository.save(payment);

    console.log(`[HandleRazorpayWebhook] Payment ${payment.id} marked as failed`);

    return {
      status: "failed",
      paymentId: payment.id,
      razorpayOrderId: orderId,
      reason: errorDescription,
    };
  }

  /**
   * Handle order.paid event (alternative to payment.captured)
   * Some integrations use this instead of payment.captured
   */
  async _handleOrderPaid(payload) {
    const orderData = payload.payload.order.entity;
    const orderId = orderData.id;
    const paymentId = payload.payload.payment?.entity?.id;

    console.log(`[HandleRazorpayWebhook] Processing order.paid for order ${orderId}`);

    // Find payment by Razorpay order ID
    const payment = await this.paymentRepository.findByRazorpayOrderId(orderId);
    
    if (!payment) {
      console.error(`[HandleRazorpayWebhook] Payment not found for order ${orderId}`);
      throw new Error("Payment not found");
    }

    // Idempotency check
    if (payment.isSuccess()) {
      console.log(`[HandleRazorpayWebhook] Payment ${payment.id} already processed`);
      return { 
        status: "already_processed", 
        paymentId: payment.id,
        razorpayOrderId: orderId,
      };
    }

    // Check if payment is in valid state
    if (!payment.isPending()) {
      console.warn(`[HandleRazorpayWebhook] Payment ${payment.id} is not pending, status: ${payment.status}`);
      return { 
        status: "invalid_state", 
        paymentId: payment.id,
        currentStatus: payment.status,
      };
    }

    // Mark payment as successful
    payment.markSuccessFromWebhook(paymentId || "order_paid", "webhook_verified");

    // Save payment update
    await this.paymentRepository.save(payment);

    // Add credits to user's wallet
    const creditsToAdd = payment.getCreditsToAdd();
    await this.profileRepository.addCredits(payment.userId, creditsToAdd);

    console.log(`[HandleRazorpayWebhook] Payment ${payment.id} successful via order.paid. Added ${creditsToAdd} credits to user ${payment.userId}`);

    return {
      status: "success",
      paymentId: payment.id,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      creditsAdded: creditsToAdd,
      userId: payment.userId,
    };
  }
}

module.exports = HandleRazorpayWebhook;
