const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const paymentService = require('../services/paymentService');
const { authenticate } = require('../middleware/auth');

// Resolve the caller's own farmer/org ids from the verified JWT (DB-verified,
// never from client-supplied ids). Returns { farmerId, buyerId } (null when none).
async function getCallerParties(req) {
  let farmerId = null;
  let buyerId = null;
  if (req.user.role === 'farmer') {
    const f = await get(`SELECT id FROM farmers WHERE user_id = ?`, [req.user.id]);
    if (f) farmerId = f.id;
  } else if (req.user.role === 'buyer') {
    const o = await get(`SELECT id FROM organizations WHERE user_id = ?`, [req.user.id]);
    if (o) buyerId = o.id;
  }
  return { farmerId, buyerId };
}

// True when the caller is admin or the farmer/buyer participant recorded on the
// order row (ownership taken from the database row, not the client).
function isOrderParticipant(req, order, parties) {
  if (req.user.role === 'admin') return true;
  return (parties.farmerId && order.farmer_id === parties.farmerId) ||
    (parties.buyerId && order.buyer_id === parties.buyerId);
}

// GET /api/payments/config (Expose only public Key ID; never any secret)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    keyId: paymentService.getKeyId(),
    configured: paymentService.isConfigured(),
    environment: 'test'
  });
});

// POST /api/payments/create-order (Initiate COD or Razorpay Order)
// Only the buying organization of the order (or admin) may initiate payment.
// The amount always comes from the database order; client amounts are ignored.
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { orderId, payment_method, idempotency_key } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required.' });
    }

    const order = await get(`SELECT * FROM orders WHERE id = ? OR order_code = ?`, [orderId, orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (req.user.role !== 'admin') {
      const parties = await getCallerParties(req);
      if (!parties.buyerId || order.buyer_id !== parties.buyerId) {
        return res.status(403).json({ error: 'Access denied. Only the buyer of this order can initiate payment.' });
      }
    }

    // Protect against payment on already-paid orders
    if (order.payment_status === 'PAID') {
      return res.status(400).json({ error: 'Order has already been paid and confirmed.' });
    }

    // Idempotency: a reused key returns the existing state, never a duplicate row.
    if (idempotency_key) {
      const existingTx = await get(
        `SELECT * FROM payment_transactions WHERE order_id = ? AND idempotency_key = ? ORDER BY created_at DESC LIMIT 1`,
        [order.id, idempotency_key]
      );
      if (existingTx) {
        const currentOrder = await get(`SELECT * FROM orders WHERE id = ?`, [order.id]);
        return res.status(200).json({
          success: true,
          idempotent: true,
          message: 'Duplicate request ignored: this payment was already initiated.',
          method: existingTx.payment_method,
          paymentStatus: currentOrder.payment_status,
          orderStatus: currentOrder.status,
          razorpayOrderId: existingTx.razorpay_order_id || undefined,
          order: currentOrder
        });
      }
    }

    // Authoritative amount strictly from locked backend order
    const authoritativeAmount = parseFloat(order.total_value);
    const method = payment_method === 'COD' ? 'COD' : 'ONLINE_RAZORPAY';
    const now = new Date().toISOString();

    if (method === 'COD') {
      const txId = `tx_${Date.now()}`;
      await run(`
        INSERT INTO payment_transactions (
          id, order_id, payment_method, payment_status, amount, currency, idempotency_key, created_at, updated_at
        ) VALUES (?, ?, 'COD', 'COD_PENDING', ?, 'INR', ?, ?, ?)
      `, [txId, order.id, authoritativeAmount, idempotency_key || `idemp_${Date.now()}`, now, now]);

      await run(`
        UPDATE orders
        SET payment_method = 'COD',
            payment_status = 'COD_PENDING',
            status = 'Order Confirmed'
        WHERE id = ?
      `, [order.id]);

      await run(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by_role, changed_by_name, notes, created_at)
        VALUES (?, ?, ?, 'Order Confirmed', 'buyer', 'Buyer Checkout', 'Payment method selected: Cash on Delivery (COD)', ?)
      `, [`osh_${Date.now()}`, order.id, order.status, now]);

      const updatedOrder = await get(`SELECT * FROM orders WHERE id = ?`, [order.id]);

      return res.status(201).json({
        success: true,
        method: 'COD',
        paymentStatus: 'COD_PENDING',
        orderStatus: 'Order Confirmed',
        order: updatedOrder
      });
    }

    // Online Razorpay Flow — fails safely when unconfigured or when the
    // Razorpay API call fails. A failure is never reported as success and no
    // transaction row is created for it.
    let rzpOrder;
    try {
      rzpOrder = await paymentService.createRazorpayOrder({
        orderId: order.id,
        amount: authoritativeAmount,
        currency: 'INR',
        idempotencyKey: idempotency_key
      });
    } catch (rzpErr) {
      console.error('Razorpay order creation failed:', rzpErr.code || rzpErr.message);
      return res.status(503).json({
        error: rzpErr.code === 'RAZORPAY_NOT_CONFIGURED'
          ? 'Online payments are currently unavailable (payment gateway not configured). Please use Cash on Delivery.'
          : 'Online payment initiation failed. Please retry or use Cash on Delivery.'
      });
    }

    const txId = `tx_${Date.now()}`;
    await run(`
      INSERT INTO payment_transactions (
        id, order_id, payment_method, payment_status, amount, currency, razorpay_order_id, idempotency_key, created_at, updated_at
      ) VALUES (?, ?, 'ONLINE_RAZORPAY', 'PENDING', ?, 'INR', ?, ?, ?, ?)
    `, [txId, order.id, authoritativeAmount, rzpOrder.id, idempotency_key || `idemp_${Date.now()}`, now, now]);

    await run(`
      UPDATE orders
      SET payment_method = 'ONLINE_RAZORPAY',
          payment_status = 'PENDING'
      WHERE id = ?
    `, [order.id]);

    res.status(201).json({
      success: true,
      method: 'ONLINE_RAZORPAY',
      razorpayOrderId: rzpOrder.id,
      amount: authoritativeAmount,
      amountPaise: rzpOrder.amount,
      currency: 'INR',
      keyId: rzpOrder.keyId,
      orderId: order.id,
      orderCode: order.order_code,
      customer: {
        buyerId: order.buyer_id
      }
    });
  } catch (err) {
    console.error('Payment creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/verify (Authoritative signature verification)
// Only a farmer/buyer participant of the order (or admin) may verify, and the
// Razorpay order id must belong to a transaction of that same order.
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification parameters.' });
    }

    const order = await get(`SELECT * FROM orders WHERE id = ? OR order_code = ?`, [orderId, orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (!isOrderParticipant(req, order, await getCallerParties(req))) {
      return res.status(403).json({ error: 'Access denied. You are not a participant of this order.' });
    }

    // The payment transaction must belong to this order (no cross-order replay).
    const matchingTx = await get(
      `SELECT id FROM payment_transactions WHERE order_id = ? AND razorpay_order_id = ?`,
      [order.id, razorpay_order_id]
    );
    if (!matchingTx) {
      return res.status(400).json({ error: 'No matching payment transaction found for this order.' });
    }

    // Idempotency: If already paid, return success directly
    if (order.payment_status === 'PAID') {
      return res.json({
        success: true,
        message: 'Payment has already been authoritatively verified.',
        paymentStatus: 'PAID',
        orderStatus: order.status
      });
    }

    // Authoritatively verify signature (real HMAC only; fakes rejected)
    const isValid = paymentService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    const now = new Date().toISOString();

    if (!isValid) {
      // Record failed transaction
      await run(`
        UPDATE payment_transactions
        SET payment_status = 'FAILED',
            error_reason = 'Invalid payment signature mismatch',
            updated_at = ?
        WHERE order_id = ? AND razorpay_order_id = ?
      `, [now, order.id, razorpay_order_id]);

      await run(`UPDATE orders SET payment_status = 'FAILED' WHERE id = ?`, [order.id]);

      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Verification failed.',
        paymentStatus: 'FAILED',
        orderStatus: order.status
      });
    }

    // Mark PAID and CONFIRMED
    await run(`
      UPDATE payment_transactions
      SET payment_status = 'PAID',
          razorpay_payment_id = ?,
          razorpay_signature = ?,
          updated_at = ?
      WHERE order_id = ? AND razorpay_order_id = ?
    `, [razorpay_payment_id, razorpay_signature, now, order.id, razorpay_order_id]);

    await run(`
      UPDATE orders
      SET payment_status = 'PAID',
          payment_method = 'ONLINE_RAZORPAY',
          status = 'Order Confirmed'
      WHERE id = ?
    `, [order.id]);

    // Audit log
    await run(`
      INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by_role, changed_by_name, notes, created_at)
      VALUES (?, ?, ?, 'Order Confirmed', 'system', 'Payment Gateway', ?, ?)
    `, [
      `osh_${Date.now()}`, order.id, order.status,
      `Razorpay payment verified (Payment ID: ${razorpay_payment_id})`, now
    ]);

    // Notifications
    const farmerUser = await get(`SELECT u.id FROM farmers f JOIN users u ON f.user_id = u.id WHERE f.id = ?`, [order.farmer_id]);
    if (farmerUser) {
      await run(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Payment Received (PAID)', ?, 'order', '/farmer/orders')
      `, [
        `notif_${Date.now()}`, farmerUser.id,
        `Buyer completed online payment of ₹${order.total_value.toLocaleString()} for Order ${order.order_code}. Funds secured in escrow.`
      ]);
    }

    const updatedOrder = await get(`SELECT * FROM orders WHERE id = ?`, [order.id]);

    res.json({
      success: true,
      message: 'Payment successfully verified!',
      paymentStatus: 'PAID',
      orderStatus: 'Order Confirmed',
      order: updatedOrder
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/order/:orderId/transactions
// Participants of the order (or admin) only.
router.get('/order/:orderId/transactions', authenticate, async (req, res) => {
  try {
    const parentOrder = await get(`SELECT * FROM orders WHERE id = ? OR order_code = ?`, [req.params.orderId, req.params.orderId]);
    if (!parentOrder) return res.status(404).json({ error: 'Order not found.' });

    if (!isOrderParticipant(req, parentOrder, await getCallerParties(req))) {
      return res.status(403).json({ error: 'Access denied. You are not a participant of this order.' });
    }

    const transactions = await query(`
      SELECT * FROM payment_transactions
      WHERE order_id = ?
      ORDER BY created_at DESC
    `, [req.params.orderId]);

    const history = await query(`
      SELECT * FROM order_status_history
      WHERE order_id = ?
      ORDER BY created_at ASC
    `, [req.params.orderId]);

    res.json({ success: true, transactions, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/receipt/:orderId (Payment receipt)
// Participants of the order (or admin) only.
// The receipt reports only real stored data: no fabricated bank accounts,
// compliance claims, GSTINs, phone numbers, or payment identifiers.
router.get('/receipt/:orderId', authenticate, async (req, res) => {
  try {
    const order = await get(`
      SELECT o.*, c.name as crop_name,
             f.name as farmer_name, f.phone as farmer_phone, f.village as farmer_village, f.district as farmer_district,
             org.company_name as buyer_company, org.reg_number as buyer_gstin, org.contact_person as buyer_contact,
             org.address as buyer_address, u.phone as buyer_phone
      FROM orders o
      JOIN crops c ON o.crop_id = c.id
      JOIN farmers f ON o.farmer_id = f.id
      JOIN organizations org ON o.buyer_id = org.id
      JOIN users u ON org.user_id = u.id
      WHERE o.id = ? OR o.order_code = ?
    `, [req.params.orderId, req.params.orderId]);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!isOrderParticipant(req, order, await getCallerParties(req))) {
      return res.status(403).json({ error: 'Access denied. You are not a participant of this order.' });
    }

    const tx = await get(`
      SELECT * FROM payment_transactions
      WHERE order_id = ? AND payment_status = 'PAID'
      ORDER BY updated_at DESC
      LIMIT 1
    `, [order.id]) || await get(`
      SELECT * FROM payment_transactions
      WHERE order_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [order.id]);

    const subtotal = parseFloat(order.total_value);
    const platformFeePct = 0.01; // 1% escrow protection fee
    const platformFee = Math.round(subtotal * platformFeePct);
    const gstOnFee = Math.round(platformFee * 0.18); // 18% GST on platform fee
    const totalCharged = subtotal + platformFee + gstOnFee;

    const receipt = {
      success: true,
      receiptNumber: `RCPT-RZP-${order.order_code}`,
      invoiceDate: tx ? tx.updated_at || tx.created_at : order.created_at,
      paymentMethod: order.payment_method || 'ONLINE_RAZORPAY',
      paymentStatus: order.payment_status || 'PAID',
      razorpayPaymentId: tx?.razorpay_payment_id || null,
      razorpayOrderId: tx?.razorpay_order_id || null,
      paymentProvider: 'Razorpay',
      escrowGuaranteeText: 'Payment was processed through Razorpay and recorded against the AgriLink order workflow. Final settlement follows the configured order and delivery workflow.',
      order: {
        id: order.id,
        orderCode: order.order_code,
        cropName: order.crop_name,
        qualityGrade: order.quality_grade,
        agreedQtyKg: order.agreed_qty_kg,
        agreedPricePerKg: order.agreed_price_per_kg,
        totalValue: order.total_value,
        pickupLocation: order.pickup_location,
        deliveryLocation: order.delivery_location,
        status: order.status
      },
      buyer: {
        companyName: order.buyer_company,
        gstin: order.buyer_gstin || null,
        contactPerson: order.buyer_contact,
        contactPhone: order.buyer_phone || null,
        address: order.buyer_address
      },
      farmer: {
        name: order.farmer_name,
        phone: order.farmer_phone,
        village: order.farmer_village,
        district: order.farmer_district
      },
      financials: {
        produceSubtotal: subtotal,
        platformEscrowFee: platformFee,
        gstOnFee: gstOnFee,
        totalAmountPaid: totalCharged,
        currency: 'INR'
      }
    };

    res.json(receipt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
