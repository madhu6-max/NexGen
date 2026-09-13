const crypto = require('crypto');
const https = require('https');

// Razorpay credentials come ONLY from environment variables.
// There are intentionally no hardcoded fallbacks: when unconfigured, online
// payments fail safely instead of fabricating orders or signatures.
function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const err = new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable online payments.');
    err.code = 'RAZORPAY_NOT_CONFIGURED';
    throw err;
  }

  return { keyId, keySecret };
}

class PaymentService {
  isConfigured() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  getKeyId() {
    return process.env.RAZORPAY_KEY_ID || null;
  }

  /**
   * Create an authoritative Razorpay order via the live Razorpay API.
   * Fails closed (throws) when unconfigured or when the API call fails —
   * a failed call is NEVER reported as a successfully created order.
   * @param {Object} params - { orderId, amount, currency, idempotencyKey }
   * @returns {Promise<Object>}
   */
  async createRazorpayOrder({ orderId, amount, currency = 'INR', idempotencyKey }) {
    if (!orderId || !amount || amount <= 0) {
      throw new Error('Valid order ID and positive amount are required to create a payment order.');
    }

    // Throws RAZORPAY_NOT_CONFIGURED when credentials are missing.
    const { keyId, keySecret } = getCredentials();

    const amountInPaise = Math.round(amount * 100);
    const receipt = ('rcpt_' + String(orderId).replace(/[^a-zA-Z0-9_]/g, '')).slice(0, 40);

    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt,
        notes: { orderId, idempotencyKey: idempotencyKey || '' }
      });

      const auth = Buffer.from(keyId + ':' + keySecret).toString('base64');
      const apiReq = https.request({
        hostname: 'api.razorpay.com',
        port: 443,
        path: '/v1/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization': 'Basic ' + auth
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (parseErr) {
            json = null;
          }

          if (res.statusCode >= 200 && res.statusCode < 300 && json && json.id) {
            return resolve({
              success: true,
              id: json.id,
              amount: json.amount,
              currency: json.currency,
              receipt: json.receipt,
              keyId
            });
          }

          // Fail closed: never fabricate a successful order on API failure.
          const detail = json && json.error
            ? (json.error.description || json.error.code || '')
            : '';
          reject(new Error(`Razorpay order creation failed (HTTP ${res.statusCode}). ${detail}`.trim()));
        });
      });

      apiReq.on('error', (err) => {
        reject(new Error(`Razorpay order creation failed: ${err.message}`));
      });

      apiReq.write(payload);
      apiReq.end();
    });
  }

  /**
   * Verify a Razorpay payment signature using real HMAC-SHA256 cryptography.
   * No test/fake/sandbox bypass signatures are accepted. Returns false when
   * credentials are missing (fail closed).
   * @param {Object} params - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   * @returns {boolean}
   */
  verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return false;
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest();

    let providedSignature;
    try {
      providedSignature = Buffer.from(String(razorpay_signature), 'hex');
    } catch (parseErr) {
      return false;
    }

    if (providedSignature.length !== expectedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedSignature, providedSignature);
  }
}

module.exports = new PaymentService();
