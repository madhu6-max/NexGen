const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');

// Haversine formula in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 15; // default fallback km
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * 5-Factor Rule-Based Match Scoring Helper
 * @param {Object} candidateProduce - Produce listing
 * @param {Object} requirement - Buyer procurement requirement
 */
function scorePair(candidateProduce, requirement) {
  const reqLat = requirement.delivery_lat || 16.7190;
  const reqLng = requirement.delivery_lng || 81.1090;
  const maxDist = requirement.max_distance_km || 100;
  const targetQty = requirement.quantity_kg;
  const maxPrice = requirement.max_price_per_kg;
  const targetGrade = requirement.quality_grade;
  const reqDeliveryDate = requirement.required_delivery_date ? new Date(requirement.required_delivery_date) : new Date();

  // 1. Quantity Match (30% weight)
  let quantityScore = 0;
  let quantityExplanation = '';
  if (candidateProduce.available_qty_kg >= targetQty) {
    quantityScore = 30;
    quantityExplanation = `Full quantity available (${candidateProduce.available_qty_kg.toLocaleString()} kg available vs ${targetQty.toLocaleString()} kg required)`;
  } else {
    const ratio = candidateProduce.available_qty_kg / targetQty;
    quantityScore = Math.max(5, Math.round(ratio * 30));
    quantityExplanation = `Partial quantity available (${candidateProduce.available_qty_kg.toLocaleString()} kg of ${targetQty.toLocaleString()} kg)`;
  }

  // 2. Quality Match (25% weight)
  let qualityScore = 0;
  let qualityExplanation = '';
  if (candidateProduce.quality_grade === targetGrade) {
    qualityScore = 25;
    qualityExplanation = `Exact grade match (${candidateProduce.quality_grade})`;
  } else if (candidateProduce.quality_grade === 'Grade A' && targetGrade === 'Grade B') {
    qualityScore = 25;
    qualityExplanation = `Higher quality supplied (${candidateProduce.quality_grade} exceeds requested ${targetGrade})`;
  } else {
    qualityScore = 12;
    qualityExplanation = `Alternative grade (${candidateProduce.quality_grade} vs requested ${targetGrade})`;
  }

  // 3. Location / Proximity (20% weight)
  const distanceKm = calculateDistance(candidateProduce.latitude, candidateProduce.longitude, reqLat, reqLng);
  let locationScore = 0;
  let locationExplanation = '';
  if (distanceKm <= 15) {
    locationScore = 20;
    locationExplanation = `Very close proximity (${distanceKm} km, under 15 km)`;
  } else if (distanceKm <= maxDist) {
    const distFactor = (maxDist - distanceKm) / maxDist;
    locationScore = Math.max(10, Math.round(distFactor * 20));
    locationExplanation = `Within allowable distance (${distanceKm} km of max ${maxDist} km)`;
  } else {
    locationScore = 5;
    locationExplanation = `Outside preferred radius (${distanceKm} km vs max ${maxDist} km)`;
  }

  // 4. Delivery Date / Availability (15% weight)
  let deliveryScore = 0;
  let deliveryExplanation = '';
  const availDate = candidateProduce.available_from ? new Date(candidateProduce.available_from) : new Date();
  if (availDate <= reqDeliveryDate) {
    deliveryScore = 15;
    deliveryExplanation = `Immediate stock ready for dispatch by required delivery date`;
  } else {
    deliveryScore = 7;
    deliveryExplanation = `Ready shortly after preferred date`;
  }

  // 5. Price Match (10% weight)
  let priceScore = 0;
  let priceExplanation = '';
  if (candidateProduce.expected_price_per_kg <= maxPrice) {
    const savings = maxPrice - candidateProduce.expected_price_per_kg;
    priceScore = 10;
    priceExplanation = savings > 0
      ? `Within budget: ₹${candidateProduce.expected_price_per_kg}/kg (₹${savings.toFixed(1)}/kg under ceiling)`
      : `Exact budget ceiling: ₹${candidateProduce.expected_price_per_kg}/kg`;
  } else {
    const excess = candidateProduce.expected_price_per_kg - maxPrice;
    priceScore = Math.max(2, Math.round(10 - excess * 2));
    priceExplanation = `Exceeds initial budget by ₹${excess.toFixed(1)}/kg (Negotiable)`;
  }

  const rawScore = quantityScore + qualityScore + locationScore + deliveryScore + priceScore;
  const reliabilityBonus = (candidateProduce.reliability_score >= 90) ? 2 : 0;
  const finalScore = Math.min(99, Math.max(40, rawScore + reliabilityBonus));

  return {
    finalMatchScore: finalScore,
    distanceKm,
    scoreBreakdown: {
      quantity: { score: quantityScore, max: 30, passed: quantityScore >= 25, explanation: quantityExplanation },
      quality: { score: qualityScore, max: 25, passed: qualityScore >= 20, explanation: qualityExplanation },
      location: { score: locationScore, max: 20, passed: locationScore >= 14, explanation: locationExplanation },
      delivery: { score: deliveryScore, max: 15, passed: deliveryScore >= 12, explanation: deliveryExplanation },
      price: { score: priceScore, max: 10, passed: priceScore >= 8, explanation: priceExplanation }
    }
  };
}

// 1. GET /api/matching/requirement/:reqId (Buyer finds matching farmer produce listings)
router.get('/requirement/:reqId', async (req, res) => {
  try {
    const requirement = await get(`
      SELECT pr.*, c.name as crop_name, o.company_name as buyer_company, o.trust_score as buyer_trust
      FROM procurement_requirements pr
      JOIN crops c ON pr.crop_id = c.id
      JOIN organizations o ON pr.buyer_id = o.id
      WHERE pr.id = ?
    `, [req.params.reqId]);

    if (!requirement) return res.status(404).json({ error: 'Requirement not found' });

    // Find candidate produce listings for this crop
    // (No farmer contact details: public matches carry identity/coarse
    // location only; contact happens through authenticated requests.)
    const candidates = await query(`
      SELECT pl.*, c.name as crop_name,
             f.name as farmer_name, f.village as farmer_village,
             f.district as farmer_district, f.reliability_score, f.rating as farmer_rating,
             f.total_orders, f.verified_status as farmer_verified
      FROM produce_listings pl
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON pl.farmer_id = f.id
      WHERE pl.crop_id = ? AND pl.status = 'Available'
    `, [requirement.crop_id]);

    const scoredMatches = candidates.map(candidate => {
      const scoring = scorePair(candidate, requirement);
      return {
        produceId: candidate.id,
        farmerId: candidate.farmer_id,
        farmerName: candidate.farmer_name,
        farmerVillage: candidate.farmer_village,
        farmerDistrict: candidate.farmer_district,
        farmerRating: candidate.farmer_rating,
        farmerReliability: candidate.reliability_score,
        farmerTotalOrders: candidate.total_orders,
        farmerVerified: candidate.farmer_verified === 'VERIFIED',
        cropName: candidate.crop_name,
        cropId: candidate.crop_id,
        title: candidate.title,
        imageUrl: candidate.image_url,
        availableQtyKg: candidate.available_qty_kg,
        totalQtyKg: candidate.total_qty_kg,
        qualityGrade: candidate.quality_grade,
        pricePerKg: candidate.expected_price_per_kg,
        distanceKm: scoring.distanceKm,
        finalMatchScore: scoring.finalMatchScore,
        scoreBreakdown: scoring.scoreBreakdown
      };
    });

    scoredMatches.sort((a, b) => b.finalMatchScore - a.finalMatchScore);

    res.json({
      success: true,
      requirement,
      totalMatches: scoredMatches.length,
      matches: scoredMatches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/matching/produce/:produceId (Farmer finds matching commercial buyer demands)
router.get('/produce/:produceId', async (req, res) => {
  try {
    const produce = await get(`
      SELECT pl.*, c.name as crop_name,
             f.name as farmer_name, f.village as farmer_village,
             f.district as farmer_district, f.reliability_score, f.rating as farmer_rating,
             f.total_orders, f.verified_status as farmer_verified
      FROM produce_listings pl
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON pl.farmer_id = f.id
      WHERE pl.id = ?
    `, [req.params.produceId]);

    if (!produce) return res.status(404).json({ error: 'Produce listing not found' });

    // Find all open buyer requirements for this crop
    // (No buyer contact details in public matches.)
    const requirements = await query(`
      SELECT pr.*, c.name as crop_name,
             o.company_name, o.business_type, pr.delivery_location as buyer_district,
             o.trust_score, o.verified_status as buyer_verified
      FROM procurement_requirements pr
      JOIN crops c ON pr.crop_id = c.id
      JOIN organizations o ON pr.buyer_id = o.id
      WHERE pr.crop_id = ? AND pr.status IN ('Open', 'Matching')
    `, [produce.crop_id]);

    const scoredMatches = requirements.map(reqItem => {
      const scoring = scorePair(produce, reqItem);
      return {
        requirementId: reqItem.id,
        buyerId: reqItem.buyer_id,
        buyerCompany: reqItem.company_name,
        buyerBusinessType: reqItem.business_type,
        buyerDistrict: reqItem.buyer_district || reqItem.delivery_location || 'Eluru',
        buyerState: 'Andhra Pradesh',
        buyerTrustScore: reqItem.trust_score,
        buyerVerified: reqItem.buyer_verified === 'VERIFIED',
        cropId: reqItem.crop_id,
        cropName: reqItem.crop_name,
        title: reqItem.title,
        quantityKg: reqItem.quantity_kg,
        qualityGrade: reqItem.quality_grade,
        maxPricePerKg: reqItem.max_price_per_kg,
        requiredDeliveryDate: reqItem.required_delivery_date,
        deliveryLocation: reqItem.delivery_location,
        specialRequirements: reqItem.special_requirements,
        distanceKm: scoring.distanceKm,
        finalMatchScore: scoring.finalMatchScore,
        scoreBreakdown: scoring.scoreBreakdown
      };
    });

    scoredMatches.sort((a, b) => b.finalMatchScore - a.finalMatchScore);

    res.json({
      success: true,
      produce,
      totalMatches: scoredMatches.length,
      matches: scoredMatches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/matching/farmer/:farmerId (All buyer matches across all farmer produce)
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const produceList = await query(`
      SELECT pl.*, c.name as crop_name,
             f.name as farmer_name, f.village as farmer_village,
             f.district as farmer_district, f.reliability_score, f.rating as farmer_rating,
             f.total_orders, f.verified_status as farmer_verified
      FROM produce_listings pl
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON pl.farmer_id = f.id
      WHERE pl.farmer_id = ? AND pl.status = 'Available'
    `, [req.params.farmerId]);

    const results = [];

    for (const produce of produceList) {
      const requirements = await query(`
        SELECT pr.*, c.name as crop_name,
               o.company_name, o.business_type, pr.delivery_location as buyer_district,
               o.trust_score, o.verified_status as buyer_verified
        FROM procurement_requirements pr
        JOIN crops c ON pr.crop_id = c.id
        JOIN organizations o ON pr.buyer_id = o.id
        WHERE pr.crop_id = ? AND pr.status IN ('Open', 'Matching')
      `, [produce.crop_id]);

      const matchedBuyers = requirements.map(reqItem => {
        const scoring = scorePair(produce, reqItem);
        return {
          requirementId: reqItem.id,
          buyerId: reqItem.buyer_id,
          buyerCompany: reqItem.company_name,
          buyerBusinessType: reqItem.business_type,
          buyerDistrict: reqItem.buyer_district,
          buyerTrustScore: reqItem.trust_score,
          buyerVerified: reqItem.buyer_verified === 'VERIFIED',
          title: reqItem.title,
          quantityKg: reqItem.quantity_kg,
          qualityGrade: reqItem.quality_grade,
          maxPricePerKg: reqItem.max_price_per_kg,
          requiredDeliveryDate: reqItem.required_delivery_date,
          deliveryLocation: reqItem.delivery_location,
          distanceKm: scoring.distanceKm,
          finalMatchScore: scoring.finalMatchScore,
          scoreBreakdown: scoring.scoreBreakdown
        };
      }).sort((a, b) => b.finalMatchScore - a.finalMatchScore);

      results.push({
        produceId: produce.id,
        cropName: produce.crop_name,
        cropId: produce.crop_id,
        title: produce.title,
        availableQtyKg: produce.available_qty_kg,
        qualityGrade: produce.quality_grade,
        pricePerKg: produce.expected_price_per_kg,
        district: produce.district,
        imageUrl: produce.image_url,
        matchCount: matchedBuyers.length,
        topMatchScore: matchedBuyers.length > 0 ? matchedBuyers[0].finalMatchScore : 0,
        matches: matchedBuyers
      });
    }

    res.json({
      success: true,
      farmerId: req.params.farmerId,
      totalProduce: results.length,
      produceMatches: results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/matching/browse (Marketplace-wide match explorer for both roles)
router.get('/browse', async (req, res) => {
  try {
    const { cropId, district, minScore, role } = req.query;

    let produceSql = `
      SELECT pl.*, c.name as crop_name,
             f.name as farmer_name, f.village as farmer_village,
             f.district as farmer_district, f.reliability_score, f.rating as farmer_rating,
             f.total_orders, f.verified_status as farmer_verified
      FROM produce_listings pl
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON pl.farmer_id = f.id
      WHERE pl.status = 'Available'
    `;
    const pParams = [];
    if (cropId) {
      produceSql += ` AND pl.crop_id = ?`;
      pParams.push(cropId);
    }
    if (district) {
      produceSql += ` AND pl.district LIKE ?`;
      pParams.push(`%${district}%`);
    }

    const produceCandidates = await query(produceSql, pParams);

    let reqSql = `
      SELECT pr.*, c.name as crop_name,
             o.company_name, o.business_type, pr.delivery_location as buyer_district,
             o.trust_score, o.verified_status as buyer_verified
      FROM procurement_requirements pr
      JOIN crops c ON pr.crop_id = c.id
      JOIN organizations o ON pr.buyer_id = o.id
      WHERE pr.status IN ('Open', 'Matching')
    `;
    const rParams = [];
    if (cropId) {
      reqSql += ` AND pr.crop_id = ?`;
      rParams.push(cropId);
    }
    const reqCandidates = await query(reqSql, rParams);

    const matches = [];
    const minThreshold = minScore ? parseInt(minScore, 10) : 50;

    for (const p of produceCandidates) {
      const matchingReqs = reqCandidates.filter(r => r.crop_id === p.crop_id);
      for (const r of matchingReqs) {
        const scoring = scorePair(p, r);
        if (scoring.finalMatchScore >= minThreshold) {
          matches.push({
            id: `match_${p.id}_${r.id}`,
            cropId: p.crop_id,
            cropName: p.crop_name,
            finalMatchScore: scoring.finalMatchScore,
            distanceKm: scoring.distanceKm,
            scoreBreakdown: scoring.scoreBreakdown,
            produce: {
              id: p.id,
              farmerId: p.farmer_id,
              farmerName: p.farmer_name,
              farmerDistrict: p.district,
              availableQtyKg: p.available_qty_kg,
              qualityGrade: p.quality_grade,
              pricePerKg: p.expected_price_per_kg,
              imageUrl: p.image_url,
              rating: p.farmer_rating,
              verified: p.farmer_verified === 'VERIFIED'
            },
            requirement: {
              id: r.id,
              buyerId: r.buyer_id,
              buyerCompany: r.company_name,
              buyerDistrict: r.buyer_district,
              quantityKg: r.quantity_kg,
              qualityGrade: r.quality_grade,
              maxPricePerKg: r.max_price_per_kg,
              requiredDeliveryDate: r.required_delivery_date,
              trustScore: r.trust_score,
              verified: r.buyer_verified === 'VERIFIED'
            }
          });
        }
      }
    }

    matches.sort((a, b) => b.finalMatchScore - a.finalMatchScore);

    res.json({
      success: true,
      totalMatches: matches.length,
      matches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/matching/farmer-proposal (Farmer directly sends offer to a matched buyer requirement)
router.post('/farmer-proposal', async (req, res) => {
  try {
    const produce_id = req.body.produce_id || req.body.produceId;
    const requirement_id = req.body.requirement_id || req.body.requirementId;
    const offered_price_per_kg = req.body.offered_price_per_kg || req.body.offeredPrice || req.body.offered_price;
    const offered_qty_kg = req.body.offered_qty_kg || req.body.offeredQty || req.body.offered_qty;
    const delivery_date = req.body.delivery_date || req.body.deliveryDate;
    const note = req.body.note || req.body.notes;

    if (!produce_id || !requirement_id || !offered_price_per_kg || !offered_qty_kg) {
      return res.status(400).json({ error: 'Missing required proposal parameters.' });
    }

    const produce = await get(`SELECT * FROM produce_listings WHERE id = ?`, [produce_id]);
    if (!produce) return res.status(404).json({ error: 'Produce listing not found' });

    const requirement = await get(`SELECT * FROM procurement_requirements WHERE id = ?`, [requirement_id]);
    if (!requirement) return res.status(404).json({ error: 'Requirement not found' });

    const farmer = await get(`SELECT * FROM farmers WHERE id = ?`, [produce.farmer_id]);
    const buyer = await get(`SELECT * FROM organizations WHERE id = ?`, [requirement.buyer_id]);

    const requestId = `pr_${Date.now()}`;
    const now = new Date().toISOString();

    await run(`
      INSERT INTO purchase_requests (
        id, requirement_id, produce_id, buyer_id, farmer_id, requested_qty_kg,
        offered_price_per_kg, counter_price_per_kg, delivery_date, status, last_actor, note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'farmer', ?, ?, ?)
    `, [
      requestId, requirement.id, produce.id, requirement.buyer_id, produce.farmer_id,
      parseFloat(offered_qty_kg), parseFloat(offered_price_per_kg), parseFloat(offered_price_per_kg),
      delivery_date || requirement.required_delivery_date, note || `Direct commercial proposal from verified farmer ${farmer ? farmer.name : ''}`,
      now, now
    ]);

    // Negotiation history entry
    await run(`
      INSERT INTO negotiation_history (id, request_id, sender_role, sender_name, price_per_kg, qty_kg, delivery_date, note, created_at)
      VALUES (?, ?, 'farmer', ?, ?, ?, ?, ?, ?)
    `, [
      `nh_${Date.now()}`, requestId, farmer ? farmer.name : 'Farmer',
      parseFloat(offered_price_per_kg), parseFloat(offered_qty_kg), delivery_date || requirement.required_delivery_date,
      note || `Farmer initiated proposal: ₹${offered_price_per_kg}/kg for ${parseFloat(offered_qty_kg).toLocaleString()} kg`,
      now
    ]);

    // Send notification to buyer
    const buyerUser = await get(`SELECT u.id FROM organizations o JOIN users u ON o.user_id = u.id WHERE o.id = ?`, [requirement.buyer_id]);
    if (buyerUser) {
      await run(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'New Proposal from Matched Farmer!', ?, 'request', '/buyer/negotiations')
      `, [
        `notif_${Date.now()}`, buyerUser.id,
        `Farmer ${farmer ? farmer.name : 'A farmer'} submitted a direct offer for ${requirement.title}: ${offered_qty_kg} kg at ₹${offered_price_per_kg}/kg.`
      ]);
    }

    const created = await get(`SELECT * FROM purchase_requests WHERE id = ?`, [requestId]);
    res.status(201).json({ success: true, message: 'Proposal dispatched successfully to buyer!', request: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
