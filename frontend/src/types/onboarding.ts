import type { AuthUser } from "./auth";
// Type definitions for onboarding flow payloads.

export type ProductOption =
  | "COMPLIANCE_STARTER"
  | "NIS2"
  | "GDPR"
  | "DORA"
  | "AI_ACT";

export type SelectProductPayload = {
  product: ProductOption;
};

export type CompanyOnboardingPayload = {
  companyName: string;
  cvr: string;
  sector: string;
  country: string;
};

export type MeResponse = AuthUser | { user: AuthUser };
