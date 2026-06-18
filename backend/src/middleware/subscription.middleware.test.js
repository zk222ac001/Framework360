jest.mock('../db', () => ({
  company: {
    findUnique: jest.fn(),
  },
}));

const prisma = require('../db');
const { SUBSCRIPTION_STATUSES, SUBSCRIPTION_PLANS } = require('../services/subscription.service');
const { requireActiveSubscription } = require('./subscription.middleware');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('subscription.middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes through unauthenticated requests so auth middleware can handle them', async () => {
    const req = { path: '/dashboard' };
    const res = createRes();
    const next = jest.fn();

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(prisma.company.findUnique).not.toHaveBeenCalled();
  });

  it('bypasses checks for platform administrators', async () => {
    const req = { path: '/companies', user: { role: 'PLATFORM_ADMIN' } };
    const res = createRes();
    const next = jest.fn();

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(prisma.company.findUnique).not.toHaveBeenCalled();
  });

  it('bypasses checks for exempt paths', async () => {
    const req = { path: '/subscription/me', user: { role: 'CUSTOMER_ADMIN', companyId: 'company-1' } };
    const res = createRes();
    const next = jest.fn();

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(prisma.company.findUnique).not.toHaveBeenCalled();
  });

  it('blocks users without a company', async () => {
    const req = { path: '/dashboard', user: { role: 'CUSTOMER_ADMIN' } };
    const res = createRes();
    const next = jest.fn();

    await requireActiveSubscription(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Company account is not active' }));
  });

  it('allows an active trial', async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
      subscriptionStatus: SUBSCRIPTION_STATUSES.TRIAL,
      subscriptionRenewal: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const req = { path: '/dashboard', user: { role: 'CUSTOMER_ADMIN', companyId: 'company-1' } };
    const res = createRes();
    const next = jest.fn();

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.subscription.allowed).toBe(true);
  });

  it('blocks expired subscriptions', async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
      subscriptionStatus: SUBSCRIPTION_STATUSES.TRIAL,
      subscriptionRenewal: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    const req = { path: '/dashboard', user: { role: 'CUSTOMER_ADMIN', companyId: 'company-1' } };
    const res = createRes();
    const next = jest.fn();

    await requireActiveSubscription(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Company account is not active',
      subscription: expect.objectContaining({ allowed: false, status: SUBSCRIPTION_STATUSES.EXPIRED }),
    }));
  });
});
