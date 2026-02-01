/**
 * Payment Repository Interface
 * 
 * Defines the contract for payment data access.
 * Updated for Razorpay integration - removed UPI-specific methods.
 */
class PaymentRepository {
  async findById(id) {
    throw new Error("Not implemented");
  }

  async findPendingByUser(userId) {
    throw new Error("Not implemented");
  }

  /**
   * Find payment by Razorpay order ID
   * @param {string} razorpayOrderId 
   */
  async findByRazorpayOrderId(razorpayOrderId) {
    throw new Error("Not implemented");
  }

  /**
   * Find payment by Razorpay payment ID
   * @param {string} razorpayPaymentId 
   */
  async findByRazorpayPaymentId(razorpayPaymentId) {
    throw new Error("Not implemented");
  }

  async save(payment) {
    throw new Error("Not implemented");
  }

  /**
   * Find all expired pending payments
   * @param {Date} beforeDate - Find payments that expired before this date
   */
  async findExpiredPending(beforeDate) {
    throw new Error("Not implemented");
  }
}

module.exports = PaymentRepository;

