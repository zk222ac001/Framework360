jest.mock('../db', () => ({
  company: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
}));

jest.mock('../middleware/auth.middleware', () => ({
  requireAuth: (req, res, next) => {
    req.user = req.testUser || { role: 'PLATFORM_ADMIN', companyId: 'company-1', userId: 'admin-1' };
    next();
  },
  requirePlatformAdmin: (req, res, next) => {
    if (req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  },
}));

const express = require('express');
const request = require('supertest');
const prisma = require('../db');
const { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } = require('../services/subscription.service');
const subscriptionRoutes = require('./subscription.routes');

function createApp(testUser) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.testUser = testUser;
    next();
  });
  app.use('/subscription', subscriptionRoutes);
  return app;
}

describe('subscription.routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /subscription/me', () => {
    it('returns the authenticated company subscription', async () => {
      prisma.company.findUnique.mockResolvedValue({
        id: 'company-1',
        name: 'Acme',
        subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
        subscriptionStatus: SUBSCRIPTION_STATUSES.TRIAL,
        subscriptionRenewal: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const response = await request(createApp({ role: 'CUSTOMER_ADMIN', companyId: 'company-1', userId: 'user-1' }))
        .get('/subscription/me')
        .expect(200);

      expect(response.body.subscription.companyId).toBe('company-1');
      expect(response.body.subscription.subscriptionStatus).toBe(SUBSCRIPTION_STATUSES.TRIAL);
    });

    it('returns 400 when the authenticated user has no company', async () => {
      await request(createApp({ role: 'CUSTOMER_ADMIN', userId: 'user-1' }))
        .get('/subscription/me')
        .expect(400);
    });
  });

  describe('POST /subscription/run-expiration', () => {
    it('expires due subscriptions', async () => {
      prisma.company.findMany.mockResolvedValue([
        {
          id: 'company-1',
          name: 'Acme',
          subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
          subscriptionStatus: SUBSCRIPTION_STATUSES.TRIAL,
          subscriptionRenewal: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      ]);
      prisma.company.updateMany.mockResolvedValue({ count: 1 });

      const response = await request(createApp())
        .post('/subscription/run-expiration')
        .expect(200);

      expect(response.body.expiredCount).toBe(1);
      expect(prisma.company.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: { subscriptionStatus: SUBSCRIPTION_STATUSES.EXPIRED },
      }));
    });
  });

  describe('PATCH /subscription/company/:id', () => {
    it('updates subscription fields', async () => {
      prisma.company.update.mockResolvedValue({
        id: 'company-1',
        name: 'Acme',
        subscriptionPlan: SUBSCRIPTION_PLANS.PROFESSIONAL,
        subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE,
        subscriptionRenewal: new Date('2026-07-18T00:00:00.000Z'),
      });

      const response = await request(createApp())
        .patch('/subscription/company/company-1')
        .send({
          subscriptionPlan: SUBSCRIPTION_PLANS.PROFESSIONAL,
          subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE,
          subscriptionRenewal: '2026-07-18T00:00:00.000Z',
        })
        .expect(200);

      expect(response.body.subscription.subscriptionPlan).toBe(SUBSCRIPTION_PLANS.PROFESSIONAL);
      expect(prisma.company.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'company-1' },
        data: expect.objectContaining({
          subscriptionPlan: SUBSCRIPTION_PLANS.PROFESSIONAL,
          subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE,
        }),
      }));
    });
  });

  describe('POST /subscription/company/:id/renew', () => {
    it('renews a subscription and marks it active', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 'company-1', subscriptionRenewal: null });
      prisma.company.update.mockResolvedValue({
        id: 'company-1',
        name: 'Acme',
        subscriptionPlan: SUBSCRIPTION_PLANS.PROFESSIONAL,
        subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE,
        subscriptionRenewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const response = await request(createApp())
        .post('/subscription/company/company-1/renew')
        .send({ subscriptionPlan: SUBSCRIPTION_PLANS.PROFESSIONAL, months: 1 })
        .expect(200);

      expect(response.body.subscription.subscriptionStatus).toBe(SUBSCRIPTION_STATUSES.ACTIVE);
      expect(prisma.company.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE }),
      }));
    });
  });

  describe('POST /subscription/company/:id/cancel', () => {
    it('cancels a subscription', async () => {
      prisma.company.update.mockResolvedValue({
        id: 'company-1',
        name: 'Acme',
        subscriptionPlan: SUBSCRIPTION_PLANS.PROFESSIONAL,
        subscriptionStatus: SUBSCRIPTION_STATUSES.CANCELLED,
        subscriptionRenewal: new Date('2026-07-18T00:00:00.000Z'),
      });

      const response = await request(createApp())
        .post('/subscription/company/company-1/cancel')
        .expect(200);

      expect(response.body.subscription.subscriptionStatus).toBe(SUBSCRIPTION_STATUSES.CANCELLED);
      expect(prisma.company.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { subscriptionStatus: SUBSCRIPTION_STATUSES.CANCELLED },
      }));
    });
  });
});
