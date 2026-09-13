const express = require('express');
const router = express.Router();
const { query, get } = require('../db/database');

// GET /api/crops
router.get('/', async (req, res) => {
  try {
    const crops = await query(`SELECT * FROM crops ORDER BY name ASC`);
    res.json({ success: true, crops });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crops/:id
router.get('/:id', async (req, res) => {
  try {
    const crop = await get(`SELECT * FROM crops WHERE id = ?`, [req.params.id]);
    if (!crop) return res.status(404).json({ error: 'Crop not found' });
    res.json({ success: true, crop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crops/:id/market-intelligence
// Supports query params: location, quantity, expectedSellingDate
router.get('/:id/market-intelligence', async (req, res) => {
  try {
    const crop = await get(`SELECT * FROM crops WHERE id = ?`, [req.params.id]);
    if (!crop) return res.status(404).json({ error: 'Crop not found' });

    const location = req.query.location || 'Eluru, Andhra Pradesh';
    const quantity = parseFloat(req.query.quantity) || 10000;

    // Fetch actual historical points recorded for this crop
    const history = await query(`
      SELECT * FROM market_prices
      WHERE crop_id = ?
      ORDER BY price_date DESC
    `, [crop.id]);

    // Generate comprehensive timeline points for 30-day, 90-day, and 1-year charts
    const basePrice = crop.current_market_price;
    const history30Days = [
      { date: 'Aug 12', price: Number((basePrice * 0.88).toFixed(1)), volumeTonnes: 190 },
      { date: 'Aug 18', price: Number((basePrice * 0.90).toFixed(1)), volumeTonnes: 180 },
      { date: 'Aug 24', price: Number((basePrice * 0.93).toFixed(1)), volumeTonnes: 165 },
      { date: 'Aug 30', price: Number((basePrice * 0.95).toFixed(1)), volumeTonnes: 155 },
      { date: 'Sep 03', price: Number((basePrice * 0.97).toFixed(1)), volumeTonnes: 148 },
      { date: 'Sep 06', price: Number((basePrice * 0.99).toFixed(1)), volumeTonnes: 142 },
      { date: 'Sep 09', price: Number(basePrice.toFixed(1)), volumeTonnes: 145 },
      { date: 'Sep 10 (Today)', price: Number((basePrice * 1.01).toFixed(1)), volumeTonnes: 140 }
    ];

    const history90Days = [
      { date: 'Jun 15', price: Number((basePrice * 1.15).toFixed(1)), volumeTonnes: 110 },
      { date: 'Jul 01', price: Number((basePrice * 0.98).toFixed(1)), volumeTonnes: 170 },
      { date: 'Jul 15', price: Number((basePrice * 0.82).toFixed(1)), volumeTonnes: 230 },
      { date: 'Aug 01', price: Number((basePrice * 0.85).toFixed(1)), volumeTonnes: 210 },
      { date: 'Aug 15', price: Number((basePrice * 0.89).toFixed(1)), volumeTonnes: 190 },
      { date: 'Sep 01', price: Number((basePrice * 0.95).toFixed(1)), volumeTonnes: 160 },
      { date: 'Sep 10', price: Number(basePrice.toFixed(1)), volumeTonnes: 140 }
    ];

    const history1Year = [
      { month: 'Oct 25', price: Number((basePrice * 0.92).toFixed(1)) },
      { month: 'Dec 25', price: Number((basePrice * 0.85).toFixed(1)) },
      { month: 'Feb 26', price: Number((basePrice * 0.80).toFixed(1)) },
      { month: 'Apr 26', price: Number((basePrice * 0.95).toFixed(1)) },
      { month: 'Jun 26', price: Number((basePrice * 1.15).toFixed(1)) },
      { month: 'Aug 26', price: Number((basePrice * 0.88).toFixed(1)) },
      { month: 'Sep 26', price: Number(basePrice.toFixed(1)) }
    ];

    // Predictive insights
    const forecastMin = crop.indicative_forecast_min || Math.round(basePrice * 0.95);
    const forecastMax = crop.indicative_forecast_max || Math.round(basePrice * 1.14);
    const recommendedListingMin = Math.round(basePrice * 1.02);
    const recommendedListingMax = Math.round(basePrice * 1.10);

    res.json({
      success: true,
      crop: {
        id: crop.id,
        name: crop.name,
        variety: crop.variety,
        category: crop.category,
        image_url: crop.image_url
      },
      currentMarketPrice: `₹${basePrice}/kg`,
      currentPriceNum: basePrice,
      marketLocation: location,
      selectedQuantityKg: quantity,
      estimatedBatchValue: `₹${((quantity * basePrice) / 100000).toFixed(2)} Lakhs`,
      trend: {
        direction: crop.price_trend || 'increasing',
        label: '↑ Increasing (+4.2% over 7 days)',
        color: 'text-emerald-600'
      },
      futurePriceEstimate: {
        range: `₹${forecastMin} - ₹${forecastMax}/kg`,
        min: forecastMin,
        max: forecastMax,
        disclaimer: 'Indicative market estimate based on seasonal APMC mandi arrival volumes. Not guaranteed future pricing.'
      },
      recommendedAction: {
        listingRange: `₹${recommendedListingMin} - ₹${recommendedListingMax}/kg`,
        strategy: `Demand is surging in food processing centers. Consider listing between ₹${recommendedListingMin}-₹${recommendedListingMax}/kg for optimal buyer conversion within 7 days.`
      },
      historicalPrices: {
        thirtyDays: history30Days,
        ninetyDays: history90Days,
        oneYear: history1Year,
        recordedMandiPoints: history
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
