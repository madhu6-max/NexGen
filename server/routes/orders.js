const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

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

const TIMELINE_STEPS = [
  'Order Confirmed',
  'Produce Preparing',
  'Ready for Pickup',
  'Picked Up',
  'In Transit',
  'Arrived at Destination',
  'Buyer Inspection',
  'Completed'
];

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { buyerId, farmerId, status } = req.query;

    let sql = `
      SELECT ord.*,
             c.name as crop_name, c.image_url as crop_image,
             f.name as farmer_name, f.phone as farmer_phone, f.reliability_score as farmer_reliability,
             o.company_name as buyer_company, o.trust_score as buyer_trust,
             del.status as delivery_status, del.driver_name, del.vehicle_number,
             del.progress_pct, del.distance_remaining_km, del.estimated_arrival
      FROM orders ord
      JOIN crops c ON ord.crop_id = c.id
      JOIN farmers f ON ord.farmer_id = f.id
      JOIN organizations o ON ord.buyer_id = o.id
      LEFT JOIN deliveries del ON ord.id = del.order_id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'admin') {
      if (buyerId) {
        sql += ` AND ord.buyer_id = ?`;
        params.push(buyerId);
      }
      if (farmerId) {
        sql += ` AND ord.farmer_id = ?`;
        params.push(farmerId);
      }
    } else {
      // Non-admin callers see only their own side; query ids are never trusted.
      const parties = await getCallerParties(req);
      if (!parties.farmerId && !parties.buyerId) {
        return res.status(403).json({ error: 'Access denied. No farmer or buyer profile is linked to this account.' });
      }
      if (parties.farmerId) {
        sql += ` AND ord.farmer_id = ?`;
        params.push(parties.farmerId);
      } else {
        sql += ` AND ord.buyer_id = ?`;
        params.push(parties.buyerId);
      }
    }
    if (status) {
      sql += ` AND ord.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY ord.created_at DESC`;

    const orders = await query(sql, params);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await get(`
      SELECT ord.*,
             c.name as crop_name, c.variety as crop_variety, c.image_url as crop_image,
             f.name as farmer_name, f.phone as farmer_phone, f.email as farmer_email,
             f.village as farmer_village, f.district as farmer_district, f.reliability_score as farmer_reliability,
             f.rating as farmer_rating,
             o.company_name as buyer_company, o.contact_person as buyer_contact,
             o.address as buyer_address, o.trust_score as buyer_trust,
             pl.title as produce_title
      FROM orders ord
      JOIN crops c ON ord.crop_id = c.id
      JOIN farmers f ON ord.farmer_id = f.id
      JOIN organizations o ON ord.buyer_id = o.id
      JOIN produce_listings pl ON ord.produce_id = pl.id
      WHERE ord.id = ? OR ord.order_code = ?
    `, [req.params.id, req.params.id]);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!isOrderParticipant(req, order, await getCallerParties(req))) {
      return res.status(403).json({ error: 'Access denied. You are not a participant of this order.' });
    }

    const verification = await get(
      `SELECT * FROM order_verifications WHERE order_id = ?`,
      [order.id]
    );

    const delivery = await get(
      `SELECT * FROM deliveries WHERE order_id = ?`,
      [order.id]
    );

    const inspection = await get(
      `SELECT * FROM quality_inspections WHERE order_id = ?`,
      [order.id]
    );

    const existingRatings = await query(
      `SELECT * FROM ratings WHERE order_id = ?`,
      [order.id]
    );

    const activeReturn = await get(
      `SELECT * FROM returns WHERE order_id = ?`,
      [order.id]
    );

    const transactions = await query(
      `SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC`,
      [order.id]
    );

    const history = await query(
      `SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC`,
      [order.id]
    );

    // Calculate timeline state
    const currentStepIndex = TIMELINE_STEPS.indexOf(order.status);
    const timeline = TIMELINE_STEPS.map((step, idx) => ({
      step,
      completed: currentStepIndex >= idx || order.status === 'Completed',
      current: order.status === step
    }));

    res.json({
      success: true,
      order,
      verification,
      delivery,
      inspection,
      ratings: existingRatings,
      returnCase: activeReturn,
      transactions,
      history,
      timeline,
      allSteps: TIMELINE_STEPS
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/status (Advance Fulfillment Pipeline)
// Only a farmer/buyer participant of the order (or admin) may change its status.
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'New status is required.' });

    const order = await get(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!isOrderParticipant(req, order, await getCallerParties(req))) {
      return res.status(403).json({ error: 'Access denied. You are not a participant of this order.' });
    }

    await run(`UPDATE orders SET status = ? WHERE id = ?`, [status, order.id]);

    // Update delivery table progress accordingly
    let deliveryStatus = 'Scheduled';
    let progressPct = 10;
    if (status === 'Picked Up') {
      deliveryStatus = 'Picked Up';
      progressPct = 25;
    } else if (status === 'In Transit') {
      deliveryStatus = 'In Transit';
      progressPct = 60;
    } else if (status === 'Arrived at Destination' || status === 'Buyer Inspection') {
      deliveryStatus = 'In Transit';
      progressPct = 95;
    } else if (status === 'Completed') {
      deliveryStatus = 'Delivered';
      progressPct = 100;
    }

    await run(`
      UPDATE deliveries
      SET status = ?, progress_pct = ?, updated_at = ?
      WHERE order_id = ?
    `, [deliveryStatus, progressPct, new Date().toISOString(), order.id]);

    // Notifications
    const buyerUser = await get(`SELECT u.id FROM organizations o JOIN users u ON o.user_id = u.id WHERE o.id = ?`, [order.buyer_id]);
    if (buyerUser) {
      await run(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Order Status Updated', ?, 'order', '/buyer/orders')
      `, [
        `notif_${Date.now()}`, buyerUser.id,
        `Order ${order.order_code} status progressed to: ${status}.`
      ]);
    }

    const updated = await get(`SELECT * FROM orders WHERE id = ?`, [order.id]);
    res.json({ success: true, order: updated, newStatus: status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/quality-verification (Section 24 Order Verification)
// Only a farmer/buyer participant of the order (or admin) may verify.
router.post('/:id/quality-verification', authenticate, async (req, res) => {
  try {
    const order = await get(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!isOrderParticipant(req, order, await getCallerParties(req))) {
      return res.status(403).json({ error: 'Access denied. You are not a participant of this order.' });
    }

    const verificationCode = order.verification_id || `VER-AGRI-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const existing = await get(`SELECT id FROM order_verifications WHERE order_id = ?`, [order.id]);
    if (existing) {
      await run(`
        UPDATE order_verifications
        SET qty_confirmed = 1, quality_confirmed = 1, price_confirmed = 1, verified_at = ?
        WHERE id = ?
      `, [now, existing.id]);
    } else {
      await run(`
        INSERT INTO order_verifications (id, order_id, verification_code, qty_confirmed, quality_confirmed, price_confirmed, digital_signature, verified_at)
        VALUES (?, ?, ?, 1, 1, 1, ?, ?)
      `, [`ov_${Date.now()}`, order.id, verificationCode, `SIG_SHA256_ORDER_${order.order_code}`, now]);
    }

    res.json({
      success: true,
      verificationId: verificationCode,
      message: 'Quantity, Quality, and Price verified digitally before dispatch.',
      verifiedAt: now
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/fulfill (Fulfillment & Partial Fulfillment - Phase E)
// Only the supplying farmer of the order (or admin) may fulfill; the endpoint's
// own audit trail records the actor as the farmer.
router.post('/:id/fulfill', authenticate, async (req, res) => {
  try {
    const { fulfill_qty_kg, notes } = req.body;
    const order = await get(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (req.user.role !== 'admin') {
      const own = await get(`SELECT id FROM farmers WHERE user_id = ?`, [req.user.id]);
      if (!own || own.id !== order.farmer_id) {
        return res.status(403).json({ error: 'Access denied. Only the supplying farmer can fulfill this order.' });
      }
    }

    const qtyToFulfill = parseFloat(fulfill_qty_kg);
    if (!qtyToFulfill || qtyToFulfill <= 0) {
      return res.status(400).json({ error: 'Fulfillment quantity must be greater than zero.' });
    }

    const currentFulfilled = parseFloat(order.fulfilled_qty_kg || 0);
    const orderedQty = parseFloat(order.ordered_qty_kg || order.agreed_qty_kg);
    const newFulfilled = currentFulfilled + qtyToFulfill;

    // CRITICAL: Never allow fulfilledQuantity > orderedQuantity
    if (newFulfilled > orderedQty) {
      return res.status(400).json({
        error: `Cannot over-fulfill. Ordered: ${orderedQty} kg, already fulfilled: ${currentFulfilled} kg, attempted to add: ${qtyToFulfill} kg.`,
        orderedQuantity: orderedQty,
        fulfilledQuantity: currentFulfilled,
        remainingQuantity: Math.max(0, orderedQty - currentFulfilled)
      });
    }

    const remainingQty = orderedQty - newFulfilled;
    const newStatus = remainingQty === 0 ? 'Dispatched' : 'Partially Fulfilled';
    const now = new Date().toISOString();

    await run(`
      UPDATE orders
      SET fulfilled_qty_kg = ?,
          remaining_qty_kg = ?,
          status = ?
      WHERE id = ?
    `, [newFulfilled, remainingQty, newStatus, order.id]);

    // Update delivery entry
    await run(`
      UPDATE deliveries
      SET status = 'In Transit',
          progress_pct = ?,
          updated_at = ?
      WHERE order_id = ?
    `, [remainingQty === 0 ? 60 : 35, now, order.id]);

    // Audit log
    await run(`
      INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by_role, changed_by_name, notes, created_at)
      VALUES (?, ?, ?, ?, 'farmer', 'Farmer Fulfillment', ?, ?)
    `, [
      `osh_${Date.now()}`, order.id, order.status, newStatus,
      notes || `Dispatched ${qtyToFulfill} kg (${newFulfilled}/${orderedQty} kg fulfilled). Remaining: ${remainingQty} kg.`, now
    ]);

    // Notification to buyer
    const buyerUser = await get(`SELECT u.id FROM organizations o JOIN users u ON o.user_id = u.id WHERE o.id = ?`, [order.buyer_id]);
    if (buyerUser) {
      await run(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Order Dispatch & Fulfillment Update', ?, 'order', '/buyer/orders')
      `, [
        `notif_${Date.now()}`, buyerUser.id,
        `Order ${order.order_code}: ${qtyToFulfill.toLocaleString()} kg dispatched (${newStatus}). Remaining: ${remainingQty.toLocaleString()} kg.`
      ]);
    }

    const updated = await get(`SELECT * FROM orders WHERE id = ?`, [order.id]);
    res.json({
      success: true,
      order: updated,
      status: newStatus,
      orderedQuantity: orderedQty,
      fulfilledQuantity: newFulfilled,
      remainingQuantity: remainingQty
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/delivery-confirmation (Section 28 Buyer Inspection)
// Only the buying organization of the order (or admin) may confirm delivery;
// the endpoint's own audit trail records the actor as the buyer.
router.post('/:id/delivery-confirmation', authenticate, async (req, res) => {
  try {
    const { action, qty_received_kg, condition_status, inspector_notes } = req.body;
    const order = await get(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (req.user.role !== 'admin') {
      const own = await get(`SELECT id FROM organizations WHERE user_id = ?`, [req.user.id]);
      if (!own || own.id !== order.buyer_id) {
        return res.status(403).json({ error: 'Access denied. Only the buyer of this order can confirm delivery.' });
      }
    }

    const now = new Date().toISOString();

    if (action === 'accept') {
      // Record quality inspection
      const inspId = `qi_${Date.now()}`;
      await run(`
        INSERT INTO quality_inspections (id, order_id, buyer_id, qty_received_kg, quality_grade, condition_status, inspector_notes, status, inspected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Accepted', ?)
      `, [
        inspId, order.id, order.buyer_id,
        parseFloat(qty_received_kg) || order.agreed_qty_kg,
        order.quality_grade, condition_status || 'Good',
        inspector_notes || 'All crates inspected. Quality and quantity matched contract specifications.',
        now
      ]);

      // Complete order & collect COD if pending
      let newPaymentStatus = order.payment_status;
      if (order.payment_method === 'COD' || order.payment_status === 'COD_PENDING') {
        newPaymentStatus = 'COD_COLLECTED';
        await run(`UPDATE orders SET payment_status = 'COD_COLLECTED' WHERE id = ?`, [order.id]);
        await run(`
          UPDATE payment_transactions
          SET payment_status = 'COD_COLLECTED', updated_at = ?
          WHERE order_id = ?
        `, [now, order.id]);
      }

      await run(`UPDATE orders SET status = 'Completed' WHERE id = ?`, [order.id]);
      await run(`UPDATE deliveries SET status = 'Delivered', progress_pct = 100, updated_at = ? WHERE order_id = ?`, [now, order.id]);

      // Audit log
      await run(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by_role, changed_by_name, notes, created_at)
        VALUES (?, ?, ?, 'Completed', 'buyer', 'Buyer Weighbridge Inspection', ?, ?)
      `, [
        `osh_${Date.now()}`, order.id, order.status,
        `Delivery accepted. Order completed. ${newPaymentStatus === 'COD_COLLECTED' ? 'COD Collected at delivery.' : ''}`, now
      ]);

      // Increment farmer completed order count
      await run(`UPDATE farmers SET total_orders = total_orders + 1 WHERE id = ?`, [order.farmer_id]);

      // Notify farmer
      const farmerUser = await get(`SELECT u.id FROM farmers f JOIN users u ON f.user_id = u.id WHERE f.id = ?`, [order.farmer_id]);
      if (farmerUser) {
        await run(`
          INSERT INTO notifications (id, user_id, title, message, type, link)
          VALUES (?, ?, 'Delivery Accepted & Completed', ?, 'order', '/farmer/orders')
        `, [
          `notif_${Date.now()}`, farmerUser.id,
          `Buyer accepted delivery for Order ${order.order_code}. Transaction successfully completed! ${newPaymentStatus === 'COD_COLLECTED' ? 'COD funds marked collected.' : ''}`
        ]);
      }

      res.json({
        success: true,
        message: 'Delivery inspected and accepted. Order closed successfully!',
        orderStatus: 'Completed',
        paymentStatus: newPaymentStatus
      });
    } else {
      // Issue reported
      await run(`UPDATE orders SET status = 'Issue Reported' WHERE id = ?`, [order.id]);
      res.json({
        success: true,
        message: 'Issue noted on order. Proceeding to Return/Replacement filing.',
        orderStatus: 'Issue Reported'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
