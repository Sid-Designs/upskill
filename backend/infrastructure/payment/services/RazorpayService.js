/**
 * Razorpay Service - Infrastructure Layer
 * 
 * This service handles all direct interactions with the Razorpay SDK.
 * It abstracts away the Razorpay-specific implementation details from the application layer.
 * 
 * IMPORTANT: Test vs Live Mode
 * ----------------------------
 * The same code works for both Test and Live environments.
 * The mode is determined SOLELY by the environment variables:
 * 
 * For TEST mode:
 *   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
 *   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxx
 * 
 * For LIVE mode:
 *   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
 *   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxx
 * 
 * The test key IDs start with "rzp_test_" and live keys start with "rzp_live_"
 * No code changes are needed to switch between modes.
 */

const Razorpay = require("razorpay");
const crypto = require("crypto");

class RazorpayService {
  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Validate environment variables
    if (!keyId || !keySecret) {
      console.error("[RazorpayService] Missing environment variables:");
      console.error(`  RAZORPAY_KEY_ID: ${keyId ? "✓ Set" : "✗ Missing"}`);
      console.error(`  RAZORPAY_KEY_SECRET: ${keySecret ? "✓ Set" : "✗ Missing"}`);
      throw new Error(
        "Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file."
      );
    }

    // Initialize Razorpay instance with environment variables
    // TEST vs LIVE mode is determined by the key prefix (rzp_test_ vs rzp_live_)
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    console.log(`[RazorpayService] Initialized in ${this.isTestMode() ? "TEST" : "LIVE"} mode`);
  }

  /**
   * Creates a Razorpay order.
   * The order must be created before the frontend can initiate payment.
   * 
   * @param {Object} options - Order options
   * @param {number} options.amount - Amount in smallest currency unit (paise for INR)
   * @param {string} options.currency - Currency code (default: INR)
   * @param {string} options.receipt - Unique receipt ID for your reference
   * @param {Object} options.notes - Additional notes (will be returned in webhook)
   * @returns {Promise<Object>} Razorpay order object
   */
  async createOrder({ amount, currency = "INR", receipt, notes = {} }) {
    try {
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt,
        notes,
      };

      const order = await this.razorpay.orders.create(options);
      
      console.log(`[RazorpayService] Order created: ${order.id}`);
      
      return {
        orderId: order.id,
        amount: order.amount / 100, // Convert back to rupees
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
      };
    } catch (error) {
      console.error("[RazorpayService] Error creating order:", error.message);
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  /**
   * Verifies the webhook signature from Razorpay.
   * This is CRITICAL for security - never trust payment success without this verification.
   * 
   * Razorpay signs the webhook payload with HMAC SHA256 using your webhook secret.
   * We must verify this signature before processing any payment.
   * 
   * @param {string} body - Raw request body (string)
   * @param {string} signature - Signature from X-Razorpay-Signature header
   * @returns {boolean} True if signature is valid
   */
  verifyWebhookSignature(body, signature) {
    if (!this.webhookSecret) {
      console.error("[RazorpayService] Webhook secret not configured");
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(body)
        .digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );

      if (!isValid) {
        console.warn("[RazorpayService] Webhook signature verification failed");
      }

      return isValid;
    } catch (error) {
      console.error("[RazorpayService] Error verifying webhook signature:", error.message);
      return false;
    }
  }

  /**
   * Verifies the payment signature from frontend callback.
   * This is an additional verification layer (webhook is still the source of truth).
   * 
   * @param {string} orderId - Razorpay order ID
   * @param {string} paymentId - Razorpay payment ID
   * @param {string} signature - Signature from Razorpay checkout
   * @returns {boolean} True if signature is valid
   */
  verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      const body = orderId + "|" + paymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );
    } catch (error) {
      console.error("[RazorpayService] Error verifying payment signature:", error.message);
      return false;
    }
  }

  /**
   * Fetches order details from Razorpay.
   * Useful for verifying order status.
   * 
   * @param {string} orderId - Razorpay order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrder(orderId) {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      return order;
    } catch (error) {
      console.error("[RazorpayService] Error fetching order:", error.message);
      throw new Error(`Failed to fetch Razorpay order: ${error.message}`);
    }
  }

  /**
   * Fetches payment details from Razorpay.
   * 
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  async getPayment(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error("[RazorpayService] Error fetching payment:", error.message);
      throw new Error(`Failed to fetch Razorpay payment: ${error.message}`);
    }
  }

  /**
   * Returns the Razorpay key ID (public key) for frontend.
   * This is safe to expose to the frontend.
   * 
   * @returns {string} Razorpay key ID
   */
  getKeyId() {
    return process.env.RAZORPAY_KEY_ID;
  }

  /**
   * Check if we're running in test mode.
   * Test keys start with "rzp_test_"
   * 
   * @returns {boolean} True if using test credentials
   */
  isTestMode() {
    return process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") ?? false;
  }
}

module.exports = RazorpayService;
