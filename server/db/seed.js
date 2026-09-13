const bcrypt = require('bcryptjs');
const { run, query, initSchema } = require('./database');

async function seedDatabase() {
  console.log('Seeding AgriLink database with realistic Andhra Pradesh agricultural data...');

  await initSchema();

  // Clear existing data in reverse foreign key order (children before parents).
  // payment_transactions and order_status_history reference orders and must be
  // cleared first; otherwise the orders wipe fails and every dependent wipe
  // after it silently fails, leaving stale rows that break re-insertion.
  const tables = [
    'payment_transactions', 'order_status_history',
    'notifications', 'ratings', 'returns', 'quality_inspections', 'deliveries',
    'order_verifications', 'orders', 'negotiation_history', 'purchase_requests',
    'procurement_requirements', 'crop_quality_records', 'produce_listings',
    'market_prices', 'crops', 'farmer_verifications', 'farms', 'farmers',
    'organizations', 'users'
  ];

  for (const table of tables) {
    try {
      await run(`DELETE FROM ${table};`);
    } catch (e) {
      // Table might not exist yet or empty
    }
  }

  // 1. Users
  console.log('Inserting users...');
  const users = [
    // Farmers
    { id: 'usr_f1', name: 'Ramesh Kumar', email: 'ramesh.farmer@agrilink.in', phone: '+91 98480 12345', role: 'farmer', pass: 'farmer123' },
    { id: 'usr_f2', name: 'Suresh Varma', email: 'suresh.varma@agrilink.in', phone: '+91 98480 23456', role: 'farmer', pass: 'farmer123' },
    { id: 'usr_f3', name: 'Venkat Rao', email: 'venkat.rao@agrilink.in', phone: '+91 98480 34567', role: 'farmer', pass: 'farmer123' },
    { id: 'usr_f4', name: 'Lakshmi Devi', email: 'lakshmi.fpo@agrilink.in', phone: '+91 98480 45678', role: 'farmer', pass: 'farmer123' },
    { id: 'usr_f5', name: 'Appa Rao', email: 'apparao.horti@agrilink.in', phone: '+91 98480 56789', role: 'farmer', pass: 'farmer123' },
    { id: 'usr_f6', name: 'Satyanarayana Raju', email: 'satya.raju@agrilink.in', phone: '+91 98480 67890', role: 'farmer', pass: 'farmer123' },
    { id: 'usr_f7', name: 'Krishna Murthy', email: 'krishna.organic@agrilink.in', phone: '+91 98480 78901', role: 'farmer', pass: 'farmer123' },

    // Buyers
    { id: 'usr_b1', name: 'Vikram Mehta (ABC Foods)', email: 'procurement@abcfoods.com', phone: '+91 94401 11222', role: 'buyer', pass: 'buyer123' },
    { id: 'usr_b2', name: 'Ananya Roy (Coastal Agro)', email: 'sourcing@coastalagro.in', phone: '+91 94401 22333', role: 'buyer', pass: 'buyer123' },
    { id: 'usr_b3', name: 'Gopal Reddy (Godavari Wholesalers)', email: 'gopal@godavarifresh.com', phone: '+91 94401 33444', role: 'buyer', pass: 'buyer123' },
    { id: 'usr_b4', name: 'Priya Sharma (Delta Foods)', email: 'priya@deltafoods.co.in', phone: '+91 94401 44555', role: 'buyer', pass: 'buyer123' },
    { id: 'usr_b5', name: 'Kalyan Chakravarthy (Andhra Spices)', email: 'kalyan@andhraspices.com', phone: '+91 94401 55666', role: 'buyer', pass: 'buyer123' },

    // Admin
    { id: 'usr_a1', name: 'AgriLink System Administrator', email: 'admin@agrilink.in', phone: '+91 90000 00001', role: 'admin', pass: 'admin123' }
  ];

  for (const u of users) {
    // Never store plaintext: hash with bcrypt (same cost as registration).
    // Plain passwords and hashes are never logged.
    const passwordHash = await bcrypt.hash(u.pass, 10);
    await run(
      `INSERT INTO users (id, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, u.phone, u.role, passwordHash]
    );
  }

  // 2. Organizations
  console.log('Inserting buyer organizations...');
  const orgs = [
    {
      id: 'org_1', user_id: 'usr_b1', company_name: 'ABC Food Processing Pvt Ltd', business_type: 'Food Processor',
      reg_number: 'CIN-U15400AP2016PTC098231', address: 'Plot 42, Industrial Development Area, Eluru, Andhra Pradesh',
      contact_person: 'Vikram Mehta', procurement_team_size: 8, trust_score: 95, verified_status: 'VERIFIED'
    },
    {
      id: 'org_2', user_id: 'usr_b2', company_name: 'Coastal Agro Exports Ltd', business_type: 'Exporter',
      reg_number: 'CIN-U01111AP2012PLC076543', address: 'Harbor Gate 3, Port Area, Kakinada, Andhra Pradesh',
      contact_person: 'Ananya Roy', procurement_team_size: 12, trust_score: 98, verified_status: 'VERIFIED'
    },
    {
      id: 'org_3', user_id: 'usr_b3', company_name: 'Godavari Fresh Wholesalers', business_type: 'Wholesaler',
      reg_number: 'GST-37AABCG1234F1Z8', address: 'Gollapudi Wholesale Market Yard, Vijayawada, Andhra Pradesh',
      contact_person: 'Gopal Reddy', procurement_team_size: 6, trust_score: 91, verified_status: 'VERIFIED'
    },
    {
      id: 'org_4', user_id: 'usr_b4', company_name: 'Delta Agro Foods Ltd', business_type: 'Food Processor',
      reg_number: 'CIN-U15122AP2018PTC109876', address: 'Morampudi Industrial Zone, Rajahmundry, Andhra Pradesh',
      contact_person: 'Priya Sharma', procurement_team_size: 10, trust_score: 94, verified_status: 'VERIFIED'
    },
    {
      id: 'org_5', user_id: 'usr_b5', company_name: 'Andhra Spice & Condiments Pvt Ltd', business_type: 'Processor & Exporter',
      reg_number: 'CIN-U15495AP2015PTC095432', address: 'Guntur Spice Park, Edlapadu, Guntur, Andhra Pradesh',
      contact_person: 'Kalyan Chakravarthy', procurement_team_size: 15, trust_score: 96, verified_status: 'VERIFIED'
    }
  ];

  for (const o of orgs) {
    await run(
      `INSERT INTO organizations (id, user_id, company_name, business_type, reg_number, address, contact_person, procurement_team_size, trust_score, verified_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [o.id, o.user_id, o.company_name, o.business_type, o.reg_number, o.address, o.contact_person, o.procurement_team_size, o.trust_score, o.verified_status]
    );
  }

  // 3. Farmers
  console.log('Inserting farmers...');
  const farmers = [
    {
      id: 'frm_1', user_id: 'usr_f1', name: 'Ramesh Kumar', phone: '+91 98480 12345', email: 'ramesh.farmer@agrilink.in',
      village: 'Sanivarapupeta', district: 'Eluru', state: 'Andhra Pradesh', farm_size_acres: 12.5,
      experience_years: 18, fpo_name: 'Godavari Delta Vegetable FPO', bank_account_placeholder: 'SBI-XXXX-4921',
      reliability_score: 92, rating: 4.8, total_orders: 14, verified_status: 'VERIFIED'
    },
    {
      id: 'frm_2', user_id: 'usr_f2', name: 'Suresh Varma', phone: '+91 98480 23456', email: 'suresh.varma@agrilink.in',
      village: 'Kadiyam', district: 'East Godavari (Rajahmundry)', state: 'Andhra Pradesh', farm_size_acres: 24.0,
      experience_years: 22, fpo_name: 'Akhanda Godavari Farmers Federation', bank_account_placeholder: 'Andhra Bank-XXXX-8812',
      reliability_score: 89, rating: 4.7, total_orders: 19, verified_status: 'VERIFIED'
    },
    {
      id: 'frm_3', user_id: 'usr_f3', name: 'Venkat Rao', phone: '+91 98480 34567', email: 'venkat.rao@agrilink.in',
      village: 'Nuzvid', district: 'Eluru', state: 'Andhra Pradesh', farm_size_acres: 16.0,
      experience_years: 14, fpo_name: 'Krishna River Valley Producers Co.', bank_account_placeholder: 'HDFC-XXXX-1104',
      reliability_score: 83, rating: 4.6, total_orders: 9, verified_status: 'VERIFIED'
    },
    {
      id: 'frm_4', user_id: 'usr_f4', name: 'Lakshmi Devi', phone: '+91 98480 45678', email: 'lakshmi.fpo@agrilink.in',
      village: 'Mangalagiri', district: 'Guntur', state: 'Andhra Pradesh', farm_size_acres: 45.0,
      experience_years: 15, fpo_name: 'Amaravati Women Agro Producers FPO', bank_account_placeholder: 'Canara-XXXX-3349',
      reliability_score: 95, rating: 4.9, total_orders: 28, verified_status: 'VERIFIED'
    },
    {
      id: 'frm_5', user_id: 'usr_f5', name: 'Appa Rao', phone: '+91 98480 56789', email: 'apparao.horti@agrilink.in',
      village: 'Ravulapalem', district: 'Konaseema', state: 'Andhra Pradesh', farm_size_acres: 18.0,
      experience_years: 25, fpo_name: 'Konaseema Horticulture Society', bank_account_placeholder: 'Union-XXXX-7721',
      reliability_score: 91, rating: 4.75, total_orders: 16, verified_status: 'VERIFIED'
    },
    {
      id: 'frm_6', user_id: 'usr_f6', name: 'Satyanarayana Raju', phone: '+91 98480 67890', email: 'satya.raju@agrilink.in',
      village: 'Attili', district: 'West Godavari', state: 'Andhra Pradesh', farm_size_acres: 30.0,
      experience_years: 20, fpo_name: 'West Godavari Paddy Growers FPO', bank_account_placeholder: 'SBI-XXXX-9932',
      reliability_score: 94, rating: 4.85, total_orders: 22, verified_status: 'VERIFIED'
    },
    {
      id: 'frm_7', user_id: 'usr_f7', name: 'Krishna Murthy', phone: '+91 98480 78901', email: 'krishna.organic@agrilink.in',
      village: 'Gannavaram', district: 'Krishna', state: 'Andhra Pradesh', farm_size_acres: 10.0,
      experience_years: 11, fpo_name: 'NTR Natural Farming Collective', bank_account_placeholder: 'Axis-XXXX-6601',
      reliability_score: 88, rating: 4.65, total_orders: 8, verified_status: 'VERIFIED'
    }
  ];

  for (const f of farmers) {
    await run(
      `INSERT INTO farmers (id, user_id, name, phone, email, village, district, state, farm_size_acres, experience_years, fpo_name, bank_account_placeholder, reliability_score, rating, total_orders, verified_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [f.id, f.user_id, f.name, f.phone, f.email, f.village, f.district, f.state, f.farm_size_acres, f.experience_years, f.fpo_name, f.bank_account_placeholder, f.reliability_score, f.rating, f.total_orders, f.verified_status]
    );
  }

  // 4. Farms
  console.log('Inserting farms...');
  const farms = [
    { id: 'farm_1', farmer_id: 'frm_1', location_name: 'Ramesh Agro Farm - Plot 1 & 2', village: 'Sanivarapupeta', district: 'Eluru', state: 'Andhra Pradesh', lat: 16.7107, lng: 81.0952, area: 12.5, soil: 'Alluvial Red Loam', irrigation: 'Drip Irrigation & Borewell', ownership: 'Owner-Cultivator' },
    { id: 'farm_2', farmer_id: 'frm_2', location_name: 'Varma Godavari Fields', village: 'Kadiyam', district: 'East Godavari', state: 'Andhra Pradesh', lat: 16.9167, lng: 81.8333, area: 24.0, soil: 'Clay Loam (Delta)', irrigation: 'Canal & Lift Irrigation', ownership: 'Owner-Cultivator' },
    { id: 'farm_3', farmer_id: 'frm_3', location_name: 'Nuzvid Agro Orchards', village: 'Nuzvid', district: 'Eluru', state: 'Andhra Pradesh', lat: 16.7850, lng: 80.8461, area: 16.0, soil: 'Red Sandy Loam', irrigation: 'Drip & Tank', ownership: 'Owner-Cultivator' },
    { id: 'farm_4', farmer_id: 'frm_4', location_name: 'Amaravati FPO Cluster Farm', village: 'Mangalagiri', district: 'Guntur', state: 'Andhra Pradesh', lat: 16.4310, lng: 80.5630, area: 45.0, soil: 'Black Cotton Soil', irrigation: 'Drip & Borewell', ownership: 'FPO Collective' },
    { id: 'farm_5', farmer_id: 'frm_5', location_name: 'Konaseema Delta Plantation', village: 'Ravulapalem', district: 'Konaseema', state: 'Andhra Pradesh', lat: 16.7500, lng: 81.8500, area: 18.0, soil: 'Delta Alluvial', irrigation: 'Godavari Canal Network', ownership: 'Owner-Cultivator' },
    { id: 'farm_6', farmer_id: 'frm_6', location_name: 'Attili Paddy & Maize Fields', village: 'Attili', district: 'West Godavari', state: 'Andhra Pradesh', lat: 16.6800, lng: 81.6000, area: 30.0, soil: 'Fertile Clay Loam', irrigation: 'Canal Network', ownership: 'Owner-Cultivator' },
    { id: 'farm_7', farmer_id: 'frm_7', location_name: 'NTR Natural Farms', village: 'Gannavaram', district: 'Krishna', state: 'Andhra Pradesh', lat: 16.5400, lng: 80.8000, area: 10.0, soil: 'Red Loamy Soil', irrigation: 'Borewell & Rainwater Harvesting', ownership: 'Owner-Cultivator' }
  ];

  for (const fm of farms) {
    await run(
      `INSERT INTO farms (id, farmer_id, location_name, village, district, state, latitude, longitude, area_acres, soil_type, irrigation_type, ownership_status, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [fm.id, fm.farmer_id, fm.location_name, fm.village, fm.district, fm.state, fm.lat, fm.lng, fm.area, fm.soil, fm.irrigation, fm.ownership]
    );
  }

  // 5. Farmer Verifications (4-step verification)
  console.log('Inserting farmer verifications...');
  const verifications = [
    { id: 'fv_1', farmer_id: 'frm_1', step: 1, name: 'Identity Verification', status: 'VERIFIED', doc: 'Aadhaar / Farmer ID Card', notes: 'UIDAI biometric verified via DigiLocker token. Ramesh Kumar confirmed.', date: '2026-08-01 10:30:00' },
    { id: 'fv_2', farmer_id: 'frm_1', step: 2, name: 'Farm Ownership Verification', status: 'VERIFIED', doc: 'Pattadar Passbook / Webland AP 1B', notes: 'Webland survey number 142/2A validated against Eluru Revenue Records.', date: '2026-08-01 14:15:00' },
    { id: 'fv_3', farmer_id: 'frm_1', step: 3, name: 'Farm Location Verification', status: 'VERIFIED', doc: 'GPS Geotagged Field Coordinates', notes: 'Geofenced polygon matches cadastral map within 1.2m tolerance (16.7107, 81.0952).', date: '2026-08-02 09:00:00' },
    { id: 'fv_4', farmer_id: 'frm_1', step: 4, name: 'Crop / Produce Verification', status: 'VERIFIED', doc: 'Field Harvest & Drone Assessment', notes: 'Crop stage: Fruit maturity 85%. Variety: Vaishnavi Tomato. Estimated yield: 10.5 tonnes.', date: '2026-08-28 11:20:00' },

    { id: 'fv_5', farmer_id: 'frm_2', step: 1, name: 'Identity Verification', status: 'VERIFIED', doc: 'Aadhaar Card', notes: 'Identity verified successfully.', date: '2026-07-15 10:00:00' },
    { id: 'fv_6', farmer_id: 'frm_2', step: 2, name: 'Farm Ownership Verification', status: 'VERIFIED', doc: 'Pattadar Passbook', notes: 'Kadiyam land record verified.', date: '2026-07-15 11:30:00' },
    { id: 'fv_7', farmer_id: 'frm_2', step: 3, name: 'Farm Location Verification', status: 'VERIFIED', doc: 'GPS Survey', notes: 'Farm coordinates verified.', date: '2026-07-16 14:00:00' },
    { id: 'fv_8', farmer_id: 'frm_2', step: 4, name: 'Crop / Produce Verification', status: 'VERIFIED', doc: 'Produce inspection report', notes: 'BPT 5204 Paddy verified.', date: '2026-08-10 16:00:00' }
  ];

  for (const v of verifications) {
    await run(
      `INSERT INTO farmer_verifications (id, farmer_id, step_number, step_name, status, doc_type, doc_url, notes, verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.id, v.farmer_id, v.step, v.name, v.status, v.doc, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500&q=80', v.notes, v.date]
    );
  }

  // 6. Crops
  console.log('Inserting crops & market baseline...');
  const crops = [
    {
      id: 'crop_tomato', name: 'Tomato', category: 'Vegetables', variety: 'Vaishnavi / Hybrid S-4', season: 'Kharif / Rabi',
      yield: 12000, price: 28.0, min_p: 24.0, max_p: 34.0, trend: 'increasing', f_min: 27.0, f_max: 32.0,
      img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'crop_rice', name: 'Paddy Rice', category: 'Cereals & Grains', variety: 'BPT 5204 (Samba Masuri)', season: 'Kharif',
      yield: 2500, price: 26.5, min_p: 23.0, max_p: 29.0, trend: 'stable', f_min: 25.5, f_max: 28.0,
      img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'crop_chilli', name: 'Red Chilli', category: 'Spices', variety: 'Guntur Sannam (S4)', season: 'Rabi',
      yield: 1800, price: 215.0, min_p: 190.0, max_p: 240.0, trend: 'increasing', f_min: 210.0, f_max: 235.0,
      img: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'crop_banana', name: 'Banana', category: 'Fruits', variety: 'Grand Naine (G9)', season: 'Perennial',
      yield: 35000, price: 18.0, min_p: 14.0, max_p: 22.0, trend: 'increasing', f_min: 17.0, f_max: 21.0,
      img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'crop_mango', name: 'Mango', category: 'Fruits', variety: 'Banganapalli', season: 'Summer',
      yield: 8000, price: 55.0, min_p: 45.0, max_p: 70.0, trend: 'decreasing', f_min: 48.0, f_max: 60.0,
      img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'crop_turmeric', name: 'Turmeric', category: 'Spices', variety: 'Duggirala Selam', season: 'Rabi',
      yield: 6000, price: 135.0, min_p: 120.0, max_p: 155.0, trend: 'stable', f_min: 130.0, f_max: 145.0,
      img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'crop_cotton', name: 'Cotton', category: 'Commercial Crops', variety: 'Bt-Cotton Long Staple', season: 'Kharif',
      yield: 1200, price: 74.0, min_p: 68.0, max_p: 82.0, trend: 'increasing', f_min: 72.0, f_max: 78.0,
      img: 'https://images.unsplash.com/photo-1594897030560-692723cf23b2?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'crop_maize', name: 'Maize (Corn)', category: 'Cereals & Grains', variety: 'Yellow Dent Hybrid', season: 'Rabi',
      yield: 3200, price: 22.0, min_p: 19.5, max_p: 25.0, trend: 'increasing', f_min: 21.0, f_max: 24.5,
      img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80'
    }
  ];

  for (const c of crops) {
    await run(
      `INSERT INTO crops (id, name, category, variety, season, expected_yield_kg_per_acre, current_market_price, min_price, max_price, price_trend, indicative_forecast_min, indicative_forecast_max, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.category, c.variety, c.season, c.yield, c.price, c.min_p, c.max_p, c.trend, c.f_min, c.f_max, c.img]
    );
  }

  // 7. Market Prices (Historical 30-day/90-day points for Tomato & other crops)
  console.log('Inserting market price intelligence history...');
  const priceHistory = [
    { crop: 'crop_tomato', district: 'Eluru', market: 'Eluru Rythu Bazar & APMC', date: '2026-09-09', modal: 28.0, min: 25.0, max: 31.0, tonnes: 145 },
    { crop: 'crop_tomato', district: 'Eluru', market: 'Eluru Rythu Bazar & APMC', date: '2026-09-08', modal: 27.5, min: 24.0, max: 30.0, tonnes: 152 },
    { crop: 'crop_tomato', district: 'Eluru', market: 'Eluru Rythu Bazar & APMC', date: '2026-09-05', modal: 26.8, min: 23.5, max: 29.0, tonnes: 160 },
    { crop: 'crop_tomato', district: 'Eluru', market: 'Eluru Rythu Bazar & APMC', date: '2026-09-01', modal: 25.0, min: 22.0, max: 28.0, tonnes: 175 },
    { crop: 'crop_tomato', district: 'Eluru', market: 'Eluru Rythu Bazar & APMC', date: '2026-08-25', modal: 24.2, min: 21.0, max: 27.0, tonnes: 180 },
    { crop: 'crop_tomato', district: 'Eluru', market: 'Eluru Rythu Bazar & APMC', date: '2026-08-15', modal: 23.5, min: 20.0, max: 26.0, tonnes: 190 },
    { crop: 'crop_tomato', district: 'Eluru', market: 'Eluru Rythu Bazar & APMC', date: '2026-08-01', modal: 22.0, min: 19.0, max: 25.0, tonnes: 210 },
    { crop: 'crop_tomato', district: 'Eluru', market: 'Eluru Rythu Bazar & APMC', date: '2026-07-15', modal: 21.0, min: 18.0, max: 24.0, tonnes: 230 },
    { crop: 'crop_tomato', district: 'Eluru', market: 'Eluru Rythu Bazar & APMC', date: '2026-06-15', modal: 32.0, min: 28.0, max: 38.0, tonnes: 110 },

    { crop: 'crop_rice', district: 'East Godavari', market: 'Rajahmundry APMC Yard', date: '2026-09-09', modal: 26.5, min: 24.0, max: 28.5, tonnes: 420 },
    { crop: 'crop_rice', district: 'East Godavari', market: 'Rajahmundry APMC Yard', date: '2026-08-15', modal: 26.0, min: 23.5, max: 28.0, tonnes: 390 },
    { crop: 'crop_chilli', district: 'Guntur', market: 'Guntur Asia Mirchi Yard', date: '2026-09-09', modal: 215.0, min: 195.0, max: 235.0, tonnes: 850 },
    { crop: 'crop_banana', district: 'Konaseema', market: 'Ravulapalem Fruit Mandi', date: '2026-09-09', modal: 18.0, min: 15.0, max: 21.0, tonnes: 280 }
  ];

  for (let i = 0; i < priceHistory.length; i++) {
    const ph = priceHistory[i];
    await run(
      `INSERT INTO market_prices (id, crop_id, district, state, market_name, price_date, modal_price, min_price, max_price, arrival_tonnes)
       VALUES (?, ?, ?, 'Andhra Pradesh', ?, ?, ?, ?, ?, ?)`,
      [`mp_${i + 1}`, ph.crop, ph.district, ph.market, ph.date, ph.modal, ph.min, ph.max, ph.tonnes]
    );
  }

  // 8. Produce Listings (20+ realistic listings, Ramesh's listing is prod_1)
  console.log('Inserting produce listings...');
  const listings = [
    // Ramesh's premier Tomato listing (Master Demo scenario)
    {
      id: 'prod_1', farmer_id: 'frm_1', crop_id: 'crop_tomato', title: 'Fresh Grade-A Vaishnavi Hybrid Tomatoes',
      img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
      total_qty: 10000, avail_qty: 10000, grade: 'Grade A', moisture: 82.5, size: 65.0, color: 'Deep Bright Red', defect: 1.2,
      organic: 0, cert: 'GAP Certified (Good Agricultural Practices)', price: 29.0, harvest: '2026-09-08',
      from: '2026-09-09', until: '2026-09-22', location: 'Sanivarapupeta, Eluru', district: 'Eluru',
      lat: 16.7107, lng: 81.0952, v_status: 'VERIFIED',
      v_notes: '4-Step verification completed. Identity, Land Deed, GPS geofence, and Image AI consistency verified.',
      status: 'Available'
    },
    // Other competitive tomato listings for realistic matching engine comparison
    {
      id: 'prod_2', farmer_id: 'frm_2', crop_id: 'crop_tomato', title: 'Grade-A Field Grown Roma Tomatoes',
      img: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&auto=format&fit=crop&q=80',
      total_qty: 12000, avail_qty: 12000, grade: 'Grade A', moisture: 84.0, size: 60.0, color: 'Red with slight pink hue', defect: 2.8,
      organic: 0, cert: 'FPO Quality Tagged', price: 30.5, harvest: '2026-09-07',
      from: '2026-09-08', until: '2026-09-20', location: 'Kadiyam, Rajahmundry', district: 'East Godavari',
      lat: 16.9167, lng: 81.8333, v_status: 'VERIFIED',
      v_notes: 'Verified farm cultivation records.',
      status: 'Available'
    },
    {
      id: 'prod_3', farmer_id: 'frm_3', crop_id: 'crop_tomato', title: 'Nuzvid Valley Hybrid Table Tomatoes',
      img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=80',
      total_qty: 8500, avail_qty: 8500, grade: 'Grade B', moisture: 85.0, size: 55.0, color: 'Medium Red', defect: 4.5,
      organic: 0, cert: 'Standard Produce', price: 27.0, harvest: '2026-09-06',
      from: '2026-09-07', until: '2026-09-18', location: 'Nuzvid, Eluru District', district: 'Eluru',
      lat: 16.7850, lng: 80.8461, v_status: 'VERIFIED',
      v_notes: 'Verified producer.',
      status: 'Available'
    },
    {
      id: 'prod_4', farmer_id: 'frm_7', crop_id: 'crop_tomato', title: '100% Certified Organic Heirloom Tomatoes',
      img: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?w=800&auto=format&fit=crop&q=80',
      total_qty: 4000, avail_qty: 4000, grade: 'Grade A', moisture: 81.0, size: 68.0, color: 'Ruby Red', defect: 1.0,
      organic: 1, cert: 'NPOP Organic Certificate #AP-ORG-8821', price: 38.0, harvest: '2026-09-09',
      from: '2026-09-10', until: '2026-09-24', location: 'Gannavaram, Krishna', district: 'Krishna',
      lat: 16.5400, lng: 80.8000, v_status: 'VERIFIED',
      v_notes: 'NPOP certified organic farm inspection passed.',
      status: 'Available'
    },

    // Paddy Rice listings
    {
      id: 'prod_5', farmer_id: 'frm_6', crop_id: 'crop_rice', title: 'Premium Aged BPT 5204 Samba Masuri Paddy',
      img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
      total_qty: 40000, avail_qty: 35000, grade: 'Grade A', moisture: 13.2, size: 8.5, color: 'Golden Amber', defect: 0.8,
      organic: 0, cert: 'State Grain Board Certified', price: 27.5, harvest: '2026-08-20',
      from: '2026-08-25', until: '2026-12-31', location: 'Attili, West Godavari', district: 'West Godavari',
      lat: 16.6800, lng: 81.6000, v_status: 'VERIFIED',
      v_notes: 'Grain moisture meter and milling test passed.',
      status: 'Available'
    },
    {
      id: 'prod_6', farmer_id: 'frm_2', crop_id: 'crop_rice', title: 'Kadiyam Godavari Riverbed Paddy (Fine Grain)',
      img: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800&auto=format&fit=crop&q=80',
      total_qty: 25000, avail_qty: 25000, grade: 'Grade A', moisture: 13.8, size: 8.2, color: 'Pale Gold', defect: 1.1,
      organic: 0, cert: 'AP Food Grain Verification', price: 26.5, harvest: '2026-08-22',
      from: '2026-08-26', until: '2026-11-30', location: 'Kadiyam, East Godavari', district: 'East Godavari',
      lat: 16.9167, lng: 81.8333, v_status: 'VERIFIED',
      v_notes: 'Verified grain lot.',
      status: 'Available'
    },

    // Guntur Chilli listings
    {
      id: 'prod_7', farmer_id: 'frm_4', crop_id: 'crop_chilli', title: 'Export Quality Guntur Sannam S4 Dry Red Chilli',
      img: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80',
      total_qty: 15000, avail_qty: 15000, grade: 'Grade A', moisture: 10.5, size: 90.0, color: 'Deep Scarlet Red', defect: 0.5,
      organic: 0, cert: 'Spices Board Certificate #AP-SB-391', price: 220.0, harvest: '2026-07-28',
      from: '2026-08-01', until: '2027-01-31', location: 'Mangalagiri, Guntur', district: 'Guntur',
      lat: 16.4310, lng: 80.5630, v_status: 'VERIFIED',
      v_notes: 'Pungency (SHU 35,000) and ASTA color 95 verified by Spices Board.',
      status: 'Available'
    },
    {
      id: 'prod_8', farmer_id: 'frm_4', crop_id: 'crop_chilli', title: 'Guntur Teja Hot Red Chilli (Cold Storage Batched)',
      img: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80',
      total_qty: 20000, avail_qty: 18000, grade: 'Grade A', moisture: 9.8, size: 75.0, color: 'Fiery Red', defect: 0.9,
      organic: 0, cert: 'AP Cold Chain Verified', price: 235.0, harvest: '2026-07-15',
      from: '2026-07-25', until: '2026-12-31', location: 'Mangalagiri, Guntur', district: 'Guntur',
      lat: 16.4310, lng: 80.5630, v_status: 'VERIFIED',
      v_notes: 'Cold storage humidity log verified.',
      status: 'Available'
    },

    // Banana listings
    {
      id: 'prod_9', farmer_id: 'frm_5', crop_id: 'crop_banana', title: 'Fresh Konaseema Grand Naine G9 Cavendish Banana',
      img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80',
      total_qty: 28000, avail_qty: 28000, grade: 'Grade A', moisture: 75.0, size: 210.0, color: 'Lush Green (Pre-ripe)', defect: 1.5,
      organic: 0, cert: 'APEDA Export Standard', price: 18.5, harvest: '2026-09-08',
      from: '2026-09-09', until: '2026-09-23', location: 'Ravulapalem, Konaseema', district: 'Konaseema',
      lat: 16.7500, lng: 81.8500, v_status: 'VERIFIED',
      v_notes: 'Bunch calibration and skin blemish test passed.',
      status: 'Available'
    },
    {
      id: 'prod_10', farmer_id: 'frm_5', crop_id: 'crop_banana', title: 'Commercial Grade Robusta Cooking Bananas',
      img: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800&auto=format&fit=crop&q=80',
      total_qty: 18000, avail_qty: 18000, grade: 'Grade B', moisture: 78.0, size: 185.0, color: 'Solid Green', defect: 3.2,
      organic: 0, cert: 'Wholesale Standard', price: 15.0, harvest: '2026-09-06',
      from: '2026-09-07', until: '2026-09-20', location: 'Ravulapalem, Konaseema', district: 'Konaseema',
      lat: 16.7500, lng: 81.8500, v_status: 'VERIFIED',
      v_notes: 'Verified harvest batch.',
      status: 'Available'
    },

    // Mango listings
    {
      id: 'prod_11', farmer_id: 'frm_3', crop_id: 'crop_mango', title: 'GI Tagged Nuzvid Banganapalli Sweet Mangoes',
      img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80',
      total_qty: 14000, avail_qty: 14000, grade: 'Grade A', moisture: 80.0, size: 110.0, color: 'Golden Yellow Blush', defect: 2.0,
      organic: 0, cert: 'GI Tag AP-MANGO-004', price: 58.0, harvest: '2026-06-10',
      from: '2026-06-12', until: '2026-07-15', location: 'Nuzvid, Eluru District', district: 'Eluru',
      lat: 16.7850, lng: 80.8461, v_status: 'VERIFIED',
      v_notes: 'Brix sweetness index 19.5 recorded.',
      status: 'Available'
    },

    // Turmeric listings
    {
      id: 'prod_12', farmer_id: 'frm_4', crop_id: 'crop_turmeric', title: 'High Curcumin Duggirala Polished Turmeric Fingers',
      img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80',
      total_qty: 9000, avail_qty: 9000, grade: 'Grade A', moisture: 9.2, size: 70.0, color: 'Deep Saffron Orange', defect: 0.8,
      organic: 1, cert: 'Spices Board + India Organic', price: 142.0, harvest: '2026-04-10',
      from: '2026-04-20', until: '2027-02-28', location: 'Mangalagiri, Guntur', district: 'Guntur',
      lat: 16.4310, lng: 80.5630, v_status: 'VERIFIED',
      v_notes: 'Curcumin content lab tested at 5.2%. Passed export grade.',
      status: 'Available'
    },

    // Cotton listings
    {
      id: 'prod_13', farmer_id: 'frm_4', crop_id: 'crop_cotton', title: 'Long Staple Raw Seed Cotton (Kapas)',
      img: 'https://images.unsplash.com/photo-1594897030560-692723cf23b2?w=800&auto=format&fit=crop&q=80',
      total_qty: 22000, avail_qty: 22000, grade: 'Grade A', moisture: 7.5, size: 31.0, color: 'Crisp White', defect: 1.0,
      organic: 0, cert: 'Cotton Corporation of India Tag', price: 76.0, harvest: '2026-08-30',
      from: '2026-09-02', until: '2026-11-15', location: 'Mangalagiri, Guntur', district: 'Guntur',
      lat: 16.4310, lng: 80.5630, v_status: 'VERIFIED',
      v_notes: 'Micronaire 4.1, Staple length 31.5mm verified.',
      status: 'Available'
    },

    // Maize listings
    {
      id: 'prod_14', farmer_id: 'frm_6', crop_id: 'crop_maize', title: 'Feed & Industrial Grade Yellow Maize Grains',
      img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80',
      total_qty: 35000, avail_qty: 35000, grade: 'Grade A', moisture: 12.0, size: 9.0, color: 'Bright Golden Yellow', defect: 1.4,
      organic: 0, cert: 'Agmark Grade I', price: 22.8, harvest: '2026-08-15',
      from: '2026-08-20', until: '2026-12-15', location: 'Attili, West Godavari', district: 'West Godavari',
      lat: 16.6800, lng: 81.6000, v_status: 'VERIFIED',
      v_notes: 'Aflatoxin test below 10 ppb. Moisture tested at 12%.',
      status: 'Available'
    },

    // Additional listings across farmers
    {
      id: 'prod_15', farmer_id: 'frm_1', crop_id: 'crop_maize', title: 'Sweet Corn Fresh Cobs for Food Processing',
      img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80',
      total_qty: 6000, avail_qty: 6000, grade: 'Grade A', moisture: 72.0, size: 190.0, color: 'Milky Yellow', defect: 1.0,
      organic: 0, cert: 'Processor Standard', price: 26.0, harvest: '2026-09-07',
      from: '2026-09-08', until: '2026-09-18', location: 'Sanivarapupeta, Eluru', district: 'Eluru',
      lat: 16.7107, lng: 81.0952, v_status: 'VERIFIED',
      v_notes: 'Harvest consistency verified.',
      status: 'Available'
    },
    {
      id: 'prod_16', farmer_id: 'frm_7', crop_id: 'crop_rice', title: 'Natural Farming Organic Brown Rice Paddy',
      img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
      total_qty: 8000, avail_qty: 8000, grade: 'Grade A', moisture: 12.8, size: 8.0, color: 'Rustic Bronze Brown', defect: 0.6,
      organic: 1, cert: 'PGS-India Green Certified', price: 34.0, harvest: '2026-08-25',
      from: '2026-09-01', until: '2026-12-31', location: 'Gannavaram, Krishna', district: 'Krishna',
      lat: 16.5400, lng: 80.8000, v_status: 'VERIFIED',
      v_notes: 'Chemical residue 0.00 ppm verified.',
      status: 'Available'
    },
    {
      id: 'prod_17', farmer_id: 'frm_3', crop_id: 'crop_banana', title: 'Chakkarakeli Dessert Banana Bunches',
      img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80',
      total_qty: 9000, avail_qty: 9000, grade: 'Grade A', moisture: 76.0, size: 160.0, color: 'Golden Yellow Spotless', defect: 1.2,
      organic: 0, cert: 'Local GI Traditional', price: 24.0, harvest: '2026-09-08',
      from: '2026-09-09', until: '2026-09-20', location: 'Nuzvid, Eluru District', district: 'Eluru',
      lat: 16.7850, lng: 80.8461, v_status: 'VERIFIED',
      v_notes: 'Taste and skin grade verified.',
      status: 'Available'
    },
    {
      id: 'prod_18', farmer_id: 'frm_1', crop_id: 'crop_chilli', title: 'Fresh Green Chillies for Pickling & Sauces',
      img: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80',
      total_qty: 5000, avail_qty: 5000, grade: 'Grade A', moisture: 82.0, size: 85.0, color: 'Glossy Emerald Green', defect: 1.8,
      organic: 0, cert: 'Farm Fresh Quality', price: 42.0, harvest: '2026-09-06',
      from: '2026-09-07', until: '2026-09-17', location: 'Sanivarapupeta, Eluru', district: 'Eluru',
      lat: 16.7107, lng: 81.0952, v_status: 'VERIFIED',
      v_notes: 'Pesticide MRL compliance verified.',
      status: 'Available'
    },
    {
      id: 'prod_19', farmer_id: 'frm_2', crop_id: 'crop_maize', title: 'Silage & High Energy Maize Grain Lot',
      img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80',
      total_qty: 16000, avail_qty: 16000, grade: 'Grade B', moisture: 13.5, size: 8.8, color: 'Amber Yellow', defect: 3.0,
      organic: 0, cert: 'Commercial Grade', price: 21.0, harvest: '2026-08-28',
      from: '2026-09-02', until: '2026-11-20', location: 'Kadiyam, East Godavari', district: 'East Godavari',
      lat: 16.9167, lng: 81.8333, v_status: 'VERIFIED',
      v_notes: 'Verified lot.',
      status: 'Available'
    },
    {
      id: 'prod_20', farmer_id: 'frm_5', crop_id: 'crop_turmeric', title: 'Farm Fresh Unpolished Raw Turmeric Rhizomes',
      img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80',
      total_qty: 12000, avail_qty: 12000, grade: 'Grade A', moisture: 14.0, size: 80.0, color: 'Earthy Golden Brown', defect: 1.5,
      organic: 0, cert: 'Ayush Grade', price: 115.0, harvest: '2026-08-10',
      from: '2026-08-15', until: '2026-12-31', location: 'Ravulapalem, Konaseema', district: 'Konaseema',
      lat: 16.7500, lng: 81.8500, v_status: 'VERIFIED',
      v_notes: 'Ayush herbal extract grade verified.',
      status: 'Available'
    }
  ];

  for (const l of listings) {
    await run(
      `INSERT INTO produce_listings (id, farmer_id, crop_id, title, image_url, total_qty_kg, available_qty_kg, quality_grade, moisture_pct, size_mm, color, defect_pct, is_organic, certification, expected_price_per_kg, harvest_date, available_from, available_until, farm_location, district, state, latitude, longitude, verification_status, verification_notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, l.farmer_id, l.crop_id, l.title, l.img, l.total_qty, l.avail_qty, l.grade, l.moisture, l.size, l.color, l.defect, l.organic, l.cert, l.price, l.harvest, l.from, l.until, l.location, l.district, 'Andhra Pradesh', l.lat, l.lng, l.v_status, l.v_notes, l.status]
    );

    // Insert quality record
    await run(
      `INSERT INTO crop_quality_records (id, produce_id, grade, moisture_pct, size_mm, color, defect_pct, organic_cert, inspection_date, inspector_name, ai_confidence, verification_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`qr_${l.id}`, l.id, l.grade, l.moisture, l.size, l.color, l.defect, l.organic ? l.cert : 'None', l.harvest, 'AgriLink Verified Inspector', 0.94, 'Passed']
    );
  }

  // 9. Procurement Requirements (ABC Foods Tomato requirement is req_1)
  console.log('Inserting buyer procurement requirements...');
  const requirements = [
    // ABC Food Processing flagship requirement (Master Demo)
    {
      id: 'req_1', buyer_id: 'org_1', crop_id: 'crop_tomato', title: 'Procurement: 8,000 kg Grade-A Ripe Tomatoes for Puree Processing',
      qty: 8000, grade: 'Grade A', max_price: 30.0, pref_loc: 'Eluru District (within 50 km)', max_dist: 50.0,
      delivery_date: '2026-09-15', delivery_loc: 'ABC Food Processing Unit, Industrial Area, Eluru',
      lat: 16.7190, lng: 81.1090, special: 'Brix sweetness minimum 4.5, defect < 2%, uniform firmness for automated washing & pulping.',
      status: 'Open'
    },
    {
      id: 'req_2', buyer_id: 'org_2', crop_id: 'crop_rice', title: 'Bulk Sourcing: 25,000 kg Premium BPT 5204 Paddy for Middle East Export',
      qty: 25000, grade: 'Grade A', max_price: 28.0, pref_loc: 'East or West Godavari Delta', max_dist: 100.0,
      delivery_date: '2026-09-25', delivery_loc: 'Coastal Agro Container Terminal, Kakinada Deepwater Port',
      lat: 16.9891, lng: 82.2475, special: 'Moisture must be strictly <= 13.5%. Phyto-sanitary inspection certificate required.',
      status: 'Open'
    },
    {
      id: 'req_3', buyer_id: 'org_5', crop_id: 'crop_chilli', title: 'Spice Processing: 10,000 kg High Color Guntur Sannam S4 Chillies',
      qty: 10000, grade: 'Grade A', max_price: 225.0, pref_loc: 'Guntur / Prakasam', max_dist: 60.0,
      delivery_date: '2026-09-20', delivery_loc: 'Andhra Spice Park Processing Complex, Guntur',
      lat: 16.3067, lng: 80.4365, special: 'ASTA color value > 90, moisture < 11%, zero mold or stalk contamination.',
      status: 'Open'
    },
    {
      id: 'req_4', buyer_id: 'org_4', crop_id: 'crop_banana', title: 'Pulp & Baby Food: 15,000 kg Uniform G9 Cavendish Bananas',
      qty: 15000, grade: 'Grade A', max_price: 19.5, pref_loc: 'Konaseema / East Godavari', max_dist: 70.0,
      delivery_date: '2026-09-18', delivery_loc: 'Delta Foods Processing Plant, Rajahmundry',
      lat: 17.0005, lng: 81.8040, special: 'Stage 2 light green color, pulp-to-peel ratio > 2.0, zero mechanical bruising.',
      status: 'Open'
    },
    {
      id: 'req_5', buyer_id: 'org_3', crop_id: 'crop_tomato', title: 'Wholesale Distribution: 5,000 kg Tomatoes for Vijayawada Retail Markets',
      qty: 5000, grade: 'Grade B', max_price: 28.0, pref_loc: 'Krishna / Eluru / Guntur', max_dist: 60.0,
      delivery_date: '2026-09-12', delivery_loc: 'Gollapudi Wholesale Yard, Vijayawada',
      lat: 16.5400, lng: 80.6000, special: 'Immediate dispatch required. Semi-ripe (firm pink/red).',
      status: 'Open'
    },
    {
      id: 'req_6', buyer_id: 'org_1', crop_id: 'crop_maize', title: 'Starch Milling: 20,000 kg Clean Yellow Corn Maize',
      qty: 20000, grade: 'Grade A', max_price: 23.5, pref_loc: 'West Godavari / Eluru', max_dist: 80.0,
      delivery_date: '2026-09-30', delivery_loc: 'ABC Agro Mill, Eluru Industrial Area',
      lat: 16.7190, lng: 81.1090, special: 'Moisture < 12.5%, broken grains < 3%.',
      status: 'Open'
    }
  ];

  for (const r of requirements) {
    await run(
      `INSERT INTO procurement_requirements (id, buyer_id, crop_id, title, quantity_kg, quality_grade, max_price_per_kg, preferred_location, max_distance_km, required_delivery_date, delivery_location, delivery_lat, delivery_lng, special_requirements, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.buyer_id, r.crop_id, r.title, r.qty, r.grade, r.max_price, r.pref_loc, r.max_dist, r.delivery_date, r.delivery_loc, r.lat, r.lng, r.special, r.status]
    );
  }

  // 10. Completed Historical Order + Active Live Order AGRI-2026-001024
  console.log('Inserting orders, verifications, and delivery records...');

  // Historical completed order between Ramesh and ABC Foods for Maize
  await run(
    `INSERT INTO orders (id, order_code, request_id, buyer_id, farmer_id, produce_id, crop_id, agreed_qty_kg, agreed_price_per_kg, total_value, quality_grade, pickup_location, delivery_location, pickup_lat, pickup_lng, delivery_lat, delivery_lng, expected_delivery, status, verification_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['ord_hist_1', 'AGRI-2026-000842', null, 'org_1', 'frm_1', 'prod_15', 'crop_maize', 5000, 25.0, 125000, 'Grade A', 'Sanivarapupeta, Eluru', 'ABC Food Processing Unit, Eluru', 16.7107, 81.0952, 16.7190, 81.1090, '2026-08-15', 'Completed', 'VER-AGRI-773104', '2026-08-12 09:30:00']
  );

  await run(
    `INSERT INTO order_verifications (id, order_id, verification_code, qty_confirmed, quality_confirmed, price_confirmed, digital_signature, verified_at)
     VALUES (?, ?, ?, 1, 1, 1, ?, ?)`,
    ['ov_hist_1', 'ord_hist_1', 'VER-AGRI-773104', 'SIG_SHA256_e49b819f2010ab', '2026-08-13 11:00:00']
  );

  await run(
    `INSERT INTO ratings (id, order_id, from_user_id, to_user_id, role, rating_overall, quality_rating, quantity_rating, delivery_rating, communication_rating, comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['rat_1', 'ord_hist_1', 'usr_b1', 'usr_f1', 'buyer_to_farmer', 4.9, 5.0, 5.0, 4.8, 5.0, 'Outstanding sweet corn quality. Ramesh delivered exactly on time with pristine packaging.', '2026-08-16 10:00:00']
  );

  await run(
    `INSERT INTO ratings (id, order_id, from_user_id, to_user_id, role, rating_overall, quality_rating, quantity_rating, delivery_rating, communication_rating, comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['rat_2', 'ord_hist_1', 'usr_f1', 'usr_b1', 'farmer_to_buyer', 5.0, 5.0, 5.0, 5.0, 5.0, 'Prompt inspection and payment cleared within 24 hours. Excellent buyer to work with.', '2026-08-16 14:30:00']
  );

  // Active Live Order for Demonstration: AGRI-2026-001024 (Delta Foods Tomato order, currently in transit from Eluru to Rajahmundry)
  await run(
    `INSERT INTO orders (id, order_code, request_id, buyer_id, farmer_id, produce_id, crop_id, agreed_qty_kg, agreed_price_per_kg, total_value, quality_grade, pickup_location, delivery_location, pickup_lat, pickup_lng, delivery_lat, delivery_lng, expected_delivery, status, verification_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['ord_active_1', 'AGRI-2026-001024', null, 'org_4', 'frm_1', 'prod_1', 'crop_tomato', 8000, 31.0, 248000, 'Grade A', 'Sanivarapupeta, Eluru', 'Delta Agro Foods Ltd, Morampudi, Rajahmundry', 16.7107, 81.0952, 17.0005, 81.8040, '2026-09-10', 'In Transit', 'VER-AGRI-928374', '2026-09-09 14:20:00']
  );

  await run(
    `INSERT INTO order_verifications (id, order_id, verification_code, qty_confirmed, quality_confirmed, price_confirmed, digital_signature, verified_at)
     VALUES (?, ?, ?, 1, 1, 1, ?, ?)`,
    ['ov_active_1', 'ord_active_1', 'VER-AGRI-928374', 'SIG_SHA256_928374f4b238a0', '2026-09-09 15:45:00']
  );

  // Delivery record for AGRI-2026-001024
  // Route from Eluru (16.7107, 81.0952) towards Rajahmundry (17.0005, 81.8040). Distance approx 65km.
  // Current position midway near Tanuku (16.8500, 81.4500)
  await run(
    `INSERT INTO deliveries (id, order_id, driver_name, driver_phone, vehicle_number, pickup_lat, pickup_lng, delivery_lat, delivery_lng, current_lat, current_lng, distance_km, distance_remaining_km, estimated_arrival, status, progress_pct, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['del_1', 'ord_active_1', 'Ravi Kumar', '+91 98492 88472', 'AP 37 TE 1234', 16.7107, 81.0952, 17.0005, 81.8040, 16.8550, 81.4520, 65.0, 24.5, 'Today, 5:30 PM', 'In Transit', 62, '2026-09-10 14:50:00']
  );

  // 11. Return Case (RET-AGRI-000123 for illustration of Section 29 & 30)
  console.log('Inserting sample return & replacement case...');
  await run(
    `INSERT INTO returns (id, return_code, order_id, buyer_id, farmer_id, reason, description, evidence_images, requested_qty_kg, farmer_response, admin_decision, resolution_status, created_at, closed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'ret_1', 'RET-AGRI-000123', 'ord_hist_1', 'org_1', 'frm_1', 'Damaged Produce',
      'During unloading of crate batch 4, 300 kg showed crate transit compression. Rest of lot is good.',
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      300, 'Farmer Ramesh agreed to credit the 300 kg transit damage to the subsequent invoice.',
      'PARTIAL REFUND', 'Resolved', '2026-08-16 11:30:00', '2026-08-17 15:00:00'
    ]
  );

  // 12. Notifications
  console.log('Inserting in-app notifications...');
  const notifications = [
    { id: 'notif_1', user_id: 'usr_f1', title: 'New Buyer Inquiry', msg: 'ABC Food Processing viewed your 10,000 kg Tomato listing in Eluru.', type: 'request', link: '/farmer/requests' },
    { id: 'notif_2', user_id: 'usr_f1', title: 'GPS Delivery Update', msg: 'Driver Ravi Kumar (AP 37 TE 1234) is 24 km from destination in Rajahmundry.', type: 'delivery', link: '/farmer/delivery' },
    { id: 'notif_3', user_id: 'usr_b1', title: 'Supplier Match Found', msg: '95% Match: Farmer Ramesh Kumar in Eluru matches your 8,000 kg Tomato requirement.', type: 'system', link: '/buyer/matches' },
    { id: 'notif_4', user_id: 'usr_b1', title: 'Market Alert', msg: 'Tomato prices trend upward (+₹2.50/kg) in Eluru APMC over past 7 days.', type: 'system', link: '/buyer/market' },
    { id: 'notif_5', user_id: 'usr_b4', title: 'Shipment En Route', msg: 'Order AGRI-2026-001024 is approaching Rajahmundry. Estimated arrival 5:30 PM.', type: 'delivery', link: '/buyer/orders' }
  ];

  for (const n of notifications) {
    await run(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [n.id, n.user_id, n.title, n.msg, n.type, n.link]
    );
  }

  console.log('Database seeding complete with full Andhra Pradesh agricultural dataset!');
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed execution finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed execution failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
