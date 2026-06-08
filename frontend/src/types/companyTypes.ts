// Type definitions for company data and company update payloads.

export type CompanyFramework = {
  id: number;
  companyId: number;
  framework: string;
};

export type Company = {
  id: number;
  name: string;
  cvr?: string | null;
  sector?: string | null;
  country?: string | null;
  frameworks?: CompanyFramework[];
};

export type UpdateCompanyPayload = {
  name?: string;
  cvr?: string | null;
  sector?: string | null;
  country?: string | null;
};
