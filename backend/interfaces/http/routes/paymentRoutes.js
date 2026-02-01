const express = require("express");
const router = express.Router();

const PaymentController = require("../controllers/PaymentController");
const authenticateJWT = require("../../middleware/authenticateJWT");
const asyncHandler = require("../../middleware/asyncHandler");

// Infrastructure Layer
const PaymentRepositoryImpl = require("../../../infrastructure/payment/PaymentRepositoryImpl");
const ProfileRepositoryImpl = require("../../../infrastructure/repositories/ProfileRepositoryImpl");
const RazorpayService = require("../../../infrastructure/payment/services/RazorpayService");

// Application Layer - Use Cases
const CreateRazorpayOrder = require("../../../application/payment/usecases/CreatePayment");
const HandleRazorpayWebhook = require("../../../application/payment/usecases/HandleRazorpayWebhook");
const VerifyPaymentCallback = require("../../../application/payment/usecases/VerifyPayment");

// Initialize dependencies
const paymentRepository = new PaymentRepositoryImpl();
const profileRepository = new ProfileRepositoryImpl();
const razorpayService = new RazorpayService();

// Initialize use cases with dependencies
const createRazorpayOrderUseCase = new CreateRazorpayOrder({ 
  razorpayService, 
  paymentRepository 
});

const handleRazorpayWebhookUseCase = new HandleRazorpayWebhook({ 
  razorpayService, 
  paymentRepository,
  profileRepository,
});

const verifyPaymentCallbackUseCase = new VerifyPaymentCallback({ 
  razorpayService, 
  paymentRepository 
});

// Initialize controller with use cases
const paymentController = new PaymentController({ 
  createRazorpayOrderUseCase, 
  handleRazorpayWebhookUseCase,
  verifyPaymentCallbackUseCase,
});

/**
 * PAYMENT ROUTES - Razorpay Integration
 * 
 * Flow:
 * 1. Frontend calls POST /create-order with amount
 * 2. Backend creates Razorpay order, returns orderId + keyId
 * 3. Frontend opens Razorpay Checkout with orderId
 * 4. User completes payment on Razorpay
 * 5. Razorpay sends webhook to POST /webhook
 * 6. Backend verifies webhook signature, credits wallet
 * 7. Frontend calls POST /verify to confirm (optional)
 */

// Create Razorpay Order - Requires authentication
// POST /api/payment/create-order
router.post("/create-order", authenticateJWT, asyncHandler(paymentController.createOrder));

/**
 * Razorpay Webhook Endpoint
 * POST /api/payment/webhook
 * 
 * IMPORTANT: This endpoint must NOT have authentication middleware
 * because webhooks come from Razorpay servers, not from authenticated users.
 * 
 * Security is ensured via webhook signature verification.
 * 
 * NOTE: The main Express app must be configured to parse raw body for this route
 * so that webhook signature verification works correctly.
 * 
 * In your main app.js/index.js, add:
 * ```
 * app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
 * ```
 * BEFORE the regular express.json() middleware.
 */
router.post("/webhook", asyncHandler(paymentController.handleWebhook));

// Verify Payment Callback - Requires authentication
// POST /api/payment/verify
// Called by frontend after Razorpay Checkout completes
// This does NOT credit wallet - that's done by webhook
router.post("/verify", authenticateJWT, asyncHandler(paymentController.verifyPayment));

module.exports = router;

