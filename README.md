# 🌱 AgriLink: Enterprise B2B Agricultural Marketplace & Supply Chain Platform

> **Built for a 24-Hour College Hackathon**
> *Connecting Farms to Real Business Demand with Verifiable Trust, Smart Supply-Demand Matching, and Escrow Logistics.*

---

## 🌾 1. Product Vision

**AgriLink** is an enterprise-grade B2B agricultural marketplace and supply-chain platform connecting farmers and Farmer Producer Organizations (FPOs) with commercial buyers (food processors, wholesalers, exporters, modern retail chains, institutional kitchens, and HoReCa).

Unlike consumer-focused agricultural classifieds, AgriLink enforces a complete commercial trade workflow:

```text
Farmer
   ↓
Verify Farmer + Farm + Crop (4-Step Verification)
   ↓
Check Market Price (APMC Mandi Spot & Predictive AI Range)
   ↓
Add Produce (Multi-Step Batch Specification)
   ↓
Produce Verification (Identity, GPS Geofence, Visual AI Match, Volume Consistency)
   ↓
Available Supply
   ↓
Buyer Requirement (Quantity, Quality Grade, Budget Ceiling, Radius, Date)
   ↓
Smart Supply-Demand Matching (5-Factor Mathematical Scoring)
   ↓
Purchase Request
   ↓
Negotiation / Counter Offer
   ↓
Farmer Acceptance
   ↓
Buyer Confirmation (Explicit PO Creation)
   ↓
Order Creation (e.g. AGRI-2026-001024)
   ↓
Quality + Quantity + Price Verification (Digital Pre-Dispatch ID: VER-AGRI-928374)
   ↓
Pickup & GPS Delivery Tracking (Live Corridor Telematics along NH-16)
   ↓
Expected Delivery Time (Dynamic ETA Countdown)
   ↓
Delivery Confirmation & Buyer Weighbridge Inspection
   ↓
Accept / Return / Replacement (Section 29 Dispute Arbitration)
   ↓
Reciprocal Ratings & Reliability Score Update
   ↓
Order Closed
```

---

## 🚀 2. Quick Start Guide (Zero-Setup Execution)

AgriLink is built as a zero-friction modular monolith with an embedded relational SQLite engine (no database server installation required).

### Prerequisites
- **Node.js** v18+ or v20+ or v22+
- **npm** v9+

### Option A: 1-Click Launch on Windows
Double-click `start.bat` in the project root:
```cmd
start.bat
```
*(Automatically launches the server on `http://localhost:5000` and opens your default browser!)*

### Option B: Terminal Commands
```bash
# 1. From the agrilink/ directory, seed the database with Andhra Pradesh agricultural cluster data
npm run seed

# 2. Build the client bundle (already pre-built in client/dist)
npm run build:client

# 3. Start the API Gateway & Frontend Server
npm start
```
Now visit: **[http://localhost:5000](http://localhost:5000)**

### Option C: Concurrent Developer Mode
```bash
# Terminal 1: Backend Express API
node server/index.js

# Terminal 2: Vite React Hot Reloading
cd client && npm run dev
```

### Option D: Docker Compose (PostgreSQL Deployment)
```bash
docker-compose up --build
```

---

## 🎬 3. Master Live Demonstration Scenario (Section 51)

AgriLink includes a dedicated **Judge Control Panel** at the top of every screen for seamless switching between personas.

### Step-by-Step Live Walkthrough Script:

1. **Step 1: Open the Application (`http://localhost:5000`)**
   - View the **Landing Page** with hero: *"Connect Farms to Real Business Demand"*.
   - Notice the 8-stage commercial pipeline and the 8 value pillars.

2. **Step 2: Enter as Farmer Ramesh Kumar (Eluru)**
   - Click **`[ Switch to Farmer Ramesh ]`** in the top demo bar or hero button.
   - You are logged in as **Ramesh Kumar**, a verified Tomato & Sweet Corn grower in Eluru with **92% Reliability**.
   - View the overview metrics: **25 Tons Produce**, **5 Active Listings**, **3 Pending Requests**, **2 Active Orders**, **12 Completed Orders**.

3. **Step 3: Market Price Intelligence (Section 9)**
   - Click **Market Intelligence** on the sidebar.
   - Select **Tomato** in **Eluru**:
     - Current Spot Price: **₹28/kg** (Eluru APMC Mandi).
     - Interactive SVG Price Trend: Past 30 Days, Past 90 Days, Past 1 Year.
     - Future Indicative Price Estimate: **₹27 - ₹32/kg** (*"Indicative market estimate"* disclaimer clearly labeled).
     - Recommended Action: *"Consider listing between ₹29-31/kg"*.

4. **Step 4: 4-Step Produce Verification (Sections 10 & 11)**
   - Navigate to **Produce Verification**.
   - Inspect the 4 verification layers:
     - **Layer 1: Farmer Identity** → UIDAI e-KYC authenticated.
     - **Layer 2: Farm Location** → GPS (16.7107° N, 81.0952° E) matches Webland AP 1B deed.
     - **Layer 3: Crop Visual AI** → Computer vision confirmed Tomato (Grade A) with **95.4% confidence**.
     - **Layer 4: Volume Yield Modeling** → Declared 10,000 kg consistent with regional acreage models (9,500-10,500 kg).
     - Overall Badge: **✓ Produce Verification Passed** (Trust score 96/100).

5. **Step 5: Switch to Buyer (ABC Food Processing Pvt Ltd)**
   - Click **`[ Switch to Buyer (ABC Foods) ]`** in the top demo banner.
   - Notice the corporate dashboard: 4 Active Requirements, 18 Matched Suppliers, Trust Score **95%**.
   - View the pre-seeded Requirement: **8,000 kg Grade-A Tomato @ Max ₹30/kg** delivery by Sept 15 to Eluru Industrial Area.

6. **Step 6: Smart 5-Factor Matching Engine (Sections 19 & 20)**
   - Navigate to **Matched Suppliers**.
   - The system evaluates and ranks suppliers with transparent score breakdowns:
     - **#1 Farmer Ramesh Kumar: 95% Match Score**
       - Quantity (30/30): 10,000 kg available ≥ 8,000 kg needed.
       - Quality (25/25): Exact Grade A match.
       - Location (20/20): 12 km proximity (under 15 km).
       - Delivery Date (15/15): Available immediately vs Sept 15.
       - Price (10/10): ₹29/kg ≤ ₹30/kg budget ceiling.
       - Supplier Reliability bonus: 92% track record.
     - Click **"Why this score? →"** to show judges the exact mathematical derivation!
     - Notice other competitors ranked below: Farmer Suresh (89%), Farmer Kumar (83%).

7. **Step 7: Purchase Request & Bilateral Negotiation (Sections 13, 14, 22)**
   - Click **`[ Send Purchase Request ]`** for 8,000 kg at **₹30/kg**.
   - Switch to **Farmer Ramesh**: Farmer sees the incoming request in **Buyer Requests** and counter-offers **₹31/kg** with a sorting note.
   - Switch back to **Buyer (ABC Foods)**: Buyer reviews the ₹31 counter-offer and clicks **`[ Confirm Order & Issue PO (Section 22) ]`**.
   - **Order `AGRI-2026-001024` is created and escrow is locked!**

8. **Step 8: Digital Pre-Dispatch Verification (Section 24)**
   - Order generates **Digital Order Verification ID `VER-AGRI-928374`**.
   - Highlights 3 verified pre-dispatch checkpoints:
     - Quantity: 8,000 kg ✓ Confirmed
     - Quality: Grade A ✓ Confirmed
     - Agreed Price: ₹31/kg ✓ Confirmed

9. **Step 9: Live GPS Fleet Tracking Simulation (Sections 25, 26, 27)**
   - Navigate to **GPS Delivery Tracking**.
   - Consignment details:
     - Driver: **Ravi Kumar** (`+91 98492 88472`)
     - Vehicle: **AP 37 TE 1234**
     - Corridor: **Eluru → Rajahmundry (65 km via NH-16)**
     - Remaining Distance: **24.5 km** | ETA: **Today, 5:30 PM**
   - Click **`[ Advance Truck Position (Simulation) ]`** to step the animated truck along the highway waypoints (Eluru → Gundugolanu → Tadepalligudem → Tanuku → Kovvur Bridge → Rajahmundry).
   - Milestone timeline automatically advances through the 8 fulfillment stages!

10. **Step 10: Weighbridge Inspection, Dispute Return & Reciprocal Ratings (Sections 28, 29, 31)**
    - Switch to Buyer in **Procurement Orders**: Click **`[ Inspect Consignment (Section 28) ]`**.
    - Test **Accept Delivery**: Order completes, and the **Reciprocal Rating Modal** automatically opens!
      - Buyer rates farmer across Quality ⭐⭐⭐⭐⭐, Quantity ⭐⭐⭐⭐⭐, Delivery ⭐⭐⭐⭐⭐, Communication ⭐⭐⭐⭐⭐.
      - Farmer reliability score updates dynamically!
    - Alternatively, test **Report Issue (Section 29)**: File a claim for damaged crates (`RET-AGRI-000123`), upload photo evidence, and resolve it via the **Admin Dashboard**!

---

## 🏛️ 4. Architecture & Relational Entities (19 Tables)

AgriLink is structured as a **clean modular monolith**:

```text
agrilink/
├── client/                     # Vite + React 18 + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Navbar, Sidebar, DemoScenarioBanner, StatusBadge, DigitalVerificationBadge
│   │   │   ├── maps/           # GpsDeliveryMap (NH-16 interactive telematics)
│   │   │   └── charts/         # MarketPriceChart (SVG price intelligence & forecast)
│   │   ├── context/            # AuthContext (role state & 1-click switcher)
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── AuthPage.jsx
│   │   │   ├── farmer/         # 10 Farmer pages (Dashboard, Verification, MarketIntel, MyProduce, etc.)
│   │   │   ├── buyer/          # 8 Buyer pages (Dashboard, OrgProfile, Requirements, MatchedSuppliers, etc.)
│   │   │   └── admin/          # Admin Dashboard & Dispute Arbitration
│   │   └── services/api.js     # Unified API Client
│   └── dist/                   # Production-compiled SPA bundle
├── server/                     # Express.js REST API Gateway
│   ├── db/
│   │   ├── database.js         # SQLite async connection wrapper
│   │   ├── schema.sql          # Relational tables schema (19 entities)
│   │   ├── seed.js             # Realistic Andhra Pradesh agricultural seed data
│   │   └── pg_schema.sql       # PostgreSQL alternative enterprise schema
│   ├── routes/                 # 14 REST API Modules
│   └── index.js                # Server entry point (serves API & static client)
├── docker-compose.yml          # PostgreSQL & Node containerization
├── start.bat                   # 1-Click Windows execution script
└── seed.bat                    # 1-Click Database reset script
```

### Relational Schema Design:
1. `users` — Authentication & role-based credentials (farmer, buyer, admin).
2. `organizations` — Corporate buyer entity, MCA reg, FSSAI licenses, trust score.
3. `farmers` — Farmer KYC, village, district, acreage, FPO, reliability score.
4. `farms` — Geotagged land parcels, cadastral GPS, soil & irrigation types.
5. `farmer_verifications` — 4-step producer validation records.
6. `crops` — Master agricultural taxonomy with baseline market rates.
7. `market_prices` — Historical APMC mandi daily modal rates and arrivals.
8. `produce_listings` — Farmer declared supply batches with quality grading.
9. `crop_quality_records` — Spectral computer-vision grading and lab parameters.
10. `procurement_requirements` — Commercial demand requirements.
11. `purchase_requests` — Bilateral purchase inquiries.
12. `negotiation_history` — Multi-turn counter-offer timeline.
13. `orders` — Digital purchase orders (`AGRI-2026-XXXXXX`).
14. `order_verifications` — Pre-dispatch digital certificates (`VER-AGRI-XXXXXX`).
15. `deliveries` — Fleet vehicle telematics, route waypoints, and ETA countdown.
16. `quality_inspections` — Weighbridge intake records.
17. `returns` — Dispute claims and replacement dockets (`RET-AGRI-XXXXXX`).
18. `ratings` — Reciprocal multi-criteria reviews (1 to 5 stars).
19. `notifications` — In-app notification center.

---

## 📐 5. Smart Matching Engine Mathematical Formulation

The rule-based matching engine calculates match compatibility between a produce listing and a buyer procurement requirement:

$$\text{Final Match Score} = S_{\text{qty}} + S_{\text{quality}} + S_{\text{location}} + S_{\text{delivery}} + S_{\text{price}} + B_{\text{reliability}}$$

| Factor | Weight | Evaluation Logic |
| :--- | :---: | :--- |
| **Quantity ($S_{\text{qty}}$)** | **30%** | $\min(30, \frac{Q_{\text{avail}}}{Q_{\text{req}}} \times 30)$ |
| **Quality ($S_{\text{quality}}$)** | **25%** | 25 points if exact grade match or exceeds grade; 12 points for alternative. |
| **Location ($S_{\text{location}}$)** | **20%** | Haversine distance $d$ between farm and plant. $d \le 15\text{ km} \implies 20\text{ pts}$; $d \le d_{\max} \implies \frac{d_{\max} - d}{d_{\max}} \times 20$. |
| **Delivery Date ($S_{\text{delivery}}$)** | **15%** | 15 points if harvest readiness $\le$ required delivery date; 7 points if delayed. |
| **Price ($S_{\text{price}}$)** | **10%** | 10 points if farmer asking price $\le$ buyer budget ceiling; penalized if exceeding. |
| **Trust Bonus ($B_{\text{reliability}}$)** | **+2%** | Awarded if farmer historical reliability score $\ge 90\%$. |

---

## 📡 6. Complete REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/auth/demo-users` | Quick-switch demo accounts |
| `POST` | `/api/auth/login` | Login with credentials or demo role |
| `POST` | `/api/auth/register` | Register farmer or corporate buyer |
| `GET` | `/api/crops` | Master crop list |
| `GET` | `/api/crops/:id/market-intelligence` | APMC spot price, 30d/90d/1y history & forecast |
| `GET` | `/api/produce` | Filterable produce listings |
| `POST` | `/api/produce` | Multi-step batch creation |
| `POST` | `/api/produce/:id/verify` | 4-step AI crop verification |
| `GET` | `/api/requirements` | Active procurement demands |
| `POST` | `/api/requirements` | Create procurement requirement |
| `GET` | `/api/matching/requirement/:id` | 5-factor ranked supplier matching engine |
| `POST` | `/api/requests` | Send purchase request |
| `PUT` | `/api/requests/:id/counter` | Submit price/quantity counter-offer |
| `PUT` | `/api/requests/:id/farmer-accept` | Farmer accepts terms |
| `POST` | `/api/requests/:id/buyer-confirm` | Buyer explicitly confirms → Generates Order |
| `GET` | `/api/orders` | Procurement order list |
| `GET` | `/api/orders/:id` | Detailed order manifest & verification |
| `POST` | `/api/orders/:id/quality-verification` | Pre-dispatch digital seal generation |
| `POST` | `/api/orders/:id/delivery-confirmation` | Accept delivery or report issue |
| `GET` | `/api/deliveries/:orderId` | Live GPS coordinates along NH-16 |
| `PUT` | `/api/deliveries/:id/step` | Advance simulated vehicle telematics position |
| `POST` | `/api/returns` | File return or replacement claim |
| `PUT` | `/api/returns/:id/admin-resolve` | Impartial administrative resolution |
| `POST` | `/api/ratings` | Submit reciprocal ratings & recalculate trust |
| `GET` | `/api/admin/overview` | Executive metrics & transacted GMV |
| `GET` | `/api/admin/analytics` | Supply vs Demand analytics by crop |

---

## 🛡️ 7. Hackathon Notes for Evaluators

- **Zero External Daemon Friction**: Running `node server/index.js` or `start.bat` immediately starts the full stack on port 5000.
- **Pre-Compiled Bundle**: The React frontend is compiled in `client/dist`, so the Express gateway serves the UI directly without requiring a separate Vite server.
- **Geographically Consistent Data**: All seed data is anchored realistically around the **Andhra Pradesh agricultural belt** (Eluru, Rajahmundry, Vijayawada, Guntur, Kakinada, Tanuku, Bhimavaram).
- **Clear Demo Disclaimers**: In accordance with hackathon integrity guidelines, AI image grading, land deeds, and simulated GPS telematics are clearly badged as demonstration data.
