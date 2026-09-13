const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, get, run } = require('../db/database');
const { authenticate } = require('../middleware/auth');

// Demo accounts for hackathon demonstration — predefined, not user-selectable
const DEMO_ACCOUNTS = {
  farmer: { email: 'ramesh.farmer@agrilink.in', pass: 'farmer123', name: 'Ramesh Kumar' },
  buyer: { email: 'procurement@abcfoods.com', pass: 'buyer123', name: 'Vikram Mehta (ABC Foods)' },
  admin: { email: 'admin@agrilink.in', pass: 'admin123', name: 'AgriLink Administrator' }
};

/**
 * Helper: Sign a JWT for a user
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Helper: Build a safe user object (no password_hash)
 */
function safeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar_url: user.avatar_url || null
  };
}

/**
 * Helper: Fetch role-specific profile for a user
 */
async function fetchRoleProfile(user) {
  let farmerProfile = null;
  let buyerProfile = null;

  if (user.role === 'farmer') {
    farmerProfile = await get(`SELECT * FROM farmers WHERE user_id = ?`, [user.id]);
  } else if (user.role === 'buyer') {
    buyerProfile = await get(`SELECT * FROM organizations WHERE user_id = ?`, [user.id]);
  }

  return { farmer: farmerProfile, organization: buyerProfile };
}

/**
 * Helper: Verify password with bcrypt only.
 * There is intentionally no plaintext fallback: stored values that are not
 * bcrypt hashes fail closed. Returns true if password matches, false otherwise.
 */
async function verifyPassword(plainPassword, storedHash) {
  // Skip verification if no password provided or stored hash is a non-password marker
  if (!plainPassword || !storedHash) return false;
  if (storedHash === 'GOOGLE_OAUTH_VERIFIED') return false;

  // Only bcrypt hashes are accepted (hashes start with $2a$ or $2b$)
  if (!storedHash.startsWith('$2a$') && !storedHash.startsWith('$2b$')) {
    return false;
  }

  return await bcrypt.compare(plainPassword, storedHash);
}

// ─────────────────────────────────────────────────────────────────────
// GET /api/auth/demo-users
// Returns demo user profiles for the hackathon landing page.
// Gated behind ENABLE_DEMO_LOGIN.
// ─────────────────────────────────────────────────────────────────────
router.get('/demo-users', async (req, res) => {
  try {
    if (process.env.ENABLE_DEMO_LOGIN !== 'true') {
      return res.status(403).json({ error: 'Demo login is disabled.' });
    }

    const users = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.role,
             f.id as farmer_id, f.district as farmer_district, f.fpo_name, f.reliability_score,
             o.id as buyer_id, o.company_name, o.business_type, o.trust_score
      FROM users u
      LEFT JOIN farmers f ON u.id = f.user_id
      LEFT JOIN organizations o ON u.id = o.user_id
      WHERE u.id IN ('usr_f1', 'usr_b1', 'usr_a1')
    `);

    res.json({
      success: true,
      demoUsers: users
    });
  } catch (err) {
    console.error('Demo users error:', err.message);
    res.status(500).json({ error: 'Unable to load demo users. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Authenticates via email+password or demo role switch.
// Issues a signed JWT on success.
// ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, role, isDemoLogin } = req.body;

    let targetEmail = email;
    let targetPass = password;

    // Demo login path — gated behind environment variable
    if (isDemoLogin) {
      if (process.env.ENABLE_DEMO_LOGIN !== 'true') {
        return res.status(403).json({ error: 'Demo login is disabled. Set ENABLE_DEMO_LOGIN=true to enable.' });
      }

      if (!role || !DEMO_ACCOUNTS[role]) {
        return res.status(400).json({ error: 'Invalid demo role. Must be one of: farmer, buyer, admin.' });
      }

      // Use ONLY predefined demo credentials — never trust client-supplied identity
      targetEmail = DEMO_ACCOUNTS[role].email;
      targetPass = DEMO_ACCOUNTS[role].pass;
    }

    if (!targetEmail) {
      return res.status(400).json({ error: 'Email or phone is required.' });
    }

    const user = await get(
      `SELECT * FROM users WHERE email = ? OR phone = ?`,
      [targetEmail, targetEmail]
    );

    // Generic response for unknown account and wrong password alike,
    // so callers cannot enumerate registered accounts.
    if (!user) {
      return res.status(401).json({ error: 'Invalid email/phone or password.' });
    }

    // Verify password using bcrypt only (no plaintext fallback)
    const passwordValid = await verifyPassword(targetPass, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email/phone or password.' });
    }

    // Fetch role-specific profile
    const { farmer: farmerProfile, organization: buyerProfile } = await fetchRoleProfile(user);

    // Sign a real JWT
    const token = signToken(user);

    res.json({
      success: true,
      token,
      user: safeUser(user),
      farmer: farmerProfile,
      organization: buyerProfile
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/auth/google
// DISABLED: Google login requires server-side OAuth credential verification.
// The previous implementation only base64-decoded the token without
// cryptographic verification, which is a security vulnerability.
// ─────────────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  return res.status(501).json({
    error: 'Google login is not configured. Server-side Google OAuth credentials are required for secure verification. Contact the administrator to set up Google Cloud OAuth credentials.'
  });
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Creates a new user account with bcrypt-hashed password.
// Issues a signed JWT on success.
// ─────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, role, password, companyName, businessType, village, district, farmSize } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password is required and must be at least 6 characters.' });
    }

    if (!['farmer', 'buyer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either farmer or buyer.' });
    }

    const existing = await get(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password with bcrypt before storing
    const passwordHash = await bcrypt.hash(password, 10);

    const userId = `usr_${Date.now()}`;
    await run(
      `INSERT INTO users (id, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, email, phone || '', role, passwordHash]
    );

    let farmerProfile = null;
    let buyerProfile = null;

    if (role === 'farmer') {
      const farmerId = `frm_${Date.now()}`;
      await run(
        `INSERT INTO farmers (id, user_id, name, phone, email, village, district, state, farm_size_acres, experience_years, fpo_name, bank_account_placeholder, reliability_score, rating, total_orders, verified_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Andhra Pradesh', ?, 5, 'Independent Farmer', 'SBI-XXXX-0000', 90, 5.0, 0, 'PENDING')`,
        [farmerId, userId, name, phone || '', email, village || 'Eluru Rural', district || 'Eluru', parseFloat(farmSize) || 5.0]
      );
      farmerProfile = await get(`SELECT * FROM farmers WHERE id = ?`, [farmerId]);
    } else if (role === 'buyer') {
      const orgId = `org_${Date.now()}`;
      await run(
        `INSERT INTO organizations (id, user_id, company_name, business_type, reg_number, address, contact_person, procurement_team_size, trust_score, verified_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 3, 90, 'VERIFIED')`,
        [orgId, userId, companyName || `${name} Enterprises`, businessType || 'Food Processor', 'GST-REG-PENDING', `${district || 'Eluru'}, AP`, name]
      );
      buyerProfile = await get(`SELECT * FROM organizations WHERE id = ?`, [orgId]);
    }

    // Sign a real JWT for the new user
    const token = signToken({ id: userId, role });

    res.status(201).json({
      success: true,
      token,
      user: { id: userId, name, email, phone: phone || '', role },
      farmer: farmerProfile,
      organization: buyerProfile
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// Returns the authenticated user's profile from the database.
// Requires a valid JWT — no unauthenticated fallback.
// ─────────────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    // req.user is set by the authenticate middleware from the verified JWT
    const user = await get(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { farmer, organization } = await fetchRoleProfile(user);

    res.json({ user: safeUser(user), farmer, organization });
  } catch (err) {
    console.error('Profile fetch error:', err.message);
    res.status(500).json({ error: 'Unable to load profile. Please try again.' });
  }
});

module.exports = router;
