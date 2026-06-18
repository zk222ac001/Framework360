const prisma = require('../db');
const { getSubscriptionState } = require('../services/subscription.service');

const PUBLIC_PREFIXES = ['/auth', '/health', '/demo-requests', '/subscription/me'];

function isPublicPath(path) {
  return PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix + '/'));
}

async function requireActiveSubscription(req, res, next) {
  try {
    if (!req.user || req.user.role === 'PLATFORM_ADMIN' || isPublicPath(req.path)) {
      return next();
    }

    if (!req.user.companyId) {
      return res.status(403).json({
        error: 'Company account is not active',
        subscription: { allowed: false, reason: 'User is not attached to a company' },
      });
    }

    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
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
