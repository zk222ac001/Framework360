jest.mock('../db', () => ({
  company: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

const mockStripe = {
  customers: {
    list: jest.fn(),
    create: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  subscriptions: {
    retrieve: jest.fn(),
  },
};

jest.mock('stripe', () => jest.fn(() => mockStripe));

jest.mock('../middleware/auth.middleware', () => ({
  requireAuth: (req, res, next) => {
    req.user = req.testUser || {
      role: 'PLATFORM_ADMIN',
      companyId: 'company-1',
      userId: 'admin-1',
      email: 'admin@example.com',
    };
    next();
  },
  requireRole: (...allowedRoles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  },
}));

const express = require('express');
const request = require('supertest');
const prisma = require('../db');
const { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } = require('../services/subscription.service');
const billingRoutes = require('./billing.routes');

const savedEnv = { ...process.env };

function createApp(testUser) {
  const app = express();
  app.use('/billing/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use((req, res, next) => {
    req.testUser = testUser;
    next();
  });
  app.use('/billing', billingRoutes);
  return app;
}

function mockCompany(overrides = {}) {
  return {
    id: 'company-1',
    name: 'Acme Compliance',
    subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
    subscriptionStatus: SUBSCRIPTION_STATUSES.TRIAL,
    subscriptionRenewal: null,
    users: [{ email: 'billing@example.com' }],
    ...overrides,
  };
}

describe('billing.routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...savedEnv,
      STRIPE_SECRET_KEY: 'sk_test_unit',
      STRIPE_WEBHOOK_SECRET: 'whsec_unit',
      STRIPE_STARTER_PRICE_ID: 'price_starter123',
      STRIPE_PROFESSIONAL_PRICE_ID: 'price_professional123',
      STRIPE_ENTERPRISE_PRICE_ID: 'price_enterprise123',
      APP_BASE_URL: 'https://app.example.com',
    };

    prisma.company.findUnique.mockResolvedValue(mockCompany());
    prisma.company.update.mockResolvedValue(mockCompany({
      subscriptionPlan: SUBSCRIPTION_PLANS.PROFESSIONAL,
      subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE,
    }));
    mockStripe.customers.list.mockResolvedValue({ data: [{ id: 'cus_existing' }] });
    mockStripe.customers.create.mockResolvedValue({ id: 'cus_created' });
    mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.test/session' });
    mockStripe.billingPortal.sessions.create.mockResolvedValue({ url: 'https://billing.stripe.test/session' });
    mockStripe.subscriptions.retrieve.mockResolvedValue({ current_period_end: 1782000000 });
  });

  afterAll(() => {
    process.env = savedEnv;
  });

  describe('POST /billing/checkout-session', () => {
    it('creates a Stripe Checkout Session with the configured recurring price', async () => {
      const response = await request(createApp())
        .post('/billing/checkout-session')
        .send({ companyId: 'company-1', plan: 'professional' })
        .expect(200);

      expect(response.body.url).toBe('https://checkout.stripe.test/session');
      expect(prisma.company.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'company-1' },
      }));
      expect(mockStripe.customers.list).toHaveBeenCalledWith({
        email: 'billing@example.com',
        limit: 1,
      });
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_existing',
        line_items: [{ price: 'price_professional123', quantity: 1 }],
        client_reference_id: 'company-1',
        metadata: {
          companyId: 'company-1',
          plan: SUBSCRIPTION_PLANS.PROFESSIONAL,
        },
        subscription_data: {
          metadata: {
            companyId: 'company-1',
            plan: SUBSCRIPTION_PLANS.PROFESSIONAL,
          },
        },
        success_url: 'https://app.example.com/admin/billing?checkout=success',
        cancel_url: 'https://app.example.com/admin/billing?checkout=cancelled',
      }));
    });

    it('rejects Stripe product IDs before calling Checkout', async () => {
      process.env.STRIPE_STARTER_PRICE_ID = 'prod_not_a_price';

      const response = await request(createApp())
        .post('/billing/checkout-session')
        .send({ companyId: 'company-1', plan: SUBSCRIPTION_PLANS.STARTER })
        .expect(503);

      expect(response.body.error).toBe('Stripe price is misconfigured');
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
      expect(prisma.company.findUnique).not.toHaveBeenCalled();
    });

    it('uses the authenticated customer admin company instead of a spoofed company id', async () => {
      await request(createApp({
        role: 'CUSTOMER_ADMIN',
        companyId: 'owned-company',
        userId: 'user-1',
        email: 'customer-admin@example.com',
      }))
        .post('/billing/checkout-session')
        .send({ companyId: 'other-company', plan: SUBSCRIPTION_PLANS.STARTER })
        .expect(200);

      expect(prisma.company.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'owned-company' },
      }));
    });
  });

  describe('POST /billing/customer-portal', () => {
    it('creates a Stripe Customer Portal session for the company customer', async () => {
      mockStripe.customers.list.mockResolvedValue({ data: [] });

      const response = await request(createApp())
        .post('/billing/customer-portal')
        .send({ companyId: 'company-1' })
        .expect(200);

      expect(response.body.url).toBe('https://billing.stripe.test/session');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'billing@example.com',
        name: 'Acme Compliance',
        metadata: { companyId: 'company-1' },
      });
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_created',
        return_url: 'https://app.example.com/admin/billing',
      });
    });
  });

  describe('POST /billing/webhook', () => {
    it('activates the company after checkout.session.completed', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            client_reference_id: 'company-1',
            metadata: { plan: SUBSCRIPTION_PLANS.ENTERPRISE },
            subscription: 'sub_123',
          },
        },
      });

      await request(createApp())
        .post('/billing/webhook')
        .set('stripe-signature', 'valid-signature')
        .set('content-type', 'application/json')
        .send('{}')
        .expect(200);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        expect.any(Buffer),
        'valid-signature',
        'whsec_unit',
      );
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        data: {
          subscriptionPlan: SUBSCRIPTION_PLANS.ENTERPRISE,
          subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE,
          subscriptionRenewal: new Date(1782000000 * 1000),
        },
      });
    });

    it('maps canceled Stripe subscription updates to cancelled app subscriptions', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: {
            status: 'canceled',
            current_period_end: 1782000000,
            metadata: {
              companyId: 'company-1',
              plan: SUBSCRIPTION_PLANS.PROFESSIONAL,
            },
          },
        },
      });

      await request(createApp())
        .post('/billing/webhook')
        .set('stripe-signature', 'valid-signature')
        .set('content-type', 'application/json')
        .send('{}')
        .expect(200);

      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        data: {
          subscriptionPlan: SUBSCRIPTION_PLANS.PROFESSIONAL,
          subscriptionStatus: SUBSCRIPTION_STATUSES.CANCELLED,
          subscriptionRenewal: new Date(1782000000 * 1000),
        },
      });
    });

    it('rejects webhook requests with an invalid Stripe signature', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature');
      });

      try {
        await request(createApp())
          .post('/billing/webhook')
          .set('stripe-signature', 'bad-signature')
          .set('content-type', 'application/json')
          .send('{}')
          .expect(400);

        expect(prisma.company.update).not.toHaveBeenCalled();
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });
  });
});
