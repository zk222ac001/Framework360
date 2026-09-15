const jwt = require('jsonwebtoken');

const prisma = require('../db');
const { getSubscriptionState } = require('../services/subscription.service');

const PUBLIC_PREFIXES = ['/auth', '/health', '/demo-requests', '/subscription/me'];

function isPublicPath(path) {
  return PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix + '/'));
}

function getBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

function getAuthToken(req) {
  return (
    req.cookies?.['__Secure-becompliant_access'] ||
    req.cookies?.['__Host-becompliant_access'] ||
    req.cookies?.becompliant_access ||
    req.cookies?.accessToken ||
    getBearerToken(req.headers.authorization)
  );
}

function normalizeDecodedUser(decoded) {
  const userId = decoded.userId || decoded.id;
  return { ...decoded, id: userId, userId };
}

function resolveUserFromRequest(req) {
  if (req.user) return req.user;

  const token = getAuthToken(req);
  if (!token) return null;

  try {
    return normalizeDecodedUser(jwt.verify(token, process.env.JWT_SECRET));
  } catch {
    return null;
  }
}

async function requireActiveSubscription(req, res, next) {
  try {
    if (isPublicPath(req.path)) {
      return next();
    }

    const user = resolveUserFromRequest(req);

    if (!user) {
      return next();
    }

    req.user = user;

    if (user.role === 'PLATFORM_ADMIN') {
      return next();
    }

    if (!user.companyId) {
      return res.status(403).json({
        error: 'Company account is not active',
        subscription: { allowed: false, reason: 'User is not attached to a company' },
      });
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true, subscriptionPlan: true, subscriptionStatus: true, subscriptionRenewal: true },
    });

    const subscription = getSubscriptionState(company);
    req.subscription = subscription;

    if (!subscription.allowed) {
      return res.status(403).json({ error: 'Company account is not active', subscription });
    }

    return next();
  } catch (error) {
    console.error('Account access middleware error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = { requireActiveSubscription };
