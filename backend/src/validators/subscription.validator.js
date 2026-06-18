const { z } = require('zod');
const {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
} = require('../services/subscription.service');

const subscriptionPlanSchema = z.enum(Object.values(SUBSCRIPTION_PLANS));
const subscriptionStatusSchema = z.enum(Object.values(SUBSCRIPTION_STATUSES));

const updateSubscriptionSchema = z.object({
  subscriptionPlan: subscriptionPlanSchema.optional(),
  subscriptionStatus: subscriptionStatusSchema.optional(),
  subscriptionRenewal: z.string().datetime().optional().nullable(),
}).strict();

const renewSubscriptionSchema = z.object({
  subscriptionPlan: subscriptionPlanSchema.default(SUBSCRIPTION_PLANS.PROFESSIONAL),
  months: z.number().int().min(1).max(36).default(1),
}).strict();

module.exports = {
  updateSubscriptionSchema,
  renewSubscriptionSchema,
};
