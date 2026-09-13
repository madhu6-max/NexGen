const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { authenticate } = require('../middleware/auth');

// POST /api/ratings
// Only an order participant may rate, and only in their own direction:
// the buyer of the order rates the farmer ('buyer_to_farmer'), the farmer
// rates the buyer ('farmer_to_buyer'). The rater identity comes from the
// verified JWT; client-supplied user/role ids are validated, never trusted.
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      order_id, to_user_id, role,
      quality_rating, quantity_rating, delivery_rating, communication_rating, comment
    } = req.body;

    if (!order_id || !to_user_id || !role) {
      return res.status(400).json({ error: 'Missing required rating fields.' });
    }

    const order = await get(`SELECT farmer_id, buyer_id FROM orders WHERE id = ?`, [order_id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const farmer = await get(`SELECT id, user_id FROM farmers WHERE id = ?`, [order.farmer_id]);
    const buyer = await get(`SELECT id, user_id FROM organizations WHERE id = ?`, [order.buyer_id]);
    if (!farmer || !buyer) {
      return res.status(404).json({ error: 'Order participants not found' });
    }

    // Determine the caller's side from the database, never from the client.
    const isFarmerSide = req.user.role === 'farmer' && req.user.id === farmer.user_id;
    const isBuyerSide = req.user.role === 'buyer' && req.user.id === buyer.user_id;
    if (!isFarmerSide && !isBuyerSide) {
      return res.status(403).json({ error: 'Access denied. Only participants of this order can submit a rating.' });
    }

    // Enforce the legitimate reciprocal direction for the caller's side.
    const expectedRole = isBuyerSide ? 'buyer_to_farmer' : 'farmer_to_buyer';
    if (role !== expectedRole) {
      return res.status(403).json({ error: 'Access denied. Rating direction does not match your role in this order.' });
    }

    // The recipient must be the counterparty (row id or user id accepted,
    // matching existing client payloads); anything else is rejected.
    const counterpartyIds = isBuyerSide ? [farmer.id, farmer.user_id] : [buyer.id, buyer.user_id];
    if (!counterpartyIds.includes(to_user_id)) {
      return res.status(403).json({ error: 'Access denied. Ratings may only target the counterparty of this order.' });
    }

    // The rater is always the authenticated user — never the client's id.
    const from_user_id = req.user.id;

    const q = parseFloat(quality_rating) || 5.0;
    const qty = parseFloat(quantity_rating) || 5.0;
    const del = parseFloat(delivery_rating) || 5.0;
    const comm = parseFloat(communication_rating) || 5.0;
    const overall = Number(((q + qty + del + comm) / 4).toFixed(2));

    const ratingId = `rat_${Date.now()}`;
    const now = new Date().toISOString();

    await run(`
      INSERT INTO ratings (
        id, order_id, from_user_id, to_user_id, role, rating_overall,
        quality_rating, quantity_rating, delivery_rating, communication_rating, comment, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ratingId, order_id, from_user_id, to_user_id, role, overall,
      q, qty, del, comm, comment || 'Great transaction experience.', now
    ]);

    // Recalculate target user's average rating and reliability
    if (role === 'buyer_to_farmer') {
      const stats = await get(`
        SELECT AVG(rating_overall) as avg_rating, COUNT(*) as count
        FROM ratings WHERE to_user_id = ? AND role = 'buyer_to_farmer'
      `, [to_user_id]);

      if (stats && stats.avg_rating) {
        const newRating = Number(parseFloat(stats.avg_rating).toFixed(2));
        // Reliability formula: min(99, round(avg_rating * 19.5))
        const newReliability = Math.min(99, Math.round(newRating * 19.5));

        await run(`
          UPDATE farmers
          SET rating = ?, reliability_score = ?
          WHERE user_id = ?
        `, [newRating, newReliability, to_user_id]);
      }
    } else if (role === 'farmer_to_buyer') {
      const stats = await get(`
        SELECT AVG(rating_overall) as avg_rating, COUNT(*) as count
        FROM ratings WHERE to_user_id = ? AND role = 'farmer_to_buyer'
      `, [to_user_id]);

      if (stats && stats.avg_rating) {
        const newScore = Math.min(99, Math.round(parseFloat(stats.avg_rating) * 19.5));
        await run(`
          UPDATE organizations
          SET trust_score = ?
          WHERE user_id = ?
        `, [newScore, to_user_id]);
      }
    }

    const created = await get(`SELECT * FROM ratings WHERE id = ?`, [ratingId]);
    res.status(201).json({
      success: true,
      message: 'Rating and review submitted successfully!',
      rating: created
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ratings/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const ratings = await query(`
      SELECT r.*, u.name as reviewer_name, ord.order_code
      FROM ratings r
      JOIN users u ON r.from_user_id = u.id
      JOIN orders ord ON r.order_id = ord.id
      WHERE r.to_user_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.userId]);

    res.json({ success: true, ratings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
