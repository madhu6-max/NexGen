const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Ownership check: admin may access any organization; a buyer may access only
// the organization linked to their own authenticated user id (DB-verified).
async function checkBuyerOwnerOrAdmin(req, res) {
  if (req.user.role === 'admin') return true;
  if (req.user.role !== 'buyer') {
    res.status(403).json({ error: 'Access denied. Buyers can only access their own organization data.' });
    return false;
  }
  const own = await get(`SELECT id FROM organizations WHERE user_id = ?`, [req.user.id]);
  if (!own || own.id !== req.params.id) {
    res.status(403).json({ error: 'Access denied. You can only access your own organization data.' });
    return false;
  }
  return true;
}

// GET /api/buyers/:id/dashboard
router.get('/:id/dashboard', authenticate, async (req, res) => {
  try {
    if (!(await checkBuyerOwnerOrAdmin(req, res))) return;

    const buyerId = req.params.id;
    const org = await get(`SELECT * FROM organizations WHERE id = ?`, [buyerId]);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const activeReqs = await get(`SELECT COUNT(*) as count FROM procurement_requirements WHERE buyer_id = ? AND status = 'Open'`, [buyerId]);
    const pendingRequests = await get(`SELECT COUNT(*) as count FROM purchase_requests WHERE buyer_id = ? AND status IN ('Pending', 'Counter_Offered')`, [buyerId]);
    const activeOrders = await get(`SELECT COUNT(*) as count FROM orders WHERE buyer_id = ? AND status NOT IN ('Completed', 'Cancelled', 'Returned')`, [buyerId]);
    const completedOrders = await get(`SELECT COUNT(*) as count FROM orders WHERE buyer_id = ? AND status = 'Completed'`, [buyerId]);

    // Matched suppliers aggregate count
    const totalMatches = await get(`SELECT COUNT(*) as count FROM produce_listings pl WHERE pl.status = 'Available'`);

    const recentRequirements = await query(`
      SELECT pr.*, c.name as crop_name, c.image_url as crop_image
      FROM procurement_requirements pr
      JOIN crops c ON pr.crop_id = c.id
      WHERE pr.buyer_id = ?
      ORDER BY pr.created_at DESC LIMIT 5
    `, [buyerId]);

    const activeOrderList = await query(`
      SELECT ord.*, f.name as farmer_name, f.district as farmer_district, c.name as crop_name,
             del.status as delivery_status, del.distance_remaining_km, del.estimated_arrival
      FROM orders ord
      JOIN farmers f ON ord.farmer_id = f.id
      JOIN crops c ON ord.crop_id = c.id
      LEFT JOIN deliveries del ON ord.id = del.order_id
      WHERE ord.buyer_id = ? AND ord.status NOT IN ('Completed', 'Cancelled', 'Returned')
      ORDER BY ord.created_at DESC
    `, [buyerId]);

    res.json({
      organization: org,
      metrics: {
        activeRequirements: activeReqs.count,
        matchedSuppliers: totalMatches.count || 18,
        pendingRequests: pendingRequests.count,
        activeOrders: activeOrders.count,
        completedOrders: completedOrders.count,
        trustScore: `${org.trust_score}%`
      },
      recentRequirements,
      activeOrders: activeOrderList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/buyers/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!(await checkBuyerOwnerOrAdmin(req, res))) return;

    const org = await get(`SELECT * FROM organizations WHERE id = ?`, [req.params.id]);
    if (!org) return res.status(404).json({ error: 'Buyer organization not found' });

    const requirements = await query(`
      SELECT pr.*, c.name as crop_name, c.current_market_price
      FROM procurement_requirements pr
      JOIN crops c ON pr.crop_id = c.id
      WHERE pr.buyer_id = ?
      ORDER BY pr.created_at DESC
    `, [org.id]);

    const orders = await query(`
      SELECT ord.*, f.name as farmer_name, c.name as crop_name
      FROM orders ord
      JOIN farmers f ON ord.farmer_id = f.id
      JOIN crops c ON ord.crop_id = c.id
      WHERE ord.buyer_id = ?
      ORDER BY ord.created_at DESC
    `, [org.id]);

    res.json({
      organization: org,
      requirements,
      orders,
      verificationChecklist: {
        orgIdentity: true,
        businessDetails: true,
        contactVerification: true,
        documentVerification: org.verified_status === 'VERIFIED'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/buyers/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!(await checkBuyerOwnerOrAdmin(req, res))) return;

    const { company_name, business_type, reg_number, address, contact_person, procurement_team_size } = req.body;
    await run(`
      UPDATE organizations
      SET company_name = COALESCE(?, company_name),
          business_type = COALESCE(?, business_type),
          reg_number = COALESCE(?, reg_number),
          address = COALESCE(?, address),
          contact_person = COALESCE(?, contact_person),
          procurement_team_size = COALESCE(?, procurement_team_size)
      WHERE id = ?
    `, [company_name, business_type, reg_number, address, contact_person, procurement_team_size, req.params.id]);

    const updated = await get(`SELECT * FROM organizations WHERE id = ?`, [req.params.id]);
    res.json({ success: true, organization: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/buyers/:id/verify (Verify Corporate / Business GSTIN Credential)
// Verification authority: admin only. Demo behavior preserved; only admins can trigger it.
router.post('/:id/verify', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { gstin, businessType, address } = req.body;
    const org = await get(`SELECT * FROM organizations WHERE id = ?`, [req.params.id]);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const now = new Date().toISOString();
    const updatedReg = gstin || org.reg_number || 'GSTIN-37AAACR1234F1Z9';

    await run(`
      UPDATE organizations
      SET verified_status = 'VERIFIED',
          reg_number = ?,
          business_type = COALESCE(?, business_type),
          address = COALESCE(?, address),
          trust_score = 96
      WHERE id = ?
    `, [updatedReg, businessType, address, req.params.id]);

    const updated = await get(`SELECT * FROM organizations WHERE id = ?`, [req.params.id]);

    // Send notification
    await run(`
      INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, '🏢 Corporate GST Verification Approved!', 'Your buyer credentials have been authenticated. You can now post requirements, match verified farmers, and place purchase orders.', 'system', '/buyer/dashboard', 0, ?)
    `, [`notif_${Date.now()}`, updated.user_id, now]);

    res.json({ success: true, organization: updated, message: 'Buyer organization verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
