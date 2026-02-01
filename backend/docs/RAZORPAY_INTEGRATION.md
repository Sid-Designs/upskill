# Razorpay Payment Integration - Implementation Guide

## Overview

This document describes the Razorpay payment integration that replaces the previous manual UPI/UTR-based payment flow.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  1. Request order → 2. Open Razorpay Checkout → 3. Verify callback          │
└─────────────────────────────────────────────────────────────────────────────┘
                │                      │                      │
                ▼                      │                      ▼
┌───────────────────────┐              │       ┌──────────────────────────────┐
│ POST /create-order    │              │       │ POST /verify                 │
│ (authenticated)       │              │       │ (optional verification)      │
└───────────────────────┘              │       └──────────────────────────────┘
                │                      │
                ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RAZORPAY SERVERS                                   │
│                    (processes payment, sends webhook)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │ POST /webhook                │
                        │ (signature verified)         │
                        │ → Credits wallet ✓           │
                        └──────────────────────────────┘
```

## Directory Structure

```
backend/
├── domains/payment/
│   ├── entities/
│   │   └── Payment.js              # Payment domain entity
│   └── repositories/
│       └── PaymentRepositories.js  # Repository interface
│
├── infrastructure/payment/
│   ├── PaymentRepositoryImpl.js    # MongoDB implementation
│   └── services/
│       ├── PaymentService.js       # Domain service
│       └── RazorpayService.js      # Razorpay SDK wrapper (NEW)
│
├── application/payment/usecases/
│   ├── CreatePayment.js            # Creates Razorpay order (UPDATED)
│   ├── HandleRazorpayWebhook.js    # Processes webhooks (NEW)
│   └── VerifyPayment.js            # Verifies frontend callback (UPDATED)
│
└── interfaces/http/
    ├── controllers/
    │   └── PaymentController.js    # HTTP handlers (UPDATED)
    └── routes/
        └── paymentRoutes.js        # Route definitions (UPDATED)
```

## API Endpoints

### 1. Create Razorpay Order
```
POST /api/payment/create-order
Authorization: Bearer <token>

Request:
{
  "amount": 100,           // Amount in INR
  "creditsToAdd": 100      // Optional: defaults to amount
}

Response:
{
  "orderId": "order_xxxxxxxxxxxx",
  "amount": 100,
  "currency": "INR",
  "keyId": "rzp_test_xxxx",    // For frontend checkout
  "paymentId": "...",
  "expiresAt": "2025-01-01T00:30:00Z",
  "isTestMode": true
}
```

### 2. Razorpay Webhook
```
POST /api/payment/webhook
Headers: X-Razorpay-Signature: <signature>

// Razorpay sends this automatically
// DO NOT call this from frontend
```

### 3. Verify Payment (Optional)
```
POST /api/payment/verify
Authorization: Bearer <token>

Request:
{
  "razorpayOrderId": "order_xxxx",
  "razorpayPaymentId": "pay_xxxx",
  "razorpaySignature": "xxxx"
}

Response:
{
  "verified": true,
  "message": "Payment verified. Credits will be added shortly.",
  "status": "pending",           // or "success" if webhook processed
  "webhookProcessed": false
}
```

## Frontend Integration Example

```javascript
// 1. Create order
const response = await fetch('/api/payment/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ amount: 100 })
});

const { orderId, keyId, amount } = await response.json();

// 2. Open Razorpay Checkout
const options = {
  key: keyId,
  amount: amount * 100,  // Razorpay expects paise
  currency: 'INR',
  order_id: orderId,
  name: 'UpSkill AI',
  description: 'Wallet Recharge',
  handler: async function(response) {
    // 3. Verify callback (optional, webhook handles crediting)
    await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature
      })
    });
    
    // Show success message
    alert('Payment successful! Credits will be added shortly.');
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

## Environment Variables

```env
# Test Mode (development)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_test_xxxx

# Live Mode (production) - same variables, different values
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_live_xxxx
```

## Webhook Setup in Razorpay Dashboard

1. Go to **Settings > Webhooks**
2. Click **Add New Webhook**
3. Enter URL: `https://your-domain.com/api/payment/webhook`
4. Select events:
   - `payment.captured` (required)
   - `payment.failed` (recommended)
   - `order.paid` (optional)
5. Copy the webhook secret to `RAZORPAY_WEBHOOK_SECRET`

## Security Considerations

1. **Webhook Signature Verification**: Every webhook is verified using HMAC SHA256
2. **No Frontend Crediting**: Credits are ONLY added via verified webhook
3. **Idempotency**: Webhook handler safely handles duplicate events
4. **Test/Live Isolation**: Different API keys ensure no accidental live charges during development

## Changes from UPI Flow

| Old (UPI)                    | New (Razorpay)                    |
|------------------------------|-----------------------------------|
| `upiRef` field               | `razorpayOrderId` field           |
| `utr` field                  | `razorpayPaymentId` field         |
| `pending_verification` status| Removed (webhook is immediate)    |
| Manual admin verification    | Automatic webhook verification    |
| UPI deep link generation     | Razorpay Checkout SDK             |
| `/confirm` endpoint          | `/webhook` endpoint               |

## Testing

### Test Cards
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **OTP**: 1234

### Testing Webhooks Locally

1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 5000`
3. Use ngrok URL in Razorpay webhook settings
4. Test payments will trigger webhooks to your local server
