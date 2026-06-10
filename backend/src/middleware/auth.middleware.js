const jwt = require('jsonwebtoken');

function getBearerToken(authHeader) {
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;

  return authHeader.slice(7);
}

function requireAuth(req, res, next) {
  const cookieToken =
    req.cookies?.['__Host-becompliant_access'] ||
    req.cookies?.becompliant_access ||
    req.cookies?.accessToken;

  const bearerToken = getBearerToken(req.headers.authorization);
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function requireRole(...allowedRoles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return next();
  };
}

const requirePlatformAdmin = requireRole('PLATFORM_ADMIN');

module.exports = {
  requireAuth,
  requireRole,
  requirePlatformAdmin,
};
