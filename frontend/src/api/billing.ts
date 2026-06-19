import { apiFetch } from "./http";
import type { SubscriptionPlan } from "./subscription";

export type CreateCheckoutSessionValues = {
  companyId: string;
  plan: Exclude<SubscriptionPlan, "TRIAL">;
};

export type CheckoutSessionResponse = {
  url: string;
};

export type CustomerPortalResponse = {
  url: string;
};

export async function createCheckoutSession(values: CreateCheckoutSessionValues) {
  return apiFetch<CheckoutSessionResponse>("/billing/checkout-session", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function createCustomerPortalSession(companyId: string) {
  return apiFetch<CustomerPortalResponse>("/billing/customer-portal", {
    method: "POST",
    body: JSON.stringify({ companyId }),
  });
}
