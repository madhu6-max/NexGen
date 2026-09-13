const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// GET /api/requirements
router.get('/', async (req, res) => {
  try {
    const { cropId, status, buyerId } = req.query;

    let sql = `
      SELECT pr.*, c.name as crop_name, c.image_url as crop_image, c.current_market_price,
             o.company_name, o.business_type, o.trust_score, o.address as buyer_address
      FROM procurement_requirements pr
      JOIN crops c ON pr.crop_id = c.id
      JOIN organizations o ON pr.buyer_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (cropId) {
      sql += ` AND pr.crop_id = ?`;
      params.push(cropId);
    }
    if (status) {
      sql += ` AND pr.status = ?`;
      params.push(status);
    }
    if (buyerId) {
      sql += ` AND pr.buyer_id = ?`;
      params.push(buyerId);
    }

    sql += ` ORDER BY pr.created_at DESC`;

    const requirements = await query(sql, params);

    // Compute active matches count and estimated cost range for each requirement
    for (const reqItem of requirements) {
      const matchCount = await get(
        `SELECT COUNT(*) as count FROM produce_listings WHERE crop_id = ? AND status = 'Available'`,
        [reqItem.crop_id]
      );
      reqItem.matches_count = matchCount ? matchCount.count : 0;
      const minP = reqItem.min_price_per_kg || (reqItem.max_price_per_kg * 0.85);
      reqItem.min_price_per_kg = parseFloat(minP.toFixed(2));
      reqItem.estimated_min_total = Math.round(reqItem.quantity_kg * reqItem.min_price_per_kg);
      reqItem.estimated_max_total = Math.round(reqItem.quantity_kg * reqItem.max_price_per_kg);
    }

    res.json({ success: true, requirements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requirements/:id
router.get('/:id', async (req, res) => {
  try {
    const requirement = await get(`
      SELECT pr.*, c.name as crop_name, c.variety as crop_variety, c.image_url as crop_image, c.current_market_price,
             c.min_price as crop_min_price, c.max_price as crop_max_price,
             o.company_name, o.business_type, o.trust_score, o.address as buyer_address
      FROM procurement_requirements pr
      JOIN crops c ON pr.crop_id = c.id
      JOIN organizations o ON pr.buyer_id = o.id
      WHERE pr.id = ?
    `, [req.params.id]);

    if (!requirement) return res.status(404).json({ error: 'Requirement not found' });

    const minP = requirement.min_price_per_kg || (requirement.max_price_per_kg * 0.85);
    requirement.min_price_per_kg = parseFloat(minP.toFixed(2));
    requirement.estimated_min_total = Math.round(requirement.quantity_kg * requirement.min_price_per_kg);
    requirement.estimated_max_total = Math.round(requirement.quantity_kg * requirement.max_price_per_kg);

    res.json({ success: true, requirement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requirements
// Buyer role only. The organization is derived from the verified JWT via the
// organizations table — req.body buyer/organization identifiers are never trusted.
router.post('/', authenticate, requireRole('buyer'), async (req, res) => {
  try {
    const {
      crop_id, title, quantity_kg, quality_grade, min_price_per_kg, max_price_per_kg,
      preferred_location, max_distance_km, required_delivery_date, delivery_location,
      delivery_lat, delivery_lng, special_requirements
    } = req.body;

    if (!crop_id || !quantity_kg || !max_price_per_kg || !required_delivery_date) {
      return res.status(400).json({ error: 'Missing required procurement requirement fields.' });
    }

    const owner = await get(`SELECT id FROM organizations WHERE user_id = ?`, [req.user.id]);
    if (!owner) {
      return res.status(403).json({ error: 'Access denied. No buyer organization is linked to this account.' });
    }
    const buyer_id = owner.id;

    const crop = await get(`SELECT name, min_price FROM crops WHERE id = ?`, [crop_id]);
    const reqId = `req_${Date.now()}`;
    const autoTitle = title || `Sourcing ${parseFloat(quantity_kg).toLocaleString()} kg ${quality_grade || 'Grade A'} ${crop ? crop.name : 'Produce'}`;
    const parsedMinPrice = min_price_per_kg ? parseFloat(min_price_per_kg) : (crop && crop.min_price ? crop.min_price : parseFloat(max_price_per_kg) * 0.85);

    await run(`
      INSERT INTO procurement_requirements (
        id, buyer_id, crop_id, title, quantity_kg, quality_grade, min_price_per_kg, max_price_per_kg,
        preferred_location, max_distance_km, required_delivery_date, delivery_location,
        delivery_lat, delivery_lng, special_requirements, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')
    `, [
      reqId, buyer_id, crop_id, autoTitle, parseFloat(quantity_kg), quality_grade || 'Grade A',
      parsedMinPrice, parseFloat(max_price_per_kg), preferred_location || 'Eluru District',
      parseFloat(max_distance_km) || 50, required_delivery_date,
      delivery_location || 'Buyer Facility, Andhra Pradesh',
      parseFloat(delivery_lat) || 16.7190, parseFloat(delivery_lng) || 81.1090,
      special_requirements || 'Standard commercial procurement specifications.'
    ]);

    const created = await get(`SELECT * FROM procurement_requirements WHERE id = ?`, [reqId]);
    created.estimated_min_total = Math.round(created.quantity_kg * created.min_price_per_kg);
    created.estimated_max_total = Math.round(created.quantity_kg * created.max_price_per_kg);
    res.status(201).json({ success: true, requirement: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requirements/:id
// Owning buyer organization or admin only. The owner is loaded from the
// database and compared against the authenticated user's organization;
// client-supplied organization identifiers are ignored.
router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await get(`SELECT buyer_id FROM procurement_requirements WHERE id = ?`, [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Requirement not found' });

    if (req.user.role !== 'admin') {
      const own = await get(`SELECT id FROM organizations WHERE user_id = ?`, [req.user.id]);
      if (!own || own.id !== existing.buyer_id) {
        return res.status(403).json({ error: 'Access denied. You can only update your own requirements.' });
      }
    }

    const { quantity_kg, max_price_per_kg, status, required_delivery_date } = req.body;

    await run(`
      UPDATE procurement_requirements
      SET quantity_kg = COALESCE(?, quantity_kg),
          max_price_per_kg = COALESCE(?, max_price_per_kg),
          status = COALESCE(?, status),
          required_delivery_date = COALESCE(?, required_delivery_date)
      WHERE id = ?
    `, [quantity_kg, max_price_per_kg, status, required_delivery_date, req.params.id]);

    const updated = await get(`SELECT * FROM procurement_requirements WHERE id = ?`, [req.params.id]);
    res.json({ success: true, requirement: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
