-- AgriLink Relational Schema
-- Supports SQLite & PostgreSQL syntax

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK(role IN ('farmer', 'buyer', 'admin')),
  avatar_url TEXT,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  company_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  reg_number TEXT,
  address TEXT,
  contact_person TEXT,
  procurement_team_size INT DEFAULT 5,
  trust_score INT DEFAULT 94,
  verified_status TEXT DEFAULT 'VERIFIED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  village TEXT,
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
  farm_size_acres REAL,
  experience_years INT,
  fpo_name TEXT,
  bank_account_placeholder TEXT,
  reliability_score INT DEFAULT 92,
  rating REAL DEFAULT 4.8,
  total_orders INT DEFAULT 12,
  verified_status TEXT DEFAULT 'VERIFIED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farms (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  location_name TEXT NOT NULL,
  village TEXT,
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  area_acres REAL,
  soil_type TEXT,
  irrigation_type TEXT,
  ownership_status TEXT DEFAULT 'Owner-Cultivator',
  verified INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS farmer_verifications (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  step_number INT NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('VERIFIED', 'PARTIALLY VERIFIED', 'PENDING', 'REJECTED')),
  doc_type TEXT,
  doc_url TEXT,
  notes TEXT,
  verified_at DATETIME
);

CREATE TABLE IF NOT EXISTS crops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  variety TEXT,
  season TEXT,
  expected_yield_kg_per_acre REAL,
  current_market_price REAL NOT NULL,
  min_price REAL,
  max_price REAL,
  price_trend TEXT DEFAULT 'increasing',
  indicative_forecast_min REAL,
  indicative_forecast_max REAL,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS market_prices (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES crops(id),
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
  market_name TEXT NOT NULL,
  price_date DATE NOT NULL,
  modal_price REAL NOT NULL,
  min_price REAL,
  max_price REAL,
  arrival_tonnes REAL
);

CREATE TABLE IF NOT EXISTS produce_listings (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  crop_id TEXT NOT NULL REFERENCES crops(id),
  title TEXT NOT NULL,
  image_url TEXT,
  total_qty_kg REAL NOT NULL,
  available_qty_kg REAL NOT NULL,
  quality_grade TEXT NOT NULL,
  moisture_pct REAL,
  size_mm REAL,
  color TEXT,
  defect_pct REAL DEFAULT 0,
  is_organic INT DEFAULT 0,
  certification TEXT,
  expected_price_per_kg REAL NOT NULL,
  harvest_date DATE,
  available_from DATE,
  available_until DATE,
  farm_location TEXT,
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
  latitude REAL,
  longitude REAL,
  verification_status TEXT DEFAULT 'VERIFIED' CHECK(verification_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
  verification_notes TEXT,
  status TEXT DEFAULT 'Available' CHECK(status IN ('Available', 'Paused', 'Sold Out')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crop_quality_records (
  id TEXT PRIMARY KEY,
  produce_id TEXT NOT NULL REFERENCES produce_listings(id),
  grade TEXT NOT NULL,
  moisture_pct REAL,
  size_mm REAL,
  color TEXT,
  defect_pct REAL,
  organic_cert TEXT,
  inspection_date DATE,
  inspector_name TEXT,
  ai_confidence REAL,
  verification_status TEXT DEFAULT 'Passed'
);

CREATE TABLE IF NOT EXISTS procurement_requirements (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES organizations(id),
  crop_id TEXT NOT NULL REFERENCES crops(id),
  title TEXT NOT NULL,
  quantity_kg REAL NOT NULL,
  quality_grade TEXT NOT NULL,
  max_price_per_kg REAL NOT NULL,
  preferred_location TEXT,
  max_distance_km REAL DEFAULT 50,
  required_delivery_date DATE NOT NULL,
  delivery_location TEXT NOT NULL,
  delivery_lat REAL,
  delivery_lng REAL,
  special_requirements TEXT,
  status TEXT DEFAULT 'Open' CHECK(status IN ('Open', 'Matching', 'Fulfilled', 'Closed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_requests (
  id TEXT PRIMARY KEY,
  requirement_id TEXT REFERENCES procurement_requirements(id),
  produce_id TEXT NOT NULL REFERENCES produce_listings(id),
  buyer_id TEXT NOT NULL REFERENCES organizations(id),
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  requested_qty_kg REAL NOT NULL,
  offered_price_per_kg REAL NOT NULL,
  counter_price_per_kg REAL,
  delivery_date DATE,
  status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Counter_Offered', 'Accepted_By_Farmer', 'Confirmed_By_Buyer', 'Rejected', 'Cancelled')),
  last_actor TEXT DEFAULT 'buyer',
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS negotiation_history (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES purchase_requests(id),
  sender_role TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  price_per_kg REAL NOT NULL,
  qty_kg REAL NOT NULL,
  delivery_date DATE,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL,
  request_id TEXT REFERENCES purchase_requests(id),
  buyer_id TEXT NOT NULL REFERENCES organizations(id),
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  produce_id TEXT NOT NULL REFERENCES produce_listings(id),
  crop_id TEXT NOT NULL REFERENCES crops(id),
  agreed_qty_kg REAL NOT NULL,
  agreed_price_per_kg REAL NOT NULL,
  total_value REAL NOT NULL,
  quality_grade TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  pickup_lat REAL,
  pickup_lng REAL,
  delivery_lat REAL,
  delivery_lng REAL,
  expected_delivery DATE,
  status TEXT DEFAULT 'Order Confirmed' CHECK(status IN ('Order Confirmed', 'Produce Preparing', 'Ready for Pickup', 'Picked Up', 'In Transit', 'Arrived at Destination', 'Buyer Inspection', 'Completed', 'Issue Reported', 'Returned', 'Cancelled')),
  verification_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_verifications (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  verification_code TEXT UNIQUE NOT NULL,
  qty_confirmed INT DEFAULT 1,
  quality_confirmed INT DEFAULT 1,
  price_confirmed INT DEFAULT 1,
  digital_signature TEXT,
  verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  vehicle_number TEXT NOT NULL,
  pickup_lat REAL NOT NULL,
  pickup_lng REAL NOT NULL,
  delivery_lat REAL NOT NULL,
  delivery_lng REAL NOT NULL,
  current_lat REAL NOT NULL,
  current_lng REAL NOT NULL,
  distance_km REAL,
  distance_remaining_km REAL,
  estimated_arrival TEXT,
  status TEXT DEFAULT 'In Transit' CHECK(status IN ('Scheduled', 'Picked Up', 'In Transit', 'Delivered')),
  progress_pct INT DEFAULT 20,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quality_inspections (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  buyer_id TEXT NOT NULL REFERENCES organizations(id),
  qty_received_kg REAL NOT NULL,
  quality_grade TEXT NOT NULL,
  condition_status TEXT DEFAULT 'Good',
  moisture_pct REAL,
  defect_pct REAL,
  inspector_notes TEXT,
  status TEXT DEFAULT 'Accepted',
  inspected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS returns (
  id TEXT PRIMARY KEY,
  return_code TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders(id),
  buyer_id TEXT NOT NULL REFERENCES organizations(id),
  farmer_id TEXT NOT NULL REFERENCES farmers(id),
  reason TEXT NOT NULL CHECK(reason IN ('Wrong Quantity', 'Poor Quality', 'Damaged Produce', 'Wrong Product', 'Late Delivery', 'Other')),
  description TEXT NOT NULL,
  evidence_images TEXT,
  requested_qty_kg REAL,
  farmer_response TEXT,
  admin_decision TEXT DEFAULT 'Pending Review' CHECK(admin_decision IN ('Pending Review', 'ACCEPTED', 'PARTIAL REFUND', 'REPLACEMENT', 'RETURN TO FARMER', 'REJECTED')),
  resolution_status TEXT DEFAULT 'Under Investigation' CHECK(resolution_status IN ('Under Investigation', 'Resolved', 'Replacement Sent', 'Return Accepted', 'Refund Processed', 'Case Closed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME
);

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  rating_overall REAL NOT NULL,
  quality_rating REAL,
  quantity_rating REAL,
  delivery_rating REAL,
  communication_rating REAL,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  is_read INT DEFAULT 0,
  link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(payment_status IN ('NOT_REQUIRED_YET', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'COD_PENDING', 'COD_COLLECTED')),
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  idempotency_key TEXT UNIQUE,
  error_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_role TEXT,
  changed_by_name TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
