/**
 * Payment Controller
 * 
 * Handles HTTP requests for payment operations.
 * Updated for Razorpay integration.
 * 
 * Endpoints:
 * - POST /create-order: Creates a Razorpay order for payment
 * - POST /webhook: Handles Razorpay webhook events (payment success/failure)
 * - POST /verify: Verifies payment callback from frontend (optional)
 * - GET /status/:paymentId: Gets payment status
 * 
 * IMPORTANT:
 * - /webhook must receive raw body for signature verification
 * - Credits are ONLY added via webhook, never via frontend callback
 */
class PaymentController {
  constructor({ createRazorpayOrderUseCase, handleRazorpayWebhookUseCase, verifyPaymentCallbackUseCase }) {
    this.createRazorpayOrderUseCase = createRazorpayOrderUseCase;
    this.handleRazorpayWebhookUseCase = handleRazorpayWebhookUseCase;
    this.verifyPaymentCallbackUseCase = verifyPaymentCallbackUseCase;
  }

  /**
   * Create Razorpay Order
   * POST /api/payment/create-order
   * 
   * Request body: { amount: number, creditsToAdd?: number }
   * Response: { orderId, amount, currency, keyId, paymentId, expiresAt, isTestMode }
   */
  createOrder = async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount, creditsToAdd } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: "Valid amount is required",
        });
      }

      const result = await this.createRazorpayOrderUseCase.execute({
        userId,
        amount,
        creditsToAdd,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("[PaymentController] createOrder error:", error.message);

      return res.status(400).json({
        error: error.message,
      });
    }
  };

  /**
   * Handle Razorpay Webhook
   * POST /api/payment/webhook
   * 
   * IMPORTANT: This endpoint must receive raw body (not parsed JSON)
   * for signature verification to work correctly.
   * 
   * Headers required: X-Razorpay-Signature
   * 
   * Always returns 200 to acknowledge receipt (even on error)
   * This prevents Razorpay from retrying indefinitely.
   */
  handleWebhook = async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      
      if (!signature) {
        console.error("[PaymentController] Webhook missing signature header");
        // Return 200 to prevent Razorpay from retrying
        return res.status(200).json({ status: "error", message: "Missing signature" });
      }

      // req.rawBody should be set by middleware for webhook routes
      const rawBody = req.rawBody || JSON.stringify(req.body);
      const payload = req.body;

      const result = await this.handleRazorpayWebhookUseCase.execute({
        rawBody,
        signature,
        payload,
      });

      console.log(`[PaymentController] Webhook processed: ${result.status}`);

      return res.status(200).json(result);
    } catch (error) {
      console.error("[PaymentController] handleWebhook error:", error.message);

      // Always return 200 to acknowledge webhook receipt
      // Log the error for investigation but don't cause Razorpay to retry
      return res.status(200).json({
        status: "error",
        message: error.message,
      });
    }
  };

  /**
   * Verify Payment Callback
   * POST /api/payment/verify
   * 
   * Called by frontend after Razorpay Checkout completes.
   * This verifies the payment signature but does NOT credit wallet.
   * Wallet is credited only via webhook.
   * 
   * Request body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
   * Response: { verified, message, paymentId, status, webhookProcessed }
   */
  verifyPayment = async (req, res) => {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({
          error: "razorpayOrderId, razorpayPaymentId, and razorpaySignature are required",
        });
      }

      const result = await this.verifyPaymentCallbackUseCase.execute({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("[PaymentController] verifyPayment error:", error.message);

      return res.status(400).json({
        error: error.message,
      });
    }
  };

  /**
   * Get Payment Status
   * GET /api/payment/status/:paymentId
   * 
   * Returns current status of a payment.
   * Frontend can poll this to check if webhook has processed.
   */
  getPaymentStatus = async (req, res) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      if (!paymentId) {
        return res.status(400).json({
          error: "paymentId is required",
        });
      }

      // This would need a paymentRepository injected
      // For now, we'll use the verify use case's repository access
      // In a production app, you'd inject the repository directly
      return res.status(501).json({
        error: "Not implemented - use /verify endpoint instead",
      });
    } catch (error) {
      console.error("[PaymentController] getPaymentStatus error:", error.message);

      return res.status(400).json({
        error: error.message,
      });
    }
  };
}

module.exports = PaymentController;

