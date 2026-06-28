import { apiFetch } from "./http";
import type { DemoRequestCompany } from "../types/demoRequest";

export type SubscriptionPlan = "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "EXPIRED"
  | "CANCELLED"
  | "SUSPENDED";

export type UpdateCompanySubscriptionValues = {
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionRenewal?: string | null;
};

export type CompanySubscriptionResponse = {
  subscription: DemoRequestCompany & {
    companyId: string;
    companyName: string;
    allowed: boolean;
    reason: string | null;
  };
};

export async function updateCompanySubscription(
  companyId: string,
  values: UpdateCompanySubscriptionValues,
) {
  return apiFetch<CompanySubscriptionResponse>(`/subscription/company/${companyId}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export async function getMySubscription() {
  return apiFetch<CompanySubscriptionResponse>("/subscription/me", {
    method: "GET",
  });
}
