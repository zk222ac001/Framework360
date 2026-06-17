// Onboarding related API requests.
import { apiFetch } from "./http";
import type { CompanyOnboardingPayload } from "../types/onboarding";
import type {
  CompanyScopeResponse,
  FrameworkRecommendationsResponse,
  SaveCompanyScopePayload,
  SaveCompanyScopeResponse,
} from "../types/framework";

// Updates company onboarding information.
export async function submitCompanyOnboarding(
  payload: CompanyOnboardingPayload,
) {
  return apiFetch("/companies/me", {
    method: "PATCH",
    body: JSON.stringify({
      name: payload.companyName,
      cvr: payload.cvr,
      sector: payload.sector || null,
      country: payload.country || null,
    }),
  });
}

// Retrieves recommended frameworks based on company sector.
export async function getRecommendedOnboardingFrameworks() {
  return apiFetch<FrameworkRecommendationsResponse>(
    "/onboarding/recommended-frameworks",
  );
}

// Fetches saved company scope configuration.
export async function getCompanyScope() {
  return apiFetch<CompanyScopeResponse>("/onboarding/scope");
}

// Creates initial company scope configuration.
export async function saveCompanyScope(payload: SaveCompanyScopePayload) {
  return apiFetch<SaveCompanyScopeResponse>("/onboarding/scope", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Updates existing company scope configuration.
export async function updateCompanyScope(payload: SaveCompanyScopePayload) {
  return apiFetch<SaveCompanyScopeResponse>("/onboarding/scope", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Submits selected onboarding frameworks and creates assessments.
export function submitOnboardingFrameworks(data: { frameworkCodes: string[] }) {
  return apiFetch("/onboarding/frameworks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
