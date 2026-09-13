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

// True when the caller is admin or a farmer/buyer participant of the given
// purchase request row (ownership taken from the database row, not the client).
function isRequestParticipant(req, request, parties) {
  if (req.user.role === 'admin') return true;
  return (parties.farmerId && request.farmer_id === parties.farmerId) ||
    (parties.buyerId && request.buyer_id === parties.buyerId);
}

// GET /api/requests
router.get('/', authenticate, async (req, res) => {
  try {
    const { buyerId, farmerId } = req.query;

    let sql = `
      SELECT pr.*,
             pl.title as produce_title, pl.image_url as produce_image, pl.quality_grade,
             c.name as crop_name,
             f.name as farmer_name, f.phone as farmer_phone, f.reliability_score as farmer_reliability,
             o.company_name as buyer_company, o.trust_score as buyer_trust,
             req.title as requirement_title
      FROM purchase_requests pr
      JOIN produce_listings pl ON pr.produce_id = pl.id
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON pr.farmer_id = f.id
      JOIN organizations o ON pr.buyer_id = o.id
      LEFT JOIN procurement_requirements req ON pr.requirement_id = req.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'admin') {
      if (buyerId) {
        sql += ` AND pr.buyer_id = ?`;
        params.push(buyerId);
      }
      if (farmerId) {
        sql += ` AND pr.farmer_id = ?`;
        params.push(farmerId);
      }
    } else {
      // Non-admin callers see only their own side; query ids are never trusted.
      const parties = await getCallerParties(req);
      if (!parties.farmerId && !parties.buyerId) {
        return res.status(403).json({ error: 'Access denied. No farmer or buyer profile is linked to this account.' });
      }
      if (parties.farmerId) {
        sql += ` AND pr.farmer_id = ?`;
        params.push(parties.farmerId);
      } else {
        sql += ` AND pr.buyer_id = ?`;
        params.push(parties.buyerId);
      }
    }

    sql += ` ORDER BY pr.updated_at DESC`;

    const requests = await query(sql, params);
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const request = await get(`
      SELECT pr.*,
             pl.title as produce_title, pl.image_url as produce_image, pl.quality_grade, pl.available_qty_kg,
             pl.expected_price_per_kg as farmer_base_price, pl.farm_location, pl.district as farm_district,
             c.name as crop_name,
             f.name as farmer_name, f.phone as farmer_phone, f.village as farmer_village, f.district as farmer_district,
             f.reliability_score as farmer_reliability, f.rating as farmer_rating,
             o.company_name as buyer_company, o.trust_score as buyer_trust, o.contact_person as buyer_contact,
             o.address as buyer_address,
             req.title as requirement_title, req.delivery_location
      FROM purchase_requests pr
      JOIN produce_listings pl ON pr.produce_id = pl.id
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON pr.farmer_id = f.id
      JOIN organizations o ON pr.buyer_id = o.id
      LEFT JOIN procurement_requirements req ON pr.requirement_id = req.id
      WHERE pr.id = ?
    `, [req.params.id]);

    if (!request) return res.status(404).json({ error: 'Purchase request not found' });

    if (!isRequestParticipant(req, request, await getCallerParties(req))) {
      return res.status(403).json({ error: 'Access denied. You are not a participant of this request.' });
    }

    const history = await query(`
      SELECT * FROM negotiation_history
      WHERE request_id = ?
      ORDER BY created_at ASC
    `, [request.id]);

    res.json({ success: true, request, negotiationHistory: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requests (Buyer creates initial purchase request)
// Buyer role only. The buyer organization is derived from the verified JWT —
// req.body buyer/organization identifiers are never trusted for authorization.
router.post('/', authenticate, requireRole('buyer'), async (req, res) => {
  try {
    const { requirement_id, produce_id, requested_qty_kg, offered_price_per_kg, delivery_date, note } = req.body;

    if (!produce_id || !requested_qty_kg || !offered_price_per_kg) {
      return res.status(400).json({ error: 'Missing required purchase request details.' });
    }

    const owner = await get(`SELECT id, company_name FROM organizations WHERE user_id = ?`, [req.user.id]);
    if (!owner) {
      return res.status(403).json({ error: 'Access denied. No buyer organization is linked to this account.' });
    }
    const buyer_id = owner.id;

    const produce = await get(`SELECT farmer_id, title FROM produce_listings WHERE id = ?`, [produce_id]);
    if (!produce) return res.status(404).json({ error: 'Produce listing not found' });

    const buyer = await get(`SELECT company_name FROM organizations WHERE id = ?`, [buyer_id]);

    const requestId = `pr_${Date.now()}`;
    const now = new Date().toISOString();

    await run(`
      INSERT INTO purchase_requests (
        id, requirement_id, produce_id, buyer_id, farmer_id, requested_qty_kg,
        offered_price_per_kg, counter_price_per_kg, delivery_date, status, last_actor, note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, null, ?, 'Pending', 'buyer', ?, ?, ?)
    `, [
      requestId, requirement_id || null, produce_id, buyer_id, produce.farmer_id,
      parseFloat(requested_qty_kg), parseFloat(offered_price_per_kg),
      delivery_date || '2026-09-15', note || 'Initial purchase request', now, now
    ]);

    // Add to negotiation history
    await run(`
      INSERT INTO negotiation_history (id, request_id, sender_role, sender_name, price_per_kg, qty_kg, delivery_date, note, created_at)
      VALUES (?, ?, 'buyer', ?, ?, ?, ?, ?, ?)
    `, [
      `nh_${Date.now()}`, requestId, buyer ? buyer.company_name : 'Buyer',
      parseFloat(offered_price_per_kg), parseFloat(requested_qty_kg), delivery_date || '2026-09-15',
      note || `Offered ₹${offered_price_per_kg}/kg for ${parseFloat(requested_qty_kg).toLocaleString()} kg`, now
    ]);

    // Send notification to farmer
    await run(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      SELECT ?, u.id, 'New Purchase Request Received', ?, 'request', '/farmer/requests'
      FROM farmers f JOIN users u ON f.user_id = u.id WHERE f.id = ?
    `, [
      `notif_${Date.now()}`,
      `New request from ${buyer ? buyer.company_name : 'a buyer'}: ${requested_qty_kg} kg at ₹${offered_price_per_kg}/kg.`,
      produce.farmer_id
    ]);

    const created = await get(`SELECT * FROM purchase_requests WHERE id = ?`, [requestId]);
    res.status(201).json({ success: true, request: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:id/counter (Counter-offer by Farmer or Buyer)
// Only a farmer/buyer participant of this request (or admin) may counter.
// The acting side is derived from the database, never from req.body.sender_role.
router.put('/:id/counter', authenticate, async (req, res) => {
  try {
    const { counter_price_per_kg, note, sender_name } = req.body;
    const request = await get(`SELECT * FROM purchase_requests WHERE id = ?`, [req.params.id]);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const parties = await getCallerParties(req);
    const isFarmerSide = parties.farmerId && request.farmer_id === parties.farmerId;
    const isBuyerSide = parties.buyerId && request.buyer_id === parties.buyerId;
    if (req.user.role !== 'admin' && !isFarmerSide && !isBuyerSide) {
      return res.status(403).json({ error: 'Access denied. Only participants of this request can counter-offer.' });
    }
    const role = req.user.role === 'admin'
      ? (request.last_actor === 'buyer' ? 'farmer' : 'buyer')
      : (isFarmerSide ? 'farmer' : 'buyer');

    const newPrice = parseFloat(counter_price_per_kg);
    const now = new Date().toISOString();

    await run(`
      UPDATE purchase_requests
      SET counter_price_per_kg = ?,
          status = 'Counter_Offered',
          last_actor = ?,
          note = ?,
          updated_at = ?
      WHERE id = ?
    `, [newPrice, role, note || `Counter offer of ₹${newPrice}/kg`, now, req.params.id]);

    // Insert history
    await run(`
      INSERT INTO negotiation_history (id, request_id, sender_role, sender_name, price_per_kg, qty_kg, delivery_date, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      `nh_${Date.now()}`, req.params.id, role, sender_name || (role === 'farmer' ? 'Farmer' : 'Buyer'),
      newPrice, request.requested_qty_kg, request.delivery_date, note || `Counter offer: ₹${newPrice}/kg`, now
    ]);

    // Notify opposite party
    const targetUserId = role === 'farmer'
      ? (await get(`SELECT u.id FROM organizations o JOIN users u ON o.user_id = u.id WHERE o.id = ?`, [request.buyer_id]))?.id
      : (await get(`SELECT u.id FROM farmers f JOIN users u ON f.user_id = u.id WHERE f.id = ?`, [request.farmer_id]))?.id;

    if (targetUserId) {
      await run(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Counter-Offer Received', ?, 'negotiation', ?)
      `, [
        `notif_${Date.now()}`, targetUserId,
        `${sender_name || (role === 'farmer' ? 'Farmer' : 'Buyer')} submitted a counter offer: ₹${newPrice}/kg.`,
        role === 'farmer' ? '/buyer/negotiations' : '/farmer/negotiations'
      ]);
    }

    const updated = await get(`SELECT * FROM purchase_requests WHERE id = ?`, [req.params.id]);
    res.json({ success: true, request: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:id/farmer-accept
// Only the farmer participant of this request (or admin) may accept.
router.put('/:id/farmer-accept', authenticate, async (req, res) => {
  try {
    const request = await get(`SELECT * FROM purchase_requests WHERE id = ?`, [req.params.id]);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (req.user.role !== 'admin') {
      const own = await get(`SELECT id FROM farmers WHERE user_id = ?`, [req.user.id]);
      if (!own || own.id !== request.farmer_id) {
        return res.status(403).json({ error: 'Access denied. Only the farmer of this request can accept it.' });
      }
    }

    const now = new Date().toISOString();
    await run(`
      UPDATE purchase_requests
      SET status = 'Accepted_By_Farmer',
          last_actor = 'farmer',
          updated_at = ?
      WHERE id = ?
    `, [now, req.params.id]);

    const agreedPrice = request.counter_price_per_kg || request.offered_price_per_kg;

    // Log history
    await run(`
      INSERT INTO negotiation_history (id, request_id, sender_role, sender_name, price_per_kg, qty_kg, delivery_date, note, created_at)
      VALUES (?, ?, 'farmer', 'Farmer Acceptance', ?, ?, ?, 'Farmer accepted the terms. Awaiting final buyer confirmation.', ?)
    `, [`nh_${Date.now()}`, req.params.id, agreedPrice, request.requested_qty_kg, request.delivery_date, now]);

    // Notify buyer
    const buyerUser = await get(`SELECT u.id FROM organizations o JOIN users u ON o.user_id = u.id WHERE o.id = ?`, [request.buyer_id]);
    if (buyerUser) {
      await run(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Farmer Accepted Your Request!', 'Farmer accepted the offer. Please review final terms and confirm the order.', 'order', '/buyer/orders')
      `, [`notif_${Date.now()}`, buyerUser.id]);
    }

    const updated = await get(`SELECT * FROM purchase_requests WHERE id = ?`, [req.params.id]);
    res.json({ success: true, request: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:id/farmer-reject
// Only the farmer participant of this request (or admin) may reject.
router.put('/:id/farmer-reject', authenticate, async (req, res) => {
  try {
    const request = await get(`SELECT farmer_id FROM purchase_requests WHERE id = ?`, [req.params.id]);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (req.user.role !== 'admin') {
      const own = await get(`SELECT id FROM farmers WHERE user_id = ?`, [req.user.id]);
      if (!own || own.id !== request.farmer_id) {
        return res.status(403).json({ error: 'Access denied. Only the farmer of this request can reject it.' });
      }
    }

    const { reason } = req.body;
    const now = new Date().toISOString();
    await run(`
      UPDATE purchase_requests
      SET status = 'Rejected', last_actor = 'farmer', note = ?, updated_at = ?
      WHERE id = ?
    `, [reason || 'Declined by farmer', now, req.params.id]);

    res.json({ success: true, message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requests/:id/buyer-confirm (Crucial Step: Buyer Confirms Terms -> Order Created!)
// Only the buyer participant of this request (or admin) may confirm.
router.post('/:id/buyer-confirm', authenticate, async (req, res) => {
  try {
    const request = await get(`
      SELECT pr.*, pl.crop_id, pl.quality_grade, pl.farm_location, pl.district,
             pl.latitude as f_lat, pl.longitude as f_lng
      FROM purchase_requests pr
      JOIN produce_listings pl ON pr.produce_id = pl.id
      WHERE pr.id = ?
    `, [req.params.id]);

    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (req.user.role !== 'admin') {
      const own = await get(`SELECT id FROM organizations WHERE user_id = ?`, [req.user.id]);
      if (!own || own.id !== request.buyer_id) {
        return res.status(403).json({ error: 'Access denied. Only the buyer of this request can confirm it.' });
      }
    }

    // Idempotency: Prevent duplicate order creation for the same purchase request
    const existingOrder = await get(`SELECT * FROM orders WHERE request_id = ?`, [request.id]);
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: 'Order already exists for this purchase request.',
        order: existingOrder,
        verificationId: existingOrder.verification_id,
        orderCode: existingOrder.order_code
      });
    }

    // CRITICAL RULE: Seller acceptance is mandatory before checkout / order confirmation
    if (request.status !== 'Accepted_By_Farmer') {
      return res.status(400).json({
        error: 'Seller acceptance is mandatory before checkout or order confirmation.',
        currentStatus: request.status
      });
    }

    const { payment_method } = req.body;
    const isOnline = payment_method === 'ONLINE_RAZORPAY';
    const initialPaymentMethod = isOnline ? 'ONLINE_RAZORPAY' : 'COD';
    const initialPaymentStatus = isOnline ? 'PENDING' : 'COD_PENDING';
    const initialOrderStatus = isOnline ? 'Payment Pending' : 'Order Confirmed';

    const agreedPrice = request.counter_price_per_kg || request.offered_price_per_kg;
    const agreedQty = request.requested_qty_kg;
    const totalValue = agreedQty * agreedPrice;

    const buyer = await get(`SELECT * FROM organizations WHERE id = ?`, [request.buyer_id]);

    const orderCode = `AGRI-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const verificationCode = `VER-AGRI-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = `ord_${Date.now()}`;
    const now = new Date().toISOString();

    // 1. Create the Order with locked agreed price, payment state, and fulfillment tracking
    await run(`
      INSERT INTO orders (
        id, order_code, request_id, buyer_id, farmer_id, produce_id, crop_id,
        agreed_qty_kg, agreed_price_per_kg, total_value, quality_grade,
        pickup_location, delivery_location, pickup_lat, pickup_lng, delivery_lat, delivery_lng,
        expected_delivery, status, verification_id, created_at,
        payment_method, payment_status, ordered_qty_kg, fulfilled_qty_kg, remaining_qty_kg
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId,
      orderCode,
      request.id,
      request.buyer_id,
      request.farmer_id,
      request.produce_id,
      request.crop_id,
      agreedQty,
      agreedPrice,
      totalValue,
      request.quality_grade || 'Grade A',
      request.farm_location || `${request.district || 'Eluru'}, AP`,
      buyer ? buyer.address : 'Buyer Processing Unit, Eluru',
      request.f_lat || 16.7107,
      request.f_lng || 81.0952,
      17.0005,
      81.8040,
      request.delivery_date || '2026-09-15',
      'Order Confirmed',
      verificationCode,
      now,
      initialPaymentMethod,
      initialPaymentStatus,
      agreedQty,
      0,
      agreedQty
    ]);

    // Initial audit trail
    await run(`
      INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by_role, changed_by_name, notes, created_at)
      VALUES (?, ?, 'Accepted_By_Farmer', ?, 'buyer', ?, ?, ?)
    `, [
      `osh_${Date.now()}`, orderId, initialOrderStatus,
      buyer ? buyer.company_name : 'Buyer',
      `Order issued through checkout. Payment method: ${initialPaymentMethod}. Total: ₹${totalValue}`, now
    ]);

    // 2. Create Order Verification record (Section 24)
    await run(`
      INSERT INTO order_verifications (id, order_id, verification_code, qty_confirmed, quality_confirmed, price_confirmed, digital_signature, verified_at)
      VALUES (?, ?, ?, 1, 1, 1, ?, ?)
    `, [
      `ov_${Date.now()}`, orderId, verificationCode,
      `SIG_SHA256_${orderCode}_CONFIRMED`, now
    ]);

    // 3. Create simulated Delivery entry (Section 25 & 26)
    await run(`
      INSERT INTO deliveries (
        id, order_id, driver_name, driver_phone, vehicle_number,
        pickup_lat, pickup_lng, delivery_lat, delivery_lng,
        current_lat, current_lng, distance_km, distance_remaining_km,
        estimated_arrival, status, progress_pct, updated_at
      ) VALUES (?, ?, 'Ravi Kumar', '+91 98492 88472', 'AP 37 TE 1234', ?, ?, ?, ?, ?, ?, 65.0, 65.0, 'Today, 5:30 PM', 'Scheduled', 10, ?)
    `, [
      `del_${Date.now()}`, orderId,
      request.f_lat || 16.7107, request.f_lng || 81.0952,
      17.0005, 81.8040,
      request.f_lat || 16.7107, request.f_lng || 81.0952,
      now
    ]);

    // 4. Update request status
    await run(`
      UPDATE purchase_requests
      SET status = 'Confirmed_By_Buyer', last_actor = 'buyer', updated_at = ?
      WHERE id = ?
    `, [now, request.id]);

    // 5. Update produce available quantity
    await run(`
      UPDATE produce_listings
      SET available_qty_kg = MAX(0, available_qty_kg - ?)
      WHERE id = ?
    `, [agreedQty, request.produce_id]);

    // 6. Notify Farmer
    const farmerUser = await get(`SELECT u.id FROM farmers f JOIN users u ON f.user_id = u.id WHERE f.id = ?`, [request.farmer_id]);
    if (farmerUser) {
      await run(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Order Created!', ?, 'order', '/farmer/orders')
      `, [
        `notif_${Date.now()}`, farmerUser.id,
        `Buyer confirmed order ${orderCode}! Verification ID: ${verificationCode}. Ready for fulfillment.`
      ]);
    }

    const createdOrder = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);

    res.status(201).json({
      success: true,
      message: 'Order confirmed and created successfully!',
      order: createdOrder,
      verificationId: verificationCode,
      orderCode
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
