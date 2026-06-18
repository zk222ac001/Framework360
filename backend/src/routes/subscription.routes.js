const express = require('express');

const prisma = require('../db');
const { requireAuth, requirePlatformAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  SUBSCRIPTION_STATUSES,
  createTrialSubscriptionData,
  getSubscriptionState,
  expireDueSubscriptions,
} = require('../services/subscription.service');
const { updateSubscriptionSchema, renewSubscriptionSchema, extendTrialSchema } = require('../validators/subscription.validator');

const router = express.Router();

function addMonths(date, months) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function isRecordNotFound(error) {
  return error?.code === 'P2025';
}

function handleSubscriptionWriteError(error, res) {
  if (isRecordNotFound(error)) {
    return res.status(404).json({ error: 'Company not found' });
  }

  return res.status(500).json({ error: 'Internal server error', message: error.message });
}

function selectCompanySubscription(company) {
  const state = getSubscriptionState(company);
  return {
    companyId: company.id,
    companyName: company.name,
    subscriptionPlan: company.subscriptionPlan,
    subscriptionStatus: state.status,
    subscriptionRenewal: company.subscriptionRenewal,
    allowed: state.allowed,
    reason: state.reason,
  };
}

router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ error: 'User is not attached to a company' });
    }

    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { id: true, name: true, subscriptionPlan: true, subscriptionStatus: true, subscriptionRenewal: true },
    });

    if (!company) return res.status(404).json({ error: 'Company not found' });

    return res.json({ subscription: selectCompanySubscription(company) });
  } catch (error) {
    console.error('GET /subscription/me error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/run-expiration', requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const result = await expireDueSubscriptions(prisma);
    return res.json(result);
  } catch (error) {
    console.error('POST /subscription/run-expiration error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.patch('/company/:id', requireAuth, requirePlatformAdmin, validate(updateSubscriptionSchema), async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Invalid company id' });

    const data = {};
    if (req.body.subscriptionPlan !== undefined) data.subscriptionPlan = req.body.subscriptionPlan;
    if (req.body.subscriptionStatus !== undefined) data.subscriptionStatus = req.body.subscriptionStatus;
    if (req.body.subscriptionRenewal !== undefined) {
      data.subscriptionRenewal = req.body.subscriptionRenewal ? new Date(req.body.subscriptionRenewal) : null;
    }

    const company = await prisma.company.update({
      where: { id },
      data,
      select: { id: true, name: true, subscriptionPlan: true, subscriptionStatus: true, subscriptionRenewal: true },
    });

    return res.json({ subscription: selectCompanySubscription(company) });
  } catch (error) {
    console.error('PATCH /subscription/company/:id error:', error);
    return handleSubscriptionWriteError(error, res);
  }
});

router.post('/company/:id/extend-trial', requireAuth, requirePlatformAdmin, validate(extendTrialSchema), async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Invalid company id' });

    const current = await prisma.company.findUnique({ where: { id }, select: { id: true, subscriptionRenewal: true } });
    if (!current) return res.status(404).json({ error: 'Company not found' });

    const now = new Date();
    const renewal = current.subscriptionRenewal ? new Date(current.subscriptionRenewal) : null;
    const baseDate = renewal && renewal > now ? renewal : now;

    const company = await prisma.company.update({
      where: { id },
      data: createTrialSubscriptionData(baseDate, req.body.days),
      select: { id: true, name: true, subscriptionPlan: true, subscriptionStatus: true, subscriptionRenewal: true },
    });

    return res.json({ subscription: selectCompanySubscription(company) });
  } catch (error) {
    console.error('POST /subscription/company/:id/extend-trial error:', error);
    return handleSubscriptionWriteError(error, res);
  }
});

router.post('/company/:id/renew', requireAuth, requirePlatformAdmin, validate(renewSubscriptionSchema), async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Invalid company id' });

    const current = await prisma.company.findUnique({ where: { id }, select: { id: true, subscriptionRenewal: true } });
    if (!current) return res.status(404).json({ error: 'Company not found' });

    const now = new Date();
    const renewal = current.subscriptionRenewal ? new Date(current.subscriptionRenewal) : null;
    const baseDate = renewal && renewal > now ? renewal : now;

    const company = await prisma.company.update({
      where: { id },
      data: {
        subscriptionPlan: req.body.subscriptionPlan,
        subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE,
        subscriptionRenewal: addMonths(baseDate, req.body.months),
      },
      select: { id: true, name: true, subscriptionPlan: true, subscriptionStatus: true, subscriptionRenewal: true },
    });

    return res.json({ subscription: selectCompanySubscription(company) });
  } catch (error) {
    console.error('POST /subscription/company/:id/renew error:', error);
    return handleSubscriptionWriteError(error, res);
  }
});

router.post('/company/:id/cancel', requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Invalid company id' });

    const company = await prisma.company.update({
      where: { id },
      data: { subscriptionStatus: SUBSCRIPTION_STATUSES.CANCELLED },
      select: { id: true, name: true, subscriptionPlan: true, subscriptionStatus: true, subscriptionRenewal: true },
    });

    return res.json({ subscription: selectCompanySubscription(company) });
  } catch (error) {
    console.error('POST /subscription/company/:id/cancel error:', error);
    return handleSubscriptionWriteError(error, res);
  }
});

module.exports = router;
