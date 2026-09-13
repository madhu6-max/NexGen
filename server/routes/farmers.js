const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Ownership check: admin may access any farmer; a farmer may access only
// the farmer profile linked to their own authenticated user id (DB-verified).
async function checkFarmerOwnerOrAdmin(req, res) {
  if (req.user.role === 'admin') return true;
  if (req.user.role !== 'farmer') {
    res.status(403).json({ error: 'Access denied. Farmers can only access their own data.' });
    return false;
  }
  const own = await get(`SELECT id FROM farmers WHERE user_id = ?`, [req.user.id]);
  if (!own || own.id !== req.params.id) {
    res.status(403).json({ error: 'Access denied. You can only access your own farmer data.' });
    return false;
  }
  return true;
}

// GET /api/farmers/:id/dashboard
router.get('/:id/dashboard', authenticate, async (req, res) => {
  try {
    if (!(await checkFarmerOwnerOrAdmin(req, res))) return;

    const farmerId = req.params.id;
    const farmer = await get(`SELECT * FROM farmers WHERE id = ?`, [farmerId]);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    // Aggregates
    const produceCount = await get(`SELECT COUNT(*) as count, COALESCE(SUM(available_qty_kg), 0) as total_qty FROM produce_listings WHERE farmer_id = ? AND status = 'Available'`, [farmerId]);
    const pendingReqs = await get(`SELECT COUNT(*) as count FROM purchase_requests WHERE farmer_id = ? AND status IN ('Pending', 'Counter_Offered')`, [farmerId]);
    const activeOrders = await get(`SELECT COUNT(*) as count FROM orders WHERE farmer_id = ? AND status NOT IN ('Completed', 'Cancelled', 'Returned')`, [farmerId]);
    const completedOrders = await get(`SELECT COUNT(*) as count FROM orders WHERE farmer_id = ? AND status = 'Completed'`, [farmerId]);
    const recentRequests = await query(`
      SELECT pr.*, o.company_name, o.trust_score, pl.title as produce_title, c.name as crop_name
      FROM purchase_requests pr
      JOIN organizations o ON pr.buyer_id = o.id
      JOIN produce_listings pl ON pr.produce_id = pl.id
      JOIN crops c ON pl.crop_id = c.id
      WHERE pr.farmer_id = ?
      ORDER BY pr.created_at DESC LIMIT 5
    `, [farmerId]);

    const recentOrders = await query(`
      SELECT ord.*, o.company_name, c.name as crop_name
      FROM orders ord
      JOIN organizations o ON ord.buyer_id = o.id
      JOIN crops c ON ord.crop_id = c.id
      WHERE ord.farmer_id = ?
      ORDER BY ord.created_at DESC LIMIT 5
    `, [farmerId]);

    res.json({
      farmer,
      metrics: {
        totalProduceTons: (produceCount.total_qty / 1000).toFixed(1),
        activeListings: produceCount.count,
        pendingRequests: pendingReqs.count,
        activeOrders: activeOrders.count,
        completedOrders: completedOrders.count,
        reliability: `${farmer.reliability_score}%`,
        rating: farmer.rating
      },
      recentRequests,
      recentOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/farmers/:id
router.get('/:id', async (req, res) => {
  try {
    const farmer = await get(`SELECT * FROM farmers WHERE id = ?`, [req.params.id]);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    const farms = await query(`SELECT * FROM farms WHERE farmer_id = ?`, [farmer.id]);
    const verifications = await query(`SELECT * FROM farmer_verifications WHERE farmer_id = ? ORDER BY step_number ASC`, [farmer.id]);
    const produce = await query(`SELECT pl.*, c.name as crop_name FROM produce_listings pl JOIN crops c ON pl.crop_id = c.id WHERE pl.farmer_id = ?`, [farmer.id]);
    const ratings = await query(`SELECT * FROM ratings WHERE to_user_id = ? ORDER BY created_at DESC`, [farmer.user_id]);

    // Public profile: never expose private contact details or precise
    // geolocation. Internal ids stay server-side for the queries above.
    const { phone: _phone, email: _email, user_id: _userId, ...publicFarmer } = farmer;
    const publicFarms = farms.map(({ latitude, longitude, ...farm }) => farm);

    res.json({
      farmer: publicFarmer,
      farms: publicFarms,
      verifications,
      produce,
      ratings,
      trustPanel: {
        identity: verifications.some(v => v.step_number === 1 && v.status === 'VERIFIED'),
        farm: verifications.some(v => v.step_number === 2 && v.status === 'VERIFIED'),
        location: verifications.some(v => v.step_number === 3 && v.status === 'VERIFIED'),
        historicalActivity: farmer.total_orders > 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/farmers/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!(await checkFarmerOwnerOrAdmin(req, res))) return;

    const { name, phone, village, district, farm_size_acres, fpo_name, bank_account_placeholder } = req.body;
    await run(`
      UPDATE farmers
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          village = COALESCE(?, village),
          district = COALESCE(?, district),
          farm_size_acres = COALESCE(?, farm_size_acres),
          fpo_name = COALESCE(?, fpo_name),
          bank_account_placeholder = COALESCE(?, bank_account_placeholder)
      WHERE id = ?
    `, [name, phone, village, district, farm_size_acres, fpo_name, bank_account_placeholder, req.params.id]);

    const updated = await get(`SELECT * FROM farmers WHERE id = ?`, [req.params.id]);
    res.json({ success: true, farmer: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/farmers/:id/verify-step
// Verification authority: admin only. Never trust client identity for certification.
router.post('/:id/verify-step', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { stepNumber, stepName, docType, notes } = req.body;
    const existing = await get(
      `SELECT id FROM farmer_verifications WHERE farmer_id = ? AND step_number = ?`,
      [req.params.id, stepNumber]
    );

    const now = new Date().toISOString();
    if (existing) {
      await run(`
        UPDATE farmer_verifications
        SET status = 'VERIFIED', doc_type = ?, notes = ?, verified_at = ?
        WHERE id = ?
      `, [docType, notes || 'Verified for Hackathon Demo', now, existing.id]);
    } else {
      const vid = `fv_${Date.now()}`;
      await run(`
        INSERT INTO farmer_verifications (id, farmer_id, step_number, step_name, status, doc_type, doc_url, notes, verified_at)
        VALUES (?, ?, ?, ?, 'VERIFIED', ?, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500&q=80', ?, ?)
      `, [vid, req.params.id, stepNumber, stepName, docType, notes || 'Verified for Hackathon Demo', now]);
    }

    const verifications = await query(`SELECT * FROM farmer_verifications WHERE farmer_id = ? ORDER BY step_number ASC`, [req.params.id]);

    // If all 4 steps verified, certify the farmer
    if (verifications.length >= 4 && verifications.every(v => v.status === 'VERIFIED')) {
      await run(`UPDATE farmers SET verified_status = 'VERIFIED', reliability_score = 95 WHERE id = ?`, [req.params.id]);

      const f = await get(`SELECT user_id, name FROM farmers WHERE id = ?`, [req.params.id]);
      if (f) {
        await run(`
          INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
          VALUES (?, ?, '🎉 Farm Verification Certified!', 'Congratulations! All 4 verification stages (Identity, Land Title, Geolocation, Produce) are approved. You are now a Verified Producer.', 'system', '/farmer/dashboard', 0, ?)
        `, [`notif_${Date.now()}`, f.user_id, now]);
      }
    }

    const updatedFarmer = await get(`SELECT * FROM farmers WHERE id = ?`, [req.params.id]);
    res.json({ success: true, verifications, farmer: updatedFarmer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/farmers/:id/verify-all (1-Click complete 4-step KYC)
// Verification authority: admin only. Never trust client identity for certification.
router.post('/:id/verify-all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const farmer = await get(`SELECT * FROM farmers WHERE id = ?`, [req.params.id]);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    const now = new Date().toISOString();
    const steps = [
      { step: 1, name: 'Step 1: Identity Verification', doc: 'Aadhaar / Farmer ID Card', notes: 'Biometric e-KYC token authenticated.' },
      { step: 2, name: 'Step 2: Farm Land Ownership Verification', doc: 'Pattadar Passbook / Webland AP 1B', notes: `Survey No. 142/2A validated against ${farmer.district} Revenue Records.` },
      { step: 3, name: 'Step 3: Geotagged Boundary Verification', doc: 'GPS Geotagged Field Survey', notes: 'Field coordinates verified within AP agricultural boundary.' },
      { step: 4, name: 'Step 4: Produce & Soil Inspection', doc: 'Crop Stage & Quality Assessment', notes: 'Crop maturity verified with soil organic carbon test.' }
    ];

    for (const s of steps) {
      const existing = await get(`SELECT id FROM farmer_verifications WHERE farmer_id = ? AND step_number = ?`, [farmer.id, s.step]);
      if (existing) {
        await run(`UPDATE farmer_verifications SET status = 'VERIFIED', doc_type = ?, notes = ?, verified_at = ? WHERE id = ?`, [s.doc, s.notes, now, existing.id]);
      } else {
        await run(`
          INSERT INTO farmer_verifications (id, farmer_id, step_number, step_name, status, doc_type, doc_url, notes, verified_at)
          VALUES (?, ?, ?, ?, 'VERIFIED', ?, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500&q=80', ?, ?)
        `, [`fv_${Date.now()}_${s.step}`, farmer.id, s.step, s.name, s.doc, s.notes, now]);
      }
    }

    // Set farmer as VERIFIED
    await run(`UPDATE farmers SET verified_status = 'VERIFIED', reliability_score = 95 WHERE id = ?`, [farmer.id]);

    await run(`
      INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, '🎉 4-Step Farm Verification Completed!', 'All 4 verification stages approved! You are officially certified as a Verified Producer on AgriLink.', 'system', '/farmer/dashboard', 0, ?)
    `, [`notif_${Date.now()}`, farmer.user_id, now]);

    const updated = await get(`SELECT * FROM farmers WHERE id = ?`, [farmer.id]);
    const verifications = await query(`SELECT * FROM farmer_verifications WHERE farmer_id = ? ORDER BY step_number ASC`, [farmer.id]);

    res.json({ success: true, farmer: updated, verifications, message: 'Farmer verified across all 4 stages successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
