const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// GET /api/notifications/:userId
// A user may only retrieve their own notifications; admins may access others.
router.get('/:userId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied. You can only access your own notifications.' });
    }

    const notifs = await query(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.params.userId]);

    const unreadCount = await get(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `, [req.params.userId]);

    res.json({
      success: true,
      notifications: notifs,
      unreadCount: unreadCount.count || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
// The notification must belong to the authenticated user (admins exempt).
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notif = await get(`SELECT user_id FROM notifications WHERE id = ?`, [req.params.id]);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    if (req.user.role !== 'admin' && notif.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. This notification does not belong to you.' });
    }

    await run(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/mark-all-read
// User id is derived from the verified JWT, never from the request body
// (admins may still target another user explicitly).
router.post('/mark-all-read', authenticate, async (req, res) => {
  try {
    const userId = (req.user.role === 'admin' && req.body.userId) ? req.body.userId : req.user.id;
    await run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/simulate (Test/Demo live event triggers)
// Admin only: arbitrary notification injection must not be callable by normal users.
router.post('/simulate', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { userId, eventType, customTitle, customMessage, customLink } = req.body;

    const targetUserId = userId || 'usr_f1';
    const notifId = `notif_${Date.now()}`;
    const now = new Date().toISOString();

    let title = customTitle;
    let message = customMessage;
    let type = 'system';
    let link = customLink || '/farmer/orders';

    switch (eventType) {
      case 'order_placed':
        title = '📦 New Purchase Order Confirmed!';
        message = 'ABC Food Processing confirmed Order AGRI-2026-001024 for 8,000 kg Grade-A Tomato @ ₹31/kg. Verification Seal: VER-AGRI-928374.';
        type = 'order';
        link = '/farmer/orders';
        break;
      case 'out_for_delivery':
        title = '🚚 Harvest Dispatched & In Transit';
        message = 'Driver Ravi Kumar (AP 37 TE 1234) has picked up the shipment. Live GPS tracking active along NH-16 corridor.';
        type = 'delivery';
        link = '/farmer/delivery';
        break;
      case 'arrived':
        title = '📍 Vehicle Arrived at Destination';
        message = 'Truck AP 37 TE 1234 reached Rajahmundry Buyer Weighbridge. Inward inspection underway.';
        type = 'delivery';
        link = '/buyer/orders';
        break;
      case 'delivered':
        title = '✅ Delivery Inspected & Accepted!';
        message = 'Weighbridge inspection passed (8,000 kg, Grade-A, Good). Escrow payout of ₹2,48,000 released!';
        type = 'order';
        link = '/farmer/orders';
        break;
      case 'counter_offer':
        title = '💬 Price Counter-Offer Received';
        message = 'Ramesh Kumar proposed counter-offer: ₹31/kg (+₹2 above mandi avg) for 8,000 kg Tomato.';
        type = 'negotiation';
        link = '/buyer/negotiations';
        break;
      default:
        title = title || '🔔 AgriLink System Alert';
        message = message || 'Smart matching updated 3 new verified suppliers for your requisition.';
        type = 'system';
    }

    await run(`
      INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `, [notifId, targetUserId, title, message, type, link, now]);

    const created = await get(`SELECT * FROM notifications WHERE id = ?`, [notifId]);

    res.status(201).json({
      success: true,
      notification: created,
      message: 'Simulated notification created successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
