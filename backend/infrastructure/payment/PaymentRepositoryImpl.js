const PaymentRepository = require("../../domains/payment/repositories/PaymentRepositories");
const Payment = require("../../domains/payment/entities/Payment");
const PaymentModel = require("../db/models/Payment");

/**
 * Payment Repository Implementation
 * 
 * Implements payment data access using MongoDB.
 * Updated for Razorpay integration - removed UPI-specific methods.
 */
class PaymentRepositoryImpl extends PaymentRepository {
  async findById(id) {
    const doc = await PaymentModel.findById(id);
    if (!doc) return null;
    return this._toDomain(doc);
  }

  async findPendingByUser(userId) {
    const doc = await PaymentModel.findOne({
      userId: userId,
      status: "pending",
    });
    if (!doc) return null;
    return this._toDomain(doc);
  }

  /**
   * Find payment by Razorpay order ID
   */
  async findByRazorpayOrderId(razorpayOrderId) {
    const doc = await PaymentModel.findOne({ razorpayOrderId });
    if (!doc) return null;
    return this._toDomain(doc);
  }

  /**
   * Find payment by Razorpay payment ID
   */
  async findByRazorpayPaymentId(razorpayPaymentId) {
    const doc = await PaymentModel.findOne({ razorpayPaymentId });
    if (!doc) return null;
    return this._toDomain(doc);
  }

  /**
   * Find all expired pending payments
   */
  async findExpiredPending(beforeDate) {
    const docs = await PaymentModel.find({
      status: "pending",
      expiresAt: { $lt: beforeDate },
    });
    return docs.map((doc) => this._toDomain(doc));
  }

  async save(payment) {
    const data = {
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpaySignature: payment.razorpaySignature,
      status: payment.status,
      expiresAt: payment.expiresAt,
      createdAt: payment.createdAt,
      verifiedAt: payment.verifiedAt,
      metadata: payment.metadata,
    };

    if (payment.id) {
      await PaymentModel.updateOne({ _id: payment.id }, { $set: data });
    } else {
      const doc = await PaymentModel.create(data);
      payment.id = doc._id.toString();
    }
  }

  _toDomain(doc) {
    return new Payment({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      amount: doc.amount,
      currency: doc.currency,
      razorpayOrderId: doc.razorpayOrderId,
      razorpayPaymentId: doc.razorpayPaymentId,
      razorpaySignature: doc.razorpaySignature,
      status: doc.status,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
      verifiedAt: doc.verifiedAt,
      metadata: doc.metadata || {},
    });
  }
}

module.exports = PaymentRepositoryImpl;
