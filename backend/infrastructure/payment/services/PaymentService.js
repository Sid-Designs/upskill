const Payment = require("../../../domains/payment/entities/Payment");

/**
 * Payment Domain Service
 * 
 * This service contains domain logic for payment operations.
 * Updated for Razorpay integration - removed UPI-specific logic.
 * 
 * Note: Most Razorpay-specific operations are in RazorpayService (infrastructure).
 * This service handles domain-level operations like expiration.
 */
class PaymentService {
  constructor({ paymentRepository }) {
    this.paymentRepository = paymentRepository;
  }

  /**
   * Expire all pending payments that have passed their expiry time.
   * This can be called by a cron job or scheduled task.
   * 
   * @returns {Promise<number>} Number of payments expired
   */
  async expirePendingPayments() {
    const now = new Date();
    const expiredPayments = await this.paymentRepository.findExpiredPending(now);
    
    let count = 0;
    for (const payment of expiredPayments) {
      payment.expire(now);
      await this.paymentRepository.save(payment);
      count++;
    }
    
    if (count > 0) {
      console.log(`[PaymentService] Expired ${count} pending payments`);
    }
    
    return count;
  }

  /**
   * Get payment status for a user.
   * Useful for frontend to check if there's a pending payment.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Payment|null>} Pending payment or null
   */
  async getPendingPaymentForUser(userId) {
    return await this.paymentRepository.findPendingByUser(userId);
  }

  /**
   * Cancel a pending payment.
   * 
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Payment>} Cancelled payment
   */
  async cancelPayment(paymentId) {
    const payment = await this.paymentRepository.findById(paymentId);
    
    if (!payment) {
      throw new Error("Payment not found");
    }

    payment.cancel();
    await this.paymentRepository.save(payment);
    
    return payment;
  }
}

module.exports = PaymentService;

