// Type definitions for company data and company update payloads.

export type CompanyFramework = {
  id: string;
  companyId: string;
  framework: string;
};

export type Company = {
  id: string;
  name: string;
  cvr?: string | null;
  sector?: string | null;
  country?: string | null;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
  subscriptionRenewal?: string | null;
  frameworks?: CompanyFramework[];
};

export type UpdateCompanyPayload = {
  name?: string;
  cvr?: string | null;
  sector?: string | null;
  country?: string | null;
};
