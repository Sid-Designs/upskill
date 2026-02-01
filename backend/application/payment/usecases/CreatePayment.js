const { v4: uuidv4 } = require("uuid");
const Payment = require("../../../domains/payment/entities/Payment");

/**
 * CreateRazorpayOrder Use Case
 * 
 * Creates a Razorpay order for payment processing.
 * This is the first step in the payment flow:
 * 1. User requests to buy credits
 * 2. Backend creates Razorpay order (this use case)
 * 3. Backend returns order details to frontend
 * 4. Frontend opens Razorpay Checkout with order ID
 * 5. User completes payment
 * 6. Razorpay sends webhook → HandleRazorpayWebhook use case
 * 
 * IMPORTANT: Credits are NOT added here. They are added only after
 * webhook verification in HandleRazorpayWebhook.
 */
class CreateRazorpayOrder {
  constructor({ razorpayService, paymentRepository }) {
    this.razorpayService = razorpayService;
    this.paymentRepository = paymentRepository;
  }

  /**
   * Execute the use case
   * 
   * @param {Object} params
   * @param {string} params.userId - User ID
   * @param {number} params.amount - Amount in INR
   * @param {number} params.creditsToAdd - Credits to add after successful payment (optional, defaults to amount)
   * @returns {Object} Order details for frontend
   */
  async execute({ userId, amount, creditsToAdd }) {
    // Validate input
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!amount || amount <= 0) {
      throw new Error("Invalid payment amount");
    }

    // Cancel any existing pending payment for this user
    const existingPayment = await this.paymentRepository.findPendingByUser(userId);
    if (existingPayment) {
      existingPayment.cancel();
      await this.paymentRepository.save(existingPayment);
      console.log(`[CreateRazorpayOrder] Cancelled existing pending payment for user ${userId}`);
    }

    // Generate unique receipt ID for tracking
    const receipt = `upskill_${uuidv4().substring(0, 8)}`;

    // Calculate credits to add (default: 1 credit = 1 INR)
    const credits = creditsToAdd || Math.floor(amount);

    // Create Razorpay order via infrastructure service
    const razorpayOrder = await this.razorpayService.createOrder({
      amount,
      currency: "INR",
      receipt,
      notes: {
        userId,
        creditsToAdd: credits,
        purpose: "wallet_recharge",
      },
    });

    // Payment expires in 30 minutes (Razorpay orders expire in ~30 minutes by default)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Create payment entity
    const payment = new Payment({
      userId,
      amount,
      currency: "INR",
      razorpayOrderId: razorpayOrder.orderId,
      status: Payment.STATUS.PENDING,
      expiresAt,
      metadata: {
        receipt,
        creditsToAdd: credits,
      },
    });

    // Save payment to database
    await this.paymentRepository.save(payment);

    console.log(`[CreateRazorpayOrder] Created order ${razorpayOrder.orderId} for user ${userId}`);

    // Return order details for frontend
    // Frontend needs: orderId, amount, currency, keyId
    return {
      orderId: razorpayOrder.orderId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: this.razorpayService.getKeyId(), // Public key for frontend
      paymentId: payment.id,
      expiresAt: payment.expiresAt,
      // Additional info for frontend checkout options
      prefill: {
        // Can be populated from user profile if needed
      },
      notes: {
        paymentId: payment.id,
      },
      // Indicate if we're in test mode (useful for frontend to show test banner)
      isTestMode: this.razorpayService.isTestMode(),
    };
  }
}

module.exports = CreateRazorpayOrder;
