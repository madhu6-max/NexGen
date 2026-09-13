const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DEFAULT_DB_PATH = path.join(__dirname, '..', 'agrilink.db');
// Configurable location for persistent disks (e.g. Render volumes).
// Falls back to the existing local-development database when unset.
const DB_PATH = process.env.SQLITE_DB_PATH || DEFAULT_DB_PATH;
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure the parent directory exists (disk mount points may start out empty).
try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
} catch (err) {
  console.error('Could not create database directory:', err.message);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', DB_PATH);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

// Helper wrappers for async/await
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const initSchema = async () => {
  try {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    // Split by semicolons for sequential execution
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await run(stmt);
    }

    // Safe column migrations for existing databases
    const safeAddColumn = async (table, col, def) => {
      try {
        await run(`ALTER TABLE ${table} ADD COLUMN ${col} ${def};`);
      } catch (e) {
        // Ignored if column already exists
      }
    };

    await safeAddColumn('procurement_requirements', 'min_price_per_kg', 'REAL');
    await safeAddColumn('orders', 'payment_method', "TEXT DEFAULT 'NOT_SET'");
    await safeAddColumn('orders', 'payment_status', "TEXT DEFAULT 'NOT_REQUIRED_YET'");
    await safeAddColumn('orders', 'ordered_qty_kg', 'REAL');
    await safeAddColumn('orders', 'fulfilled_qty_kg', 'REAL DEFAULT 0');
    await safeAddColumn('orders', 'remaining_qty_kg', 'REAL');

    // Populate default quantities for existing orders
    await run(`UPDATE orders SET ordered_qty_kg = agreed_qty_kg WHERE ordered_qty_kg IS NULL;`);
    await run(`UPDATE orders SET remaining_qty_kg = MAX(0, agreed_qty_kg - COALESCE(fulfilled_qty_kg, 0)) WHERE remaining_qty_kg IS NULL;`);

    // Check if orders table status constraint needs expansion
    const orderTableDef = await get("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'");
    if (orderTableDef && orderTableDef.sql && !orderTableDef.sql.includes('Dispatched')) {
      await run("PRAGMA foreign_keys = OFF;");
      await run(`
        CREATE TABLE orders_new (
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
          status TEXT DEFAULT 'Order Confirmed' CHECK(status IN ('Order Confirmed', 'Produce Preparing', 'Ready for Pickup', 'Picked Up', 'In Transit', 'Arrived at Destination', 'Buyer Inspection', 'Completed', 'Issue Reported', 'Returned', 'Cancelled', 'Dispatched', 'Partially Fulfilled', 'CONFIRMED', 'PREPARING', 'DISPATCHED', 'PARTIALLY_FULFILLED', 'DELIVERED', 'PAYMENT_PENDING')),
          verification_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          payment_method TEXT DEFAULT 'NOT_SET',
          payment_status TEXT DEFAULT 'NOT_REQUIRED_YET',
          ordered_qty_kg REAL,
          fulfilled_qty_kg REAL DEFAULT 0,
          remaining_qty_kg REAL
        );
      `);
      await run(`
        INSERT INTO orders_new SELECT
          id, order_code, request_id, buyer_id, farmer_id, produce_id, crop_id,
          agreed_qty_kg, agreed_price_per_kg, total_value, quality_grade,
          pickup_location, delivery_location, pickup_lat, pickup_lng, delivery_lat, delivery_lng,
          expected_delivery, status, verification_id, created_at,
          payment_method, payment_status, ordered_qty_kg, fulfilled_qty_kg, remaining_qty_kg
        FROM orders;
      `);
      await run("DROP TABLE orders;");
      await run("ALTER TABLE orders_new RENAME TO orders;");
      await run("PRAGMA foreign_keys = ON;");
      console.log("Orders table successfully migrated with expanded status constraints.");
    }

    console.log('Database schema initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize database schema:', err);
    throw err;
  }
};

module.exports = {
  db,
  query,
  get,
  run,
  initSchema
};
