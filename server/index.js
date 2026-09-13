// Load environment variables FIRST, before any other modules
require('dotenv').config();

// JWT_SECRET validation — never hardcode a known secret, never print it.
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('=======================================================');
    console.error('FATAL: JWT_SECRET is not set and NODE_ENV=production.');
    console.error('   Refusing to start: a stable signing secret is required');
    console.error('   in production. Set JWT_SECRET in the environment.');
    console.error('=======================================================');
    process.exit(1);
  }
  // Development-only fallback: ephemerally generated per restart.
  const crypto = require('crypto');
  process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.warn('=======================================================');
  console.warn('⚠️  WARNING: JWT_SECRET is not set in environment.');
  console.warn('   A random secret has been generated for this session.');
  console.warn('   All tokens will be invalidated when the server restarts.');
  console.warn('   Set JWT_SECRET in your .env file for persistent sessions.');
  console.warn('   (Development fallback only — production refuses to start.)');
  console.warn('=======================================================');
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initSchema } = require('./db/database');
const { ensureReferenceData } = require('./db/referenceData');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Environment-based CORS: no wildcard when a frontend origin is configured.
// Always allows local Vite dev origins; additionally allows FRONTEND_URL when set.
// Requests without an Origin header (health checks, server-to-server) pass through.
const allowedOrigins = ['http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: origin not allowed'));
  }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/farmers', require('./routes/farmers'));
app.use('/api/buyers', require('./routes/buyers'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/produce', require('./routes/produce'));
app.use('/api/requirements', require('./routes/requirements'));
app.use('/api/matching', require('./routes/matching'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/voice', require('./routes/voice'));
app.use('/api/payments', require('./routes/payments'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AgriLink Enterprise API Gateway',
    timestamp: new Date().toISOString(),
    version: '2.0.0-hackathon'
  });
});

// Serve frontend in production if built
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// Fallback handler for client SPA in Express 5
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) return next();
  const indexHtml = path.join(clientDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send(`
        <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto; text-align: center;">
          <h1 style="color: #059669;">🌱 AgriLink API Server Running</h1>
          <p>The backend server is running on port <b>${PORT}</b>.</p>
          <p>Start the Vite React client with: <code>cd client && npm run dev</code></p>
          <p><a href="/api/health" style="color: #0284c7;">Check API Health</a> | <a href="/api/crops" style="color: #0284c7;">View Crops</a></p>
        </div>
      `);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize database schema and start server
initSchema()
  .then(() => ensureReferenceData())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🌱 AgriLink API Gateway successfully started on port ${PORT}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   Database: SQLite at server/agrilink.db`);
      console.log(`   Demo Login: ${process.env.ENABLE_DEMO_LOGIN === 'true' ? '✅ ENABLED' : '❌ DISABLED'}`);
      console.log(`   JWT Auth: ✅ ACTIVE`);
      console.log(`=======================================================`);
    });
  }).catch(err => {
    console.error('Failed to initialize server schema:', err);
    process.exit(1);
  });
