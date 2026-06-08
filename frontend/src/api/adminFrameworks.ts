// Admin framework management API requests.
import { apiFetch } from "./http";
import type {
  AdminFrameworkDetail,
  AdminFrameworkSummary,
  FrameworkPayload,
  RequirementPayload,
  SectionPayload,
} from "../types/adminFramework";

// Retrieves all framework definitions for admin management.
export function getAdminFrameworks() {
  return apiFetch<AdminFrameworkSummary[]>("/admin/frameworks");
}

// Retrieves single framework details from loaded framework list.
export async function getAdminFramework(id: number) {
  const frameworks = await getAdminFrameworks();
  const match = frameworks.find((item) => item.id === id);
  if (!match) throw new Error("Framework not found");
  return match as AdminFrameworkDetail;
}

// Creates a new compliance framework.
export function createAdminFramework(payload: FrameworkPayload) {
  return apiFetch<AdminFrameworkSummary>("/admin/frameworks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Updates framework information.
export function updateAdminFramework(id: number, payload: FrameworkPayload) {
  return apiFetch<AdminFrameworkSummary>(`/admin/frameworks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Creates new section inside framework.
export function createAdminFrameworkSection(
  frameworkId: number,
  payload: SectionPayload,
) {
  return apiFetch(`/admin/frameworks/${frameworkId}/sections`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Updates framework section information.
export function updateAdminFrameworkSection(
  sectionId: number,
  payload: SectionPayload,
) {
  return apiFetch(`/admin/sections/${sectionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Creates new requirement inside framework section.
export function createAdminFrameworkRequirement(
  sectionId: number,
  payload: RequirementPayload,
) {
  return apiFetch(`/admin/sections/${sectionId}/requirements`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Updates framework requirement information.
export function updateAdminFrameworkRequirement(
  requirementId: number,
  payload: RequirementPayload,
) {
  return apiFetch(`/admin/requirements/${requirementId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Deletes framework requirement.
export function deleteAdminFrameworkRequirement(requirementId: number) {
  return apiFetch(`/admin/requirements/${requirementId}`, { method: "DELETE" });
}
