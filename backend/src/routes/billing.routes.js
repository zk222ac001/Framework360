const express = require('express');
const Stripe = require('stripe');

const prisma = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } = require('../services/subscription.service');

const router = express.Router();

let stripeClient = null;
let stripeClientSecret = null;

const planPriceEnvMap = {
  [SUBSCRIPTION_PLANS.STARTER]: 'STRIPE_STARTER_PRICE_ID',
  [SUBSCRIPTION_PLANS.PROFESSIONAL]: 'STRIPE_PROFESSIONAL_PRICE_ID',
  [SUBSCRIPTION_PLANS.ENTERPRISE]: 'STRIPE_ENTERPRISE_PRICE_ID',
};

function getAppBaseUrl() {
  return process.env.APP_BASE_URL || process.env.CORS_ORIGIN || 'http://localhost:25173';
}

function getStripePriceId(plan) {
  const envKey = planPriceEnvMap[plan];
  return envKey ? String(process.env[envKey] || '').trim() : null;
}

function getStripeClient() {
  const secretKey = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!secretKey) return null;

  if (!stripeClient || stripeClientSecret !== secretKey) {
    stripeClient = new Stripe(secretKey);
    stripeClientSecret = secretKey;
  }

  return stripeClient;
}

function isValidStripePriceId(priceId) {
  return /^price_[A-Za-z0-9]+$/.test(priceId || '');
}

function ensureStripeConfigured(res) {
  const stripe = getStripeClient();
  if (!stripe) {
    res.status(503).json({
      error: 'Stripe is not configured',
      message: 'Set STRIPE_SECRET_KEY and Stripe price ID environment variables to enable checkout.',
    });
    return null;
  }
  return stripe;
}

function assertSupportedCheckoutPlan(plan) {
  return [
    SUBSCRIPTION_PLANS.STARTER,
    SUBSCRIPTION_PLANS.PROFESSIONAL,
    SUBSCRIPTION_PLANS.ENTERPRISE,
  ].includes(plan);
}

function mapStripeSubscriptionStatus(status) {
  if (status === 'active') return SUBSCRIPTION_STATUSES.ACTIVE;
  if (status === 'trialing') return SUBSCRIPTION_STATUSES.TRIAL;
  if (status === 'canceled' || status === 'incomplete_expired') {
    return SUBSCRIPTION_STATUSES.CANCELLED;
  }
  if (status === 'paused') return SUBSCRIPTION_STATUSES.SUSPENDED;
  return SUBSCRIPTION_STATUSES.PAST_DUE;
}

function getCompanyBillingEmail(company, user) {
  return company.users?.[0]?.email || user.email;
}

async function getCompanyForBilling(user, requestedCompanyId) {
  const companyId = user.role === 'PLATFORM_ADMIN' ? requestedCompanyId : user.companyId;
  if (!companyId) return null;

  return prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptionRenewal: true,
      users: {
        where: { role: 'CUSTOMER_ADMIN' },
        select: { email: true },
        take: 1,
      },
    },
  });
}

async function findOrCreateStripeCustomer(stripe, company, user) {
  const email = getCompanyBillingEmail(company, user);

  if (email) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data[0]) return existing.data[0];
  }

  return stripe.customers.create({
    email,
    name: company.name,
    metadata: {
      companyId: company.id,
    },
  });
}

async function getSubscriptionRenewalDate(stripe, stripeSubscriptionId) {
  if (!stripeSubscriptionId) return null;

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  if (!subscription.current_period_end) return null;

  return new Date(subscription.current_period_end * 1000);
}

router.post(
  '/checkout-session',
  requireAuth,
  requireRole('PLATFORM_ADMIN', 'CUSTOMER_ADMIN'),
  async (req, res) => {
    try {
      const stripe = ensureStripeConfigured(res);
      if (!stripe) return;

      const plan = String(req.body.plan || '').trim().toUpperCase();
      const requestedCompanyId = req.body.companyId ? String(req.body.companyId).trim() : null;

      if (!assertSupportedCheckoutPlan(plan)) {
        return res.status(400).json({
          error: 'Invalid subscription plan',
          allowedPlans: [
            SUBSCRIPTION_PLANS.STARTER,
            SUBSCRIPTION_PLANS.PROFESSIONAL,
            SUBSCRIPTION_PLANS.ENTERPRISE,
          ],
        });
      }

      const priceId = getStripePriceId(plan);
      if (!priceId) {
        return res.status(503).json({
          error: 'Stripe price is not configured',
          message: `Set ${planPriceEnvMap[plan]} for the ${plan} plan.`,
        });
      }
      if (!isValidStripePriceId(priceId)) {
        return res.status(503).json({
          error: 'Stripe price is misconfigured',
          message: `${planPriceEnvMap[plan]} must be a Stripe Price ID beginning with price_. Use the recurring price ID, not a product ID.`,
        });
      }

      const company = await getCompanyForBilling(req.user, requestedCompanyId);
      if (!company) return res.status(404).json({ error: 'Company not found' });

      const customer = await findOrCreateStripeCustomer(stripe, company, req.user);
      const appBaseUrl = getAppBaseUrl();
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customer.id,
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: company.id,
        metadata: {
          companyId: company.id,
          plan,
        },
        subscription_data: {
          metadata: {
            companyId: company.id,
            plan,
          },
        },
        success_url: `${appBaseUrl}/admin/billing?checkout=success`,
        cancel_url: `${appBaseUrl}/admin/billing?checkout=cancelled`,
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error('POST /billing/checkout-session error:', error);
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  },
);

router.post(
  '/customer-portal',
  requireAuth,
  requireRole('PLATFORM_ADMIN', 'CUSTOMER_ADMIN'),
  async (req, res) => {
    try {
      const stripe = ensureStripeConfigured(res);
      if (!stripe) return;

      const requestedCompanyId = req.body.companyId ? String(req.body.companyId).trim() : null;
      const company = await getCompanyForBilling(req.user, requestedCompanyId);
      if (!company) return res.status(404).json({ error: 'Company not found' });

      const customer = await findOrCreateStripeCustomer(stripe, company, req.user);
      const appBaseUrl = getAppBaseUrl();
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: `${appBaseUrl}/admin/billing`,
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error('POST /billing/customer-portal error:', error);
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  },
);

router.post('/webhook', async (req, res) => {
  const stripe = ensureStripeConfigured(res);
  if (!stripe) return;

  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!webhookSecret) {
    return res.status(503).json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error.message);
    return res.status(400).json({ error: 'Invalid Stripe webhook signature' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const companyId = session.metadata?.companyId || session.client_reference_id;
      const plan = session.metadata?.plan;
      const renewalDate = await getSubscriptionRenewalDate(stripe, session.subscription);

      if (companyId && assertSupportedCheckoutPlan(plan)) {
        await prisma.company.update({
          where: { id: companyId },
          data: {
            subscriptionPlan: plan,
            subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE,
            subscriptionRenewal: renewalDate || new Date(),
          },
        });
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const companyId = subscription.metadata?.companyId;
      const plan = subscription.metadata?.plan;

      if (companyId) {
        await prisma.company.update({
          where: { id: companyId },
          data: {
            ...(assertSupportedCheckoutPlan(plan) ? { subscriptionPlan: plan } : {}),
            subscriptionStatus: mapStripeSubscriptionStatus(subscription.status),
            subscriptionRenewal: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          },
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const companyId = subscription.metadata?.companyId;

      if (companyId) {
        await prisma.company.update({
          where: { id: companyId },
          data: { subscriptionStatus: SUBSCRIPTION_STATUSES.CANCELLED },
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('POST /billing/webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
