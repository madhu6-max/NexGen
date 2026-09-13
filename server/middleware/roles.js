/**
 * Role Authorization Middleware Factory
 *
 * Returns middleware that checks req.user.role against a list of allowed roles.
 * Must be used AFTER the authenticate middleware (req.user must exist).
 *
 * Usage:
 *   const { requireRole } = require('../middleware/roles');
 *   router.get('/admin-only', authenticate, requireRole('admin'), handler);
 *   router.get('/trade', authenticate, requireRole('farmer', 'buyer'), handler);
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required before role check.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. This resource requires one of the following roles: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
}

module.exports = { requireRole };
