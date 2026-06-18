const {
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_PLANS,
  createTrialSubscriptionData,
  getSubscriptionState,
  buildExpiredSubscriptionWhere,
  expireDueSubscriptions,
} = require('./subscription.service');

describe('subscription.service', () => {
  const fixedNow = new Date('2026-06-18T00:00:00.000Z');

  describe('createTrialSubscriptionData', () => {
    it('creates a trial subscription with the expected plan, status, and renewal date', () => {
      const trial = createTrialSubscriptionData(fixedNow, 14);

      expect(trial.subscriptionPlan).toBe(SUBSCRIPTION_PLANS.TRIAL);
      expect(trial.subscriptionStatus).toBe(SUBSCRIPTION_STATUSES.TRIAL);
      expect(trial.subscriptionRenewal.toISOString()).toBe('2026-07-02T00:00:00.000Z');
    });
  });

  describe('getSubscriptionState', () => {
    it('allows an active trial before the renewal date', () => {
      const state = getSubscriptionState({
        subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
        subscriptionStatus: SUBSCRIPTION_STATUSES.TRIAL,
        subscriptionRenewal: new Date('2026-06-30T00:00:00.000Z'),
      }, fixedNow);

      expect(state.allowed).toBe(true);
      expect(state.status).toBe(SUBSCRIPTION_STATUSES.TRIAL);
      expect(state.reason).toBeNull();
    });

    it('blocks an expired trial when the renewal date is in the past', () => {
      const state = getSubscriptionState({
        subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
        subscriptionStatus: SUBSCRIPTION_STATUSES.TRIAL,
        subscriptionRenewal: new Date('2026-06-17T23:59:59.000Z'),
      }, fixedNow);

      expect(state.allowed).toBe(false);
      expect(state.status).toBe(SUBSCRIPTION_STATUSES.EXPIRED);
      expect(state.reason).toBe('Subscription or trial has expired');
    });

    it('blocks cancelled and suspended subscriptions', () => {
      const cancelled = getSubscriptionState({
        subscriptionPlan: SUBSCRIPTION_PLANS.PROFESSIONAL,
        subscriptionStatus: SUBSCRIPTION_STATUSES.CANCELLED,
        subscriptionRenewal: new Date('2026-12-31T00:00:00.000Z'),
      }, fixedNow);

      const suspended = getSubscriptionState({
        subscriptionPlan: SUBSCRIPTION_PLANS.PROFESSIONAL,
        subscriptionStatus: SUBSCRIPTION_STATUSES.SUSPENDED,
        subscriptionRenewal: new Date('2026-12-31T00:00:00.000Z'),
      }, fixedNow);

      expect(cancelled.allowed).toBe(false);
      expect(suspended.allowed).toBe(false);
    });

    it('treats missing subscription status as active for backwards compatibility', () => {
      const state = getSubscriptionState({
        subscriptionPlan: null,
        subscriptionStatus: null,
        subscriptionRenewal: null,
      }, fixedNow);

      expect(state.allowed).toBe(true);
      expect(state.status).toBe(SUBSCRIPTION_STATUSES.ACTIVE);
    });
  });

  describe('buildExpiredSubscriptionWhere', () => {
    it('builds a query for time-limited subscriptions with renewal dates in the past', () => {
      const where = buildExpiredSubscriptionWhere(fixedNow);

      expect(where.subscriptionStatus.in).toEqual([
        SUBSCRIPTION_STATUSES.TRIAL,
        SUBSCRIPTION_STATUSES.ACTIVE,
        SUBSCRIPTION_STATUSES.PAST_DUE,
      ]);
      expect(where.subscriptionRenewal.lt).toBe(fixedNow);
    });
  });

  describe('expireDueSubscriptions', () => {
    it('returns zero when no subscriptions are due for expiration', async () => {
      const prisma = {
        company: {
          findMany: jest.fn().mockResolvedValue([]),
          updateMany: jest.fn(),
        },
      };

      const result = await expireDueSubscriptions(prisma, fixedNow);

      expect(result).toEqual({ expiredCount: 0, companies: [] });
      expect(prisma.company.updateMany).not.toHaveBeenCalled();
    });

    it('marks due subscriptions as expired and returns the affected companies', async () => {
      const companies = [
        {
          id: 'company-1',
          name: 'Acme',
          subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
          subscriptionStatus: SUBSCRIPTION_STATUSES.TRIAL,
          subscriptionRenewal: new Date('2026-06-17T00:00:00.000Z'),
        },
      ];

      const prisma = {
        company: {
          findMany: jest.fn().mockResolvedValue(companies),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const result = await expireDueSubscriptions(prisma, fixedNow);

      expect(prisma.company.updateMany).toHaveBeenCalledWith({
        where: buildExpiredSubscriptionWhere(fixedNow),
        data: { subscriptionStatus: SUBSCRIPTION_STATUSES.EXPIRED },
      });
      expect(result.expiredCount).toBe(1);
      expect(result.companies[0].subscriptionStatus).toBe(SUBSCRIPTION_STATUSES.EXPIRED);
    });
  });
});
