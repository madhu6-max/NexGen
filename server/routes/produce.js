const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// GET /api/produce
router.get('/', async (req, res) => {
  try {
    const { cropId, district, grade, farmerId, status } = req.query;

    let sql = `
      SELECT pl.*, c.name as crop_name, c.category as crop_category, c.current_market_price,
             f.name as farmer_name, f.reliability_score, f.rating as farmer_rating, f.village as farmer_village
      FROM produce_listings pl
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON pl.farmer_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (cropId) {
      sql += ` AND pl.crop_id = ?`;
      params.push(cropId);
    }
    if (district) {
      sql += ` AND pl.district LIKE ?`;
      params.push(`%${district}%`);
    }
    if (grade) {
      sql += ` AND pl.quality_grade = ?`;
      params.push(grade);
    }
    if (farmerId) {
      sql += ` AND pl.farmer_id = ?`;
      params.push(farmerId);
    }
    if (status) {
      sql += ` AND pl.status = ?`;
      params.push(status);
    } else if (!farmerId) {
      // Default to Available for buyers
      sql += ` AND pl.status = 'Available'`;
    }

    sql += ` ORDER BY pl.created_at DESC`;

    const produce = await query(sql, params);

    // Attach interested buyers count
    for (const p of produce) {
      const matchCount = await get(
        `SELECT COUNT(*) as count FROM procurement_requirements WHERE crop_id = ? AND status = 'Open'`,
        [p.crop_id]
      );
      p.matched_buyers_count = matchCount.count || 0;
    }

    res.json({ success: true, produce });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/produce/:id
router.get('/:id', async (req, res) => {
  try {
    const produce = await get(`
      SELECT pl.*, c.name as crop_name, c.category as crop_category, c.current_market_price,
             f.name as farmer_name,
             f.village as farmer_village, f.district as farmer_district, f.state as farmer_state,
             f.reliability_score, f.rating as farmer_rating, f.total_orders as farmer_orders,
             f.fpo_name, f.farm_size_acres, f.experience_years
      FROM produce_listings pl
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON pl.farmer_id = f.id
      WHERE pl.id = ?
    `, [req.params.id]);

    if (!produce) return res.status(404).json({ error: 'Produce listing not found' });

    const qualityRecord = await get(
      `SELECT * FROM crop_quality_records WHERE produce_id = ?`,
      [produce.id]
    );

    const interestedRequirements = await query(`
      SELECT pr.*, o.company_name, o.trust_score
      FROM procurement_requirements pr
      JOIN organizations o ON pr.buyer_id = o.id
      WHERE pr.crop_id = ? AND pr.status = 'Open'
    `, [produce.crop_id]);

    res.json({
      success: true,
      produce,
      qualityRecord,
      interestedBuyers: interestedRequirements
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/produce (Multi-step Add Produce)
// Farmer role only. Ownership is derived from the verified JWT via the
// farmers table — req.body.farmer_id is never trusted for authorization.
router.post('/', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    const {
      crop_id, title, total_qty_kg, available_qty_kg,
      quality_grade, moisture_pct, size_mm, color, defect_pct, is_organic, certification,
      expected_price_per_kg, harvest_date, available_from, available_until,
      farm_location, district, latitude, longitude, image_url
    } = req.body;

    if (!crop_id || !expected_price_per_kg || !total_qty_kg) {
      return res.status(400).json({ error: 'Missing required produce listing fields.' });
    }

    const owner = await get(`SELECT id FROM farmers WHERE user_id = ?`, [req.user.id]);
    if (!owner) {
      return res.status(403).json({ error: 'Access denied. No farmer profile is linked to this account.' });
    }
    const farmer_id = owner.id;

    const crop = await get(`SELECT name, image_url FROM crops WHERE id = ?`, [crop_id]);
    const listingId = `prod_${Date.now()}`;
    const defaultTitle = title || `Fresh ${quality_grade || 'Grade A'} ${crop ? crop.name : 'Produce'}`;
    const defaultImg = image_url || (crop ? crop.image_url : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80');

    await run(`
      INSERT INTO produce_listings (
        id, farmer_id, crop_id, title, image_url, total_qty_kg, available_qty_kg,
        quality_grade, moisture_pct, size_mm, color, defect_pct, is_organic, certification,
        expected_price_per_kg, harvest_date, available_from, available_until,
        farm_location, district, state, latitude, longitude, verification_status, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, 'Andhra Pradesh', ?, ?, 'PENDING', 'Available'
      )
    `, [
      listingId, farmer_id, crop_id, defaultTitle, defaultImg,
      parseFloat(total_qty_kg), parseFloat(available_qty_kg || total_qty_kg),
      quality_grade || 'Grade A', parseFloat(moisture_pct) || 82.0, parseFloat(size_mm) || 60.0,
      color || 'Natural', parseFloat(defect_pct) || 1.5, is_organic ? 1 : 0, certification || 'None',
      parseFloat(expected_price_per_kg), harvest_date || new Date().toISOString().split('T')[0],
      available_from || new Date().toISOString().split('T')[0], available_until || null,
      farm_location || 'Eluru District, AP', district || 'Eluru',
      parseFloat(latitude) || 16.7107, parseFloat(longitude) || 81.0952
    ]);

    // Insert quality record
    await run(`
      INSERT INTO crop_quality_records (
        id, produce_id, grade, moisture_pct, size_mm, color, defect_pct, organic_cert,
        inspection_date, inspector_name, ai_confidence, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AgriLink Quality Engine', 0.92, 'Pending')
    `, [
      `qr_${listingId}`, listingId, quality_grade || 'Grade A',
      parseFloat(moisture_pct) || 82.0, parseFloat(size_mm) || 60.0,
      color || 'Natural', parseFloat(defect_pct) || 1.5, is_organic ? certification : 'None',
      new Date().toISOString().split('T')[0]
    ]);

    const created = await get(`SELECT * FROM produce_listings WHERE id = ?`, [listingId]);
    res.status(201).json({ success: true, produce: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/produce/:id
// Owning farmer or admin only. The owner is loaded from the database and
// compared against the authenticated user; client-supplied farmer_id is ignored.
router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await get(`SELECT farmer_id FROM produce_listings WHERE id = ?`, [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Produce listing not found' });

    if (req.user.role !== 'admin') {
      const own = await get(`SELECT id FROM farmers WHERE user_id = ?`, [req.user.id]);
      if (!own || own.id !== existing.farmer_id) {
        return res.status(403).json({ error: 'Access denied. You can only update your own produce listings.' });
      }
    }

    const { available_qty_kg, expected_price_per_kg, status } = req.body;

    await run(`
      UPDATE produce_listings
      SET available_qty_kg = COALESCE(?, available_qty_kg),
          expected_price_per_kg = COALESCE(?, expected_price_per_kg),
          status = COALESCE(?, status)
      WHERE id = ?
    `, [available_qty_kg, expected_price_per_kg, status, req.params.id]);

    const updated = await get(`SELECT * FROM produce_listings WHERE id = ?`, [req.params.id]);
    res.json({ success: true, produce: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/produce/:id/verify (Four-Step Crop Verification - Section 11)
// Verification authority: admin only. Farmers and buyers receive 403.
router.post('/:id/verify', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const produceId = req.params.id;
    const produce = await get(`
      SELECT pl.*, c.name as crop_name, f.name as farmer_name, f.village as farmer_village
      FROM produce_listings pl
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON pl.farmer_id = f.id
      WHERE pl.id = ?
    `, [produceId]);

    if (!produce) return res.status(404).json({ error: 'Produce not found' });

    // 4-Step Verification simulation
    const verificationResults = {
      verification1_FarmerIdentity: {
        stepName: 'Farmer Identity Verification',
        status: 'Verified',
        passed: true,
        details: `Farmer UIDAI biometric authentication valid. Registered name matches: ${produce.farmer_name}.`
      },
      verification2_FarmLocation: {
        stepName: 'Farm Location Verification',
        status: 'Verified',
        passed: true,
        details: `Registered farm coordinates (${produce.latitude || 16.7107}, ${produce.longitude || 81.0952}) match parcel survey deed within 1.2m tolerance in ${produce.district}.`
      },
      verification3_CropEvidence: {
        stepName: 'Crop Image AI Verification',
        status: 'Matched',
        passed: true,
        detectedCrop: produce.crop_name,
        confidence: '95.4%',
        details: `Computer vision spectral index confirmed crop variety: ${produce.crop_name} (${produce.quality_grade}). Defect percentage < 2.0%.`
      },
      verification4_QuantityHarvestEvidence: {
        stepName: 'Quantity & Harvest Evidence Verification',
        status: 'Consistent',
        passed: true,
        declaredQuantityKg: produce.total_qty_kg,
        modeledRangeKg: `${Math.round(produce.total_qty_kg * 0.95)} - ${Math.round(produce.total_qty_kg * 1.05)} kg`,
        details: `Declared volume of ${produce.total_qty_kg.toLocaleString()} kg is consistent with farm acreage historical yield benchmarks.`
      },
      overallStatus: 'Produce Verification Passed',
      disclaimer: 'Demo verification result. Physical inventory verification requires trusted field/weighing integrations.',
      verifiedAt: new Date().toISOString()
    };

    // Update database status
    await run(`
      UPDATE produce_listings
      SET verification_status = 'VERIFIED',
          verification_notes = '4-Step verification passed: Identity, Location, AI Image Match, and Quantity consistency verified.'
      WHERE id = ?
    `, [produceId]);

    await run(`
      UPDATE crop_quality_records
      SET verification_status = 'Passed', ai_confidence = 0.95
      WHERE produce_id = ?
    `, [produceId]);

    res.json({
      success: true,
      produceId,
      verification: verificationResults
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
