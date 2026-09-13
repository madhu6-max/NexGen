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
// return row (ownership taken from the database row, not the client).
function isReturnParticipant(req, returnCase, parties) {
  if (req.user.role === 'admin') return true;
  return (parties.farmerId && returnCase.farmer_id === parties.farmerId) ||
    (parties.buyerId && returnCase.buyer_id === parties.buyerId);
}

// GET /api/returns
router.get('/', authenticate, async (req, res) => {
  try {
    const { buyerId, farmerId, status } = req.query;

    let sql = `
      SELECT ret.*,
             ord.order_code, ord.agreed_qty_kg, ord.agreed_price_per_kg, ord.total_value,
             c.name as crop_name,
             f.name as farmer_name, f.phone as farmer_phone,
             o.company_name as buyer_company
      FROM returns ret
      JOIN orders ord ON ret.order_id = ord.id
      JOIN crops c ON ord.crop_id = c.id
      JOIN farmers f ON ret.farmer_id = f.id
      JOIN organizations o ON ret.buyer_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'admin') {
      if (buyerId) {
        sql += ` AND ret.buyer_id = ?`;
        params.push(buyerId);
      }
      if (farmerId) {
        sql += ` AND ret.farmer_id = ?`;
        params.push(farmerId);
      }
    } else {
      // Non-admin callers see only their own side; query ids are never trusted.
      const parties = await getCallerParties(req);
      if (!parties.farmerId && !parties.buyerId) {
        return res.status(403).json({ error: 'Access denied. No farmer or buyer profile is linked to this account.' });
      }
      if (parties.farmerId) {
        sql += ` AND ret.farmer_id = ?`;
        params.push(parties.farmerId);
      } else {
        sql += ` AND ret.buyer_id = ?`;
        params.push(parties.buyerId);
      }
    }
    if (status) {
      sql += ` AND ret.resolution_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY ret.created_at DESC`;

    const returns = await query(sql, params);
    res.json({ success: true, returns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/returns/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const returnCase = await get(`
      SELECT ret.*,
             ord.order_code, ord.agreed_qty_kg, ord.agreed_price_per_kg, ord.total_value, ord.quality_grade,
             c.name as crop_name,
             f.name as farmer_name, f.phone as farmer_phone, f.village as farmer_village,
             o.company_name as buyer_company, o.contact_person as buyer_contact
      FROM returns ret
      JOIN orders ord ON ret.order_id = ord.id
      JOIN crops c ON ord.crop_id = c.id
      JOIN farmers f ON ret.farmer_id = f.id
      JOIN organizations o ON ret.buyer_id = o.id
      WHERE ret.id = ? OR ret.return_code = ?
    `, [req.params.id, req.params.id]);

    if (!returnCase) return res.status(404).json({ error: 'Return case not found' });

    if (!isReturnParticipant(req, returnCase, await getCallerParties(req))) {
      return res.status(403).json({ error: 'Access denied. You are not a participant of this return case.' });
    }

    res.json({ success: true, returnCase });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/returns (Buyer reports problem / files Return or Replacement - Section 29)
// Only a farmer/buyer participant of the order (or admin) may file. The
// buyer/farmer ids are taken from the order row, never from the client.
router.post('/', authenticate, async (req, res) => {
  try {
    const { order_id, reason, description, evidence_images, requested_qty_kg } = req.body;

    if (!order_id || !reason || !description) {
      return res.status(400).json({ error: 'Order ID, reason, and description are required.' });
    }

    const order = await get(`SELECT * FROM orders WHERE id = ?`, [order_id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!isReturnParticipant(req, order, await getCallerParties(req))) {
      return res.status(403).json({ error: 'Access denied. Only participants of this order can file a return.' });
    }

    const returnId = `ret_${Date.now()}`;
    const returnCode = `RET-AGRI-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    await run(`
      INSERT INTO returns (
        id, return_code, order_id, buyer_id, farmer_id, reason, description,
        evidence_images, requested_qty_kg, admin_decision, resolution_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Review', 'Under Investigation', ?)
    `, [
      returnId, returnCode, order.id, order.buyer_id, order.farmer_id, reason,
      description,
      evidence_images || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80',
      parseFloat(requested_qty_kg) || order.agreed_qty_kg,
      now
    ]);

    // Update order status
    await run(`UPDATE orders SET status = 'Issue Reported' WHERE id = ?`, [order.id]);

    // Notify farmer & admin
    const farmerUser = await get(`SELECT u.id FROM farmers f JOIN users u ON f.user_id = u.id WHERE f.id = ?`, [order.farmer_id]);
    if (farmerUser) {
      await run(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Issue Reported on Order', ?, 'return', '/farmer/returns')
      `, [
        `notif_${Date.now()}`, farmerUser.id,
        `Buyer reported "${reason}" for order ${order.order_code}. Case ID: ${returnCode}.`
      ]);
    }

    const created = await get(`SELECT * FROM returns WHERE id = ?`, [returnId]);
    res.status(201).json({
      success: true,
      message: 'Issue successfully reported. Return ticket opened.',
      returnCase: created
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/returns/:id/farmer-response
// Only the farmer participant of the return case (or admin) may respond.
router.put('/:id/farmer-response', authenticate, async (req, res) => {
  try {
    const existing = await get(`SELECT farmer_id FROM returns WHERE id = ?`, [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Return case not found' });

    if (req.user.role !== 'admin') {
      const own = await get(`SELECT id FROM farmers WHERE user_id = ?`, [req.user.id]);
      if (!own || own.id !== existing.farmer_id) {
        return res.status(403).json({ error: 'Access denied. Only the farmer of this return case can respond.' });
      }
    }

    const { farmer_response } = req.body;
    await run(`
      UPDATE returns
      SET farmer_response = ?
      WHERE id = ?
    `, [farmer_response, req.params.id]);

    const updated = await get(`SELECT * FROM returns WHERE id = ?`, [req.params.id]);
    res.json({ success: true, returnCase: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/returns/:id/admin-resolve (Admin decision - Section 30)
// Possible decisions: 'ACCEPTED', 'PARTIAL REFUND', 'REPLACEMENT', 'RETURN TO FARMER', 'REJECTED'
// Admin only: farmers and buyers receive 403.
router.put('/:id/admin-resolve', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { admin_decision, resolution_status, notes } = req.body;
    const returnCase = await get(`SELECT * FROM returns WHERE id = ?`, [req.params.id]);
    if (!returnCase) return res.status(404).json({ error: 'Return case not found' });

    const now = new Date().toISOString();
    let finalStatus = resolution_status;
    if (!finalStatus) {
      if (admin_decision === 'REPLACEMENT') finalStatus = 'Replacement Sent';
      else if (admin_decision === 'PARTIAL REFUND') finalStatus = 'Refund Processed';
      else if (admin_decision === 'RETURN TO FARMER') finalStatus = 'Return Accepted';
      else if (admin_decision === 'ACCEPTED') finalStatus = 'Resolved';
      else finalStatus = 'Case Closed';
    }

    await run(`
      UPDATE returns
      SET admin_decision = ?,
          resolution_status = ?,
          closed_at = ?
      WHERE id = ?
    `, [admin_decision, finalStatus, now, req.params.id]);

    // Update order status if returned
    if (admin_decision === 'RETURN TO FARMER') {
      await run(`UPDATE orders SET status = 'Returned' WHERE id = ?`, [returnCase.order_id]);
    } else {
      await run(`UPDATE orders SET status = 'Completed' WHERE id = ?`, [returnCase.order_id]);
    }

    const updated = await get(`SELECT * FROM returns WHERE id = ?`, [req.params.id]);
    res.json({
      success: true,
      message: `Return case ${returnCase.return_code} resolved as: ${admin_decision}`,
      returnCase: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
