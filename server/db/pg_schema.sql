-- ==========================================================
-- AgriLink PostgreSQL Enterprise Production Schema
-- Designed for High-Throughput Agricultural Trade & Escrow
-- ==========================================================

-- 1. Users & Roles
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(32),
  role VARCHAR(32) NOT NULL CHECK(role IN ('farmer', 'buyer', 'admin')),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Organizations (Buyers)
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(64) NOT NULL,
  reg_number VARCHAR(128),
  address TEXT,
  contact_person VARCHAR(255),
  procurement_team_size INT DEFAULT 5,
  trust_score INT DEFAULT 94,
  verified_status VARCHAR(32) DEFAULT 'VERIFIED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Farmers
CREATE TABLE IF NOT EXISTS farmers (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  email VARCHAR(255),
  village VARCHAR(128),
  district VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL DEFAULT 'Andhra Pradesh',
  farm_size_acres NUMERIC(8, 2),
  experience_years INT,
  fpo_name VARCHAR(255),
  bank_account_placeholder VARCHAR(64),
  reliability_score INT DEFAULT 92,
  rating NUMERIC(3, 2) DEFAULT 4.80,
  total_orders INT DEFAULT 12,
  verified_status VARCHAR(32) DEFAULT 'VERIFIED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Farm Parcels
CREATE TABLE IF NOT EXISTS farms (
  id VARCHAR(64) PRIMARY KEY,
  farmer_id VARCHAR(64) NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  location_name VARCHAR(255) NOT NULL,
  village VARCHAR(128),
  district VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL DEFAULT 'Andhra Pradesh',
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  area_acres NUMERIC(8, 2),
  soil_type VARCHAR(128),
  irrigation_type VARCHAR(128),
  ownership_status VARCHAR(128) DEFAULT 'Owner-Cultivator',
  verified INT DEFAULT 1
);

-- 5. Farmer Verifications (4-Step)
CREATE TABLE IF NOT EXISTS farmer_verifications (
  id VARCHAR(64) PRIMARY KEY,
  farmer_id VARCHAR(64) NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL CHECK(status IN ('VERIFIED', 'PARTIALLY VERIFIED', 'PENDING', 'REJECTED')),
  doc_type VARCHAR(255),
  doc_url TEXT,
  notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE
);

-- 6. Crops Catalog
CREATE TABLE IF NOT EXISTS crops (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(128) NOT NULL,
  variety VARCHAR(128),
  season VARCHAR(64),
  expected_yield_kg_per_acre NUMERIC(10, 2),
  current_market_price NUMERIC(10, 2) NOT NULL,
  min_price NUMERIC(10, 2),
  max_price NUMERIC(10, 2),
  price_trend VARCHAR(32) DEFAULT 'increasing',
  indicative_forecast_min NUMERIC(10, 2),
  indicative_forecast_max NUMERIC(10, 2),
  image_url TEXT
);

-- 7. Market Prices (APMC Mandi Historical Records)
CREATE TABLE IF NOT EXISTS market_prices (
  id VARCHAR(64) PRIMARY KEY,
  crop_id VARCHAR(64) NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  district VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL DEFAULT 'Andhra Pradesh',
  market_name VARCHAR(255) NOT NULL,
  price_date DATE NOT NULL,
  modal_price NUMERIC(10, 2) NOT NULL,
  min_price NUMERIC(10, 2),
  max_price NUMERIC(10, 2),
  arrival_tonnes NUMERIC(10, 2)
);

-- 8. Produce Listings
CREATE TABLE IF NOT EXISTS produce_listings (
  id VARCHAR(64) PRIMARY KEY,
  farmer_id VARCHAR(64) NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  crop_id VARCHAR(64) NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  image_url TEXT,
  total_qty_kg NUMERIC(12, 2) NOT NULL,
  available_qty_kg NUMERIC(12, 2) NOT NULL,
  quality_grade VARCHAR(32) NOT NULL,
  moisture_pct NUMERIC(5, 2),
  size_mm NUMERIC(6, 2),
  color VARCHAR(64),
  defect_pct NUMERIC(5, 2) DEFAULT 0,
  is_organic INT DEFAULT 0,
  certification VARCHAR(255),
  expected_price_per_kg NUMERIC(10, 2) NOT NULL,
  harvest_date DATE,
  available_from DATE,
  available_until DATE,
  farm_location VARCHAR(255),
  district VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL DEFAULT 'Andhra Pradesh',
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  verification_status VARCHAR(32) DEFAULT 'VERIFIED' CHECK(verification_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
  verification_notes TEXT,
  status VARCHAR(32) DEFAULT 'Available' CHECK(status IN ('Available', 'Paused', 'Sold Out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Crop Quality Records
CREATE TABLE IF NOT EXISTS crop_quality_records (
  id VARCHAR(64) PRIMARY KEY,
  produce_id VARCHAR(64) NOT NULL REFERENCES produce_listings(id) ON DELETE CASCADE,
  grade VARCHAR(32) NOT NULL,
  moisture_pct NUMERIC(5, 2),
  size_mm NUMERIC(6, 2),
  color VARCHAR(64),
  defect_pct NUMERIC(5, 2),
  organic_cert VARCHAR(255),
  inspection_date DATE,
  inspector_name VARCHAR(255),
  ai_confidence NUMERIC(4, 3),
  verification_status VARCHAR(32) DEFAULT 'Passed'
);

-- 10. Procurement Requirements
CREATE TABLE IF NOT EXISTS procurement_requirements (
  id VARCHAR(64) PRIMARY KEY,
  buyer_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  crop_id VARCHAR(64) NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  quantity_kg NUMERIC(12, 2) NOT NULL,
  quality_grade VARCHAR(32) NOT NULL,
  max_price_per_kg NUMERIC(10, 2) NOT NULL,
  preferred_location VARCHAR(255),
  max_distance_km NUMERIC(8, 2) DEFAULT 50,
  required_delivery_date DATE NOT NULL,
  delivery_location TEXT NOT NULL,
  delivery_lat NUMERIC(10, 6),
  delivery_lng NUMERIC(10, 6),
  special_requirements TEXT,
  status VARCHAR(32) DEFAULT 'Open' CHECK(status IN ('Open', 'Matching', 'Fulfilled', 'Closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Purchase Requests
CREATE TABLE IF NOT EXISTS purchase_requests (
  id VARCHAR(64) PRIMARY KEY,
  requirement_id VARCHAR(64) REFERENCES procurement_requirements(id) ON DELETE SET NULL,
  produce_id VARCHAR(64) NOT NULL REFERENCES produce_listings(id) ON DELETE CASCADE,
  buyer_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  farmer_id VARCHAR(64) NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  requested_qty_kg NUMERIC(12, 2) NOT NULL,
  offered_price_per_kg NUMERIC(10, 2) NOT NULL,
  counter_price_per_kg NUMERIC(10, 2),
  delivery_date DATE,
  status VARCHAR(32) DEFAULT 'Pending' CHECK(status IN ('Pending', 'Counter_Offered', 'Accepted_By_Farmer', 'Confirmed_By_Buyer', 'Rejected', 'Cancelled')),
  last_actor VARCHAR(32) DEFAULT 'buyer',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Negotiation History
CREATE TABLE IF NOT EXISTS negotiation_history (
  id VARCHAR(64) PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  sender_role VARCHAR(32) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  price_per_kg NUMERIC(10, 2) NOT NULL,
  qty_kg NUMERIC(12, 2) NOT NULL,
  delivery_date DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Orders
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_code VARCHAR(64) UNIQUE NOT NULL,
  request_id VARCHAR(64) REFERENCES purchase_requests(id) ON DELETE SET NULL,
  buyer_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  farmer_id VARCHAR(64) NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  produce_id VARCHAR(64) NOT NULL REFERENCES produce_listings(id) ON DELETE CASCADE,
  crop_id VARCHAR(64) NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  agreed_qty_kg NUMERIC(12, 2) NOT NULL,
  agreed_price_per_kg NUMERIC(10, 2) NOT NULL,
  total_value NUMERIC(14, 2) NOT NULL,
  quality_grade VARCHAR(32) NOT NULL,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  pickup_lat NUMERIC(10, 6),
  pickup_lng NUMERIC(10, 6),
  delivery_lat NUMERIC(10, 6),
  delivery_lng NUMERIC(10, 6),
  expected_delivery DATE,
  status VARCHAR(64) DEFAULT 'Order Confirmed' CHECK(status IN ('Order Confirmed', 'Produce Preparing', 'Ready for Pickup', 'Picked Up', 'In Transit', 'Arrived at Destination', 'Buyer Inspection', 'Completed', 'Issue Reported', 'Returned', 'Cancelled')),
  verification_id VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Order Verifications (Digital Seal)
CREATE TABLE IF NOT EXISTS order_verifications (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  verification_code VARCHAR(64) UNIQUE NOT NULL,
  qty_confirmed INT DEFAULT 1,
  quality_confirmed INT DEFAULT 1,
  price_confirmed INT DEFAULT 1,
  digital_signature TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Deliveries & Fleet Telematics
CREATE TABLE IF NOT EXISTS deliveries (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_name VARCHAR(255) NOT NULL,
  driver_phone VARCHAR(32),
  vehicle_number VARCHAR(64) NOT NULL,
  pickup_lat NUMERIC(10, 6) NOT NULL,
  pickup_lng NUMERIC(10, 6) NOT NULL,
  delivery_lat NUMERIC(10, 6) NOT NULL,
  delivery_lng NUMERIC(10, 6) NOT NULL,
  current_lat NUMERIC(10, 6) NOT NULL,
  current_lng NUMERIC(10, 6) NOT NULL,
  distance_km NUMERIC(8, 2),
  distance_remaining_km NUMERIC(8, 2),
  estimated_arrival VARCHAR(64),
  status VARCHAR(32) DEFAULT 'In Transit' CHECK(status IN ('Scheduled', 'Picked Up', 'In Transit', 'Delivered')),
  progress_pct INT DEFAULT 20,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Quality Inspections
CREATE TABLE IF NOT EXISTS quality_inspections (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  qty_received_kg NUMERIC(12, 2) NOT NULL,
  quality_grade VARCHAR(32) NOT NULL,
  condition_status VARCHAR(64) DEFAULT 'Good',
  moisture_pct NUMERIC(5, 2),
  defect_pct NUMERIC(5, 2),
  inspector_notes TEXT,
  status VARCHAR(32) DEFAULT 'Accepted',
  inspected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Returns & Replacements
CREATE TABLE IF NOT EXISTS returns (
  id VARCHAR(64) PRIMARY KEY,
  return_code VARCHAR(64) UNIQUE NOT NULL,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  farmer_id VARCHAR(64) NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  reason VARCHAR(64) NOT NULL CHECK(reason IN ('Wrong Quantity', 'Poor Quality', 'Damaged Produce', 'Wrong Product', 'Late Delivery', 'Other')),
  description TEXT NOT NULL,
  evidence_images TEXT,
  requested_qty_kg NUMERIC(12, 2),
  farmer_response TEXT,
  admin_decision VARCHAR(64) DEFAULT 'Pending Review' CHECK(admin_decision IN ('Pending Review', 'ACCEPTED', 'PARTIAL REFUND', 'REPLACEMENT', 'RETURN TO FARMER', 'REJECTED')),
  resolution_status VARCHAR(64) DEFAULT 'Under Investigation' CHECK(resolution_status IN ('Under Investigation', 'Resolved', 'Replacement Sent', 'Return Accepted', 'Refund Processed', 'Case Closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- 18. Ratings & Reviews
CREATE TABLE IF NOT EXISTS ratings (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_user_id VARCHAR(64) NOT NULL,
  to_user_id VARCHAR(64) NOT NULL,
  role VARCHAR(32) NOT NULL,
  rating_overall NUMERIC(3, 2) NOT NULL,
  quality_rating NUMERIC(3, 2),
  quantity_rating NUMERIC(3, 2),
  delivery_rating NUMERIC(3, 2),
  communication_rating NUMERIC(3, 2),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(32) DEFAULT 'system',
  is_read INT DEFAULT 0,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Production Indexes for Fast Queries & Matching
CREATE INDEX IF NOT EXISTS idx_produce_crop_status ON produce_listings(crop_id, status);
CREATE INDEX IF NOT EXISTS idx_produce_farmer ON produce_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_requirements_crop_status ON procurement_requirements(crop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_requests_farmer ON purchase_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_requests_buyer ON purchase_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
