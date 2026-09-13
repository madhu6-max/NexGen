const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 *
 * Verifies the Authorization: Bearer <token> header against JWT_SECRET.
 * On success, attaches the decoded payload to req.user ({ id, role, iat, exp }).
 * On failure, returns HTTP 401 with a JSON error body.
 *
 * Usage:
 *   const { authenticate } = require('../middleware/auth');
 *   router.get('/protected', authenticate, (req, res) => { ... });
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please provide a valid token.' });
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Token is empty.' });
  }

  try {
    // Pin the expected signing algorithm so tokens using any other
    // algorithm (including 'none') are rejected.
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    // Attach verified identity to request — this is the ONLY source of truth
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }
    return res.status(401).json({ error: 'Authentication failed.' });
  }
}

module.exports = { authenticate };
