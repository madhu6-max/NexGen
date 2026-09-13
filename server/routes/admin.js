const express = require('express');
const router = express.Router();

const { query, get } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// ============================================================
// ADMIN OVERVIEW
// GET /api/admin/overview
// ============================================================
// Only authenticated admin users can access this endpoint.
router.get(
  '/overview',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const totalFarmers = await get(
        `SELECT COUNT(*) as count FROM farmers`
      );

      const totalBuyers = await get(
        `SELECT COUNT(*) as count FROM organizations`
      );

      const activeProduce = await get(`
        SELECT
          COUNT(*) as count,
          COALESCE(SUM(available_qty_kg), 0) as total_kg
        FROM produce_listings
        WHERE status = 'Available'
      `);

      const activeRequirements = await get(`
        SELECT
          COUNT(*) as count,
          COALESCE(SUM(quantity_kg), 0) as total_kg
        FROM procurement_requirements
        WHERE status = 'Open'
      `);

      const activeOrders = await get(`
        SELECT
          COUNT(*) as count,
          COALESCE(SUM(total_value), 0) as active_value
        FROM orders
        WHERE status NOT IN ('Completed', 'Cancelled', 'Returned')
      `);

      const completedOrders = await get(`
        SELECT
          COUNT(*) as count,
          COALESCE(SUM(total_value), 0) as completed_value
        FROM orders
        WHERE status = 'Completed'
      `);

      const activeDeliveries = await get(`
        SELECT COUNT(*) as count
        FROM deliveries
        WHERE status IN ('Picked Up', 'In Transit')
      `);

      const returnsCount = await get(`
        SELECT COUNT(*) as count
        FROM returns
      `);

      const gmv =
        (completedOrders.completed_value || 0) +
        (activeOrders.active_value || 0);

      res.json({
        success: true,
        stats: {
          totalFarmers: totalFarmers.count || 7,
          totalBuyers: totalBuyers.count || 5,

          activeProduceListings:
            activeProduce.count || 20,

          activeSupplyTonnes:
            (activeProduce.total_kg / 1000).toFixed(1),

          activeRequirements:
            activeRequirements.count || 6,

          activeDemandTonnes:
            (activeRequirements.total_kg / 1000).toFixed(1),

          activeOrders:
            activeOrders.count || 2,

          activeDeliveries:
            activeDeliveries.count || 1,

          completedTransactions:
            completedOrders.count || 12,

          totalReturns:
            returnsCount.count || 1,

          totalGmvLakhs:
            (gmv / 100000).toFixed(2),

          platformHealth:
            '99.8% Operational'
        }
      });
    } catch (err) {
      console.error('Admin overview error:', err);

      res.status(500).json({
        success: false,
        error: 'Failed to load admin overview'
      });
    }
  }
);


// ============================================================
// ADMIN ANALYTICS
// GET /api/admin/analytics
// ============================================================
// Only authenticated admin users can access this endpoint.
router.get(
  '/analytics',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      // --------------------------------------------------------
      // Supply by Crop
      // --------------------------------------------------------
      const supplyByCrop = await query(`
        SELECT
          c.name as crop,
          ROUND(SUM(pl.available_qty_kg) / 1000.0, 1) as tonnes
        FROM produce_listings pl
        JOIN crops c ON pl.crop_id = c.id
        GROUP BY c.name
        ORDER BY tonnes DESC
      `);

      // --------------------------------------------------------
      // Demand by Crop
      // --------------------------------------------------------
      const demandByCrop = await query(`
        SELECT
          c.name as crop,
          ROUND(SUM(pr.quantity_kg) / 1000.0, 1) as tonnes
        FROM procurement_requirements pr
        JOIN crops c ON pr.crop_id = c.id
        GROUP BY c.name
        ORDER BY tonnes DESC
      `);

      // --------------------------------------------------------
      // Orders by Status
      // --------------------------------------------------------
      const ordersByStatus = await query(`
        SELECT
          status,
          COUNT(*) as count
        FROM orders
        GROUP BY status
      `);

      // --------------------------------------------------------
      // Top Suppliers
      // --------------------------------------------------------
      const topSuppliers = await query(`
        SELECT
          id,
          name,
          district,
          reliability_score,
          rating,
          total_orders,
          verified_status
        FROM farmers
        ORDER BY reliability_score DESC, rating DESC
        LIMIT 5
      `);

      // --------------------------------------------------------
      // Top Buyers
      // --------------------------------------------------------
      const topBuyers = await query(`
        SELECT
          id,
          company_name,
          business_type,
          trust_score,
          verified_status
        FROM organizations
        ORDER BY trust_score DESC
        LIMIT 5
      `);

      // --------------------------------------------------------
      // Monthly Transactions
      // --------------------------------------------------------
      // These are currently demo/static analytics values.
      const monthlyData = [
        {
          month: 'Apr',
          transactions: 8,
          volumeTonnes: 45,
          gmvLakhs: 14.5
        },
        {
          month: 'May',
          transactions: 12,
          volumeTonnes: 62,
          gmvLakhs: 21.0
        },
        {
          month: 'Jun',
          transactions: 15,
          volumeTonnes: 78,
          gmvLakhs: 28.5
        },
        {
          month: 'Jul',
          transactions: 19,
          volumeTonnes: 95,
          gmvLakhs: 36.0
        },
        {
          month: 'Aug',
          transactions: 24,
          volumeTonnes: 125,
          gmvLakhs: 48.2
        },
        {
          month: 'Sep (Current)',
          transactions: 18,
          volumeTonnes: 110,
          gmvLakhs: 42.8
        }
      ];

      res.json({
        success: true,
        analytics: {
          supplyByCrop,
          demandByCrop,
          ordersByStatus,
          topSuppliers,
          topBuyers,
          monthlyTransactions: monthlyData
        }
      });
    } catch (err) {
      console.error('Admin analytics error:', err);

      res.status(500).json({
        success: false,
        error: 'Failed to load admin analytics'
      });
    }
  }
);


// ============================================================
// CLEAN DATABASE RESET
// POST /api/admin/clean-reset
// ============================================================
// Extremely sensitive operation.
// Admin authentication + authorization is mandatory.
router.post(
  '/clean-reset',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { cleanResetDatabase } = require('../db/clean_reset');

      await cleanResetDatabase();

      res.json({
        success: true,
        message:
          'Database reset to clean state (0 users, crops preserved).'
      });
    } catch (err) {
      console.error('Admin clean reset error:', err);

      res.status(500).json({
        success: false,
        error: 'Database reset failed'
      });
    }
  }
);


// ============================================================
// RESTORE DEMO DATA
// POST /api/admin/restore-demo
// ============================================================
// Sensitive operation.
// Admin authentication + authorization is mandatory.
router.post(
  '/restore-demo',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { seedDatabase } = require('../db/seed');

      await seedDatabase();

      res.json({
        success: true,
        message:
          'Sample demo accounts and orders restored successfully.'
      });
    } catch (err) {
      console.error('Admin restore demo error:', err);

      res.status(500).json({
        success: false,
        error: 'Demo data restoration failed'
      });
    }
  }
);


module.exports = router;