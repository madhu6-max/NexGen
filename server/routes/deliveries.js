const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { authenticate } = require('../middleware/auth');

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

// True when the caller is admin or the farmer/buyer participant of the order
// that owns the delivery (ownership taken from the database, not the client).
async function isDeliveryParticipant(req, orderId) {
  if (req.user.role === 'admin') return true;
  const order = await get(`SELECT farmer_id, buyer_id FROM orders WHERE id = ?`, [orderId]);
  if (!order) return false;
  const parties = await getCallerParties(req);
  return (parties.farmerId && order.farmer_id === parties.farmerId) ||
    (parties.buyerId && order.buyer_id === parties.buyerId);
}

// Pre-computed GPS simulation waypoints along NH-16 (Eluru -> Rajahmundry)
const NH16_ROUTE_WAYPOINTS = [
  { name: 'Sanivarapupeta Farm, Eluru', lat: 16.7107, lng: 81.0952, distRemainingKm: 65.0, progress: 0, status: 'Picked Up', eta: 'Today, 5:30 PM' },
  { name: 'Gundugolanu Junction (NH16)', lat: 16.7645, lng: 81.2401, distRemainingKm: 52.0, progress: 20, status: 'In Transit', eta: 'Today, 5:15 PM' },
  { name: 'Tadepalligudem Bypass', lat: 16.8124, lng: 81.5284, distRemainingKm: 38.0, progress: 45, status: 'In Transit', eta: 'Today, 5:00 PM' },
  { name: 'Tanuku Godavari Approach', lat: 16.8550, lng: 81.6820, distRemainingKm: 24.5, progress: 62, status: 'In Transit', eta: 'Today, 4:45 PM' },
  { name: 'Kovvur Godavari Bridge', lat: 17.0080, lng: 81.7450, distRemainingKm: 8.0, progress: 88, status: 'In Transit', eta: 'Today, 4:30 PM' },
  { name: 'Rajahmundry Buyer Facility (Destination)', lat: 17.0005, lng: 81.8040, distRemainingKm: 0.0, progress: 100, status: 'Delivered', eta: 'Arrived' }
];

// GET /api/deliveries/:orderId
// Authenticated order participants (or admin) only.
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    const delivery = await get(`
      SELECT del.*, ord.order_code, ord.agreed_qty_kg, ord.pickup_location, ord.delivery_location,
             c.name as crop_name, f.name as farmer_name, o.company_name as buyer_name
      FROM deliveries del
      JOIN orders ord ON del.order_id = ord.id
      JOIN crops c ON ord.crop_id = c.id
      JOIN farmers f ON ord.farmer_id = f.id
      JOIN organizations o ON ord.buyer_id = o.id
      WHERE del.order_id = ? OR del.id = ?
    `, [req.params.orderId, req.params.orderId]);

    if (delivery && !(await isDeliveryParticipant(req, delivery.order_id))) {
      return res.status(403).json({ error: 'Access denied. You are not a participant of this order.' });
    }

    if (!delivery) {
      // Return default simulated structure for demonstration
      return res.json({
        success: true,
        delivery: {
          id: 'del_demo',
          driver_name: 'Ravi Kumar',
          driver_phone: '+91 98492 88472',
          vehicle_number: 'AP 37 TE 1234',
          pickup_lat: 16.7107,
          pickup_lng: 81.0952,
          delivery_lat: 17.0005,
          delivery_lng: 81.8040,
          current_lat: 16.8550,
          current_lng: 81.6820,
          distance_km: 65.0,
          distance_remaining_km: 24.5,
          estimated_arrival: 'Today, 5:30 PM',
          status: 'In Transit',
          progress_pct: 62
        },
        routeWaypoints: NH16_ROUTE_WAYPOINTS,
        disclaimer: 'Demo GPS tracking. Real-time fleet telematics simulated via API coordinates.'
      });
    }

    res.json({
      success: true,
      delivery,
      routeWaypoints: NH16_ROUTE_WAYPOINTS,
      disclaimer: 'Demo GPS tracking. Real-time fleet telematics simulated via API coordinates.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/deliveries/:id/step (Step the truck along the route or reset)
// Owning farmer or admin only; this advances the truck and the order status.
router.put('/:id/step', authenticate, async (req, res) => {
  try {
    const { stepIndex } = req.body;
    const delivery = await get(`SELECT * FROM deliveries WHERE id = ? OR order_id = ?`, [req.params.id, req.params.id]);
    if (!delivery) return res.status(404).json({ error: 'Delivery record not found' });

    if (req.user.role !== 'admin') {
      const own = await get(`SELECT id FROM farmers WHERE user_id = ?`, [req.user.id]);
      const order = await get(`SELECT farmer_id FROM orders WHERE id = ?`, [delivery.order_id]);
      if (!own || !order || own.id !== order.farmer_id) {
        return res.status(403).json({ error: 'Access denied. Only the supplying farmer can advance this delivery.' });
      }
    }

    let nextIndex = 0;
    if (typeof stepIndex === 'number') {
      nextIndex = Math.max(0, Math.min(stepIndex, NH16_ROUTE_WAYPOINTS.length - 1));
    } else {
      // Find closest waypoint and advance by 1
      const currentPct = delivery.progress_pct;
      if (currentPct < 20) nextIndex = 1;
      else if (currentPct < 45) nextIndex = 2;
      else if (currentPct < 65) nextIndex = 3;
      else if (currentPct < 90) nextIndex = 4;
      else if (currentPct < 100) nextIndex = 5;
      else nextIndex = 0; // wrap around for repeated demonstration
    }

    const targetWaypoint = NH16_ROUTE_WAYPOINTS[nextIndex];
    const now = new Date().toISOString();

    await run(`
      UPDATE deliveries
      SET current_lat = ?, current_lng = ?,
          distance_remaining_km = ?, progress_pct = ?,
          status = ?, estimated_arrival = ?, updated_at = ?
      WHERE id = ?
    `, [
      targetWaypoint.lat, targetWaypoint.lng,
      targetWaypoint.distRemainingKm, targetWaypoint.progress,
      targetWaypoint.status, targetWaypoint.eta, now, delivery.id
    ]);

    // If reached 100%, update order to Arrived at Destination
    if (targetWaypoint.progress >= 100) {
      await run(`UPDATE orders SET status = 'Arrived at Destination' WHERE id = ?`, [delivery.order_id]);
    } else if (targetWaypoint.progress >= 20) {
      await run(`UPDATE orders SET status = 'In Transit' WHERE id = ?`, [delivery.order_id]);
    }

    // Insert live delivery tracking notification
    try {
      const ord = await get(`SELECT order_code, buyer_id, farmer_id FROM orders WHERE id = ?`, [delivery.order_id]);
      if (ord) {
        const buyerUser = await get(`SELECT u.id FROM organizations o JOIN users u ON o.user_id = u.id WHERE o.id = ?`, [ord.buyer_id]);
        if (buyerUser) {
          await run(`
            INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
            VALUES (?, ?, ?, ?, 'delivery', '/buyer/orders', 0, ?)
          `, [
            `notif_${Date.now()}`, buyerUser.id,
            `🚚 Delivery: ${targetWaypoint.name}`,
            `Order ${ord.order_code} is now ${targetWaypoint.progress}% complete at ${targetWaypoint.name}. ETA: ${targetWaypoint.eta}.`,
            now
          ]);
        }
      }
    } catch (e) {
      console.warn('Could not insert delivery notification:', e.message);
    }

    const updated = await get(`SELECT * FROM deliveries WHERE id = ?`, [delivery.id]);

    res.json({
      success: true,
      currentStep: nextIndex,
      waypoint: targetWaypoint,
      delivery: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
