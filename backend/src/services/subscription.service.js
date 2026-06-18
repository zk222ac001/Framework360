const DEFAULT_TRIAL_DAYS = Number(process.env.DEFAULT_TRIAL_DAYS || 14);

const SUBSCRIPTION_STATUSES = Object.freeze({
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  SUSPENDED: 'SUSPENDED',
});

const SUBSCRIPTION_PLANS = Object.freeze({
  TRIAL: 'TRIAL',
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
});

const BLOCKED_STATUSES = new Set([
  SUBSCRIPTION_STATUSES.EXPIRED,
  SUBSCRIPTION_STATUSES.CANCELLED,
  SUBSCRIPTION_STATUSES.SUSPENDED,
]);

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function createTrialSubscriptionData(now = new Date(), trialDays = DEFAULT_TRIAL_DAYS) {
  return {
    subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
    subscriptionStatus: SUBSCRIPTION_STATUSES.TRIAL,
    subscriptionRenewal: addDays(now, trialDays),
  };
}

function normalizeSubscriptionStatus(status) {
  const normalized = String(status || '').trim().toUpperCase();
  return Object.values(SUBSCRIPTION_STATUSES).includes(normalized) ? normalized : null;
}

function normalizeSubscriptionPlan(plan) {
  const normalized = String(plan || '').trim().toUpperCase();
  return Object.values(SUBSCRIPTION_PLANS).includes(normalized) ? normalized : null;
}

function getSubscriptionState(company, now = new Date()) {
  if (!company) {
    return {
      allowed: false,
      status: SUBSCRIPTION_STATUSES.SUSPENDED,
      reason: 'Company not found',
    };
  }

  const status = normalizeSubscriptionStatus(company.subscriptionStatus) || SUBSCRIPTION_STATUSES.ACTIVE;
  const renewalDate = company.subscriptionRenewal ? new Date(company.subscriptionRenewal) : null;
  const isTimeLimited = status === SUBSCRIPTION_STATUSES.TRIAL || status === SUBSCRIPTION_STATUSES.ACTIVE || status === SUBSCRIPTION_STATUSES.PAST_DUE;
  const isExpiredByDate = Boolean(isTimeLimited && renewalDate && renewalDate.getTime() < now.getTime());

  if (BLOCKED_STATUSES.has(status) || isExpiredByDate) {
    return {
      allowed: false,
      status: isExpiredByDate ? SUBSCRIPTION_STATUSES.EXPIRED : status,
      plan: company.subscriptionPlan || null,
      renewalDate,
      reason: isExpiredByDate ? 'Subscription or trial has expired' : `Subscription is ${status}`,
    };
  }

  return {
    allowed: true,
    status,
    plan: company.subscriptionPlan || null,
    renewalDate,
    reason: null,
  };
}

function buildExpiredSubscriptionWhere(now = new Date()) {
  return {
    subscriptionStatus: {
      in: [
        SUBSCRIPTION_STATUSES.TRIAL,
        SUBSCRIPTION_STATUSES.ACTIVE,
        SUBSCRIPTION_STATUSES.PAST_DUE,
      ],
    },
    subscriptionRenewal: {
      lt: now,
    },
  };
}

async function expireDueSubscriptions(prisma, now = new Date()) {
  const where = buildExpiredSubscriptionWhere(now);
  const companies = await prisma.company.findMany({
    where,
    select: {
      id: true,
      name: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptionRenewal: true,
    },
  });

  if (companies.length === 0) {
    return { expiredCount: 0, companies: [] };
  }

  await prisma.company.updateMany({
    where,
    data: {
      subscriptionStatus: SUBSCRIPTION_STATUSES.EXPIRED,
    },
  });

  return {
    expiredCount: companies.length,
    companies: companies.map((company) => ({
      ...company,
      subscriptionStatus: SUBSCRIPTION_STATUSES.EXPIRED,
    })),
  };
}

module.exports = {
  DEFAULT_TRIAL_DAYS,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_PLANS,
  createTrialSubscriptionData,
  getSubscriptionState,
  normalizeSubscriptionPlan,
  normalizeSubscriptionStatus,
  buildExpiredSubscriptionWhere,
  expireDueSubscriptions,
};
