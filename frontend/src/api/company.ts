// Company management API requests.
import { apiFetch } from "./http";
import type { Company, UpdateCompanyPayload } from "../types/companyTypes";

// Fetches company information for the authenticated user.
export async function getMyCompany() {
  return apiFetch<Company>("/companies/me", {
    method: "GET",
  });
}

// Fetches all companies for platform administrators.
export async function getAllCompanies() {
  return apiFetch<Company[]>("/companies", {
    method: "GET",
  });
}

// Updates company details.
export async function updateMyCompany(payload: UpdateCompanyPayload) {
  return apiFetch<Company>("/companies/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
