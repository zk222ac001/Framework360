import type { UserRole } from "../types/auth";
import type {
  AssessmentStatus,
  FrameworkCode,
  RequirementAnswerStatus,
} from "../types/framework";
import type { DemoRequestStatus } from "../types/demoRequest";
import type { ProductOption } from "../types/onboarding";
// Shared formatting helpers for labels, names, roles and enum values.

// Normalizes email display.
export function formatEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

// Formats a single name part with capitalized letters.
function formatNamePart(value?: string | null) {
  if (!value) return "";

  return value
    .trim()
    .toLowerCase()
    .replace(/\b\p{L}/gu, (char) => char.toUpperCase());
}

// Builds full name with fallback when user name is missing.
export function formatFullName(first?: string | null, last?: string | null) {
  return (
    [formatNamePart(first), formatNamePart(last)].filter(Boolean).join(" ") ||
    "User"
  );
}

// Converts user role codes into readable labels.
export function formatRole(role?: UserRole | string | null) {
  const labels: Record<string, string> = {
    PLATFORM_ADMIN: "Platform admin",
    CUSTOMER_ADMIN: "Company admin",
    COMPLIANCE_MANAGER: "Compliance manager",
    EVIDENCE_CONTRIBUTOR: "Evidence contributor",
    AUDITOR: "Auditor",
  };

  return labels[role || ""] || formatEnumLabel(role);
}

export function formatDemoRequestStatus(
  status?: DemoRequestStatus | string | null,
) {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    EMAILED: "Email sent",
    ACTIVATED: "Activated",
    EXPIRED: "Expired",
    REJECTED: "Rejected",
  };

  return labels[status || ""] || formatEnumLabel(status);
}

export function formatAssessmentStatus(
  status?: AssessmentStatus | string | null,
) {
  const labels: Record<string, string> = {
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
  };

  return labels[status || ""] || formatEnumLabel(status);
}

export function formatAnswerStatus(
  status?: RequirementAnswerStatus | string | null,
) {
  const labels: Record<string, string> = {
    YES: "Yes",
    PARTIAL: "Partially compliant",
    NO: "Not compliant",
    NOT_APPLICABLE: "Not applicable",
    UNANSWERED: "Not answered",
  };

  return labels[status || ""] || formatEnumLabel(status);
}

export function formatPriority(priority?: string | null) {
  const labels: Record<string, string> = {
    HIGH: "High priority",
    MEDIUM: "Medium priority",
    LOW: "Low priority",
    ACTION: "Action",
  };

  return labels[priority || ""] || formatEnumLabel(priority);
}

export function formatProduct(product?: ProductOption | string | null) {
  const labels: Record<string, string> = {
    COMPLIANCE_STARTER: "Compliance Starter",
    NIS2: "NIS2",
    GDPR: "GDPR",
    DORA: "DORA",
    AI_ACT: "AI Act",
  };

  return labels[product || ""] || formatEnumLabel(product);
}

export function formatSector(sector?: string | null) {
  const labels: Record<string, string> = {
    FINANCE: "Finance",
    INSURANCE: "Insurance",
    BANKING: "Banking",
    HEALTHCARE: "Healthcare",
    PHARMA: "Pharma",
    UTILITIES: "Utilities",
    WATER: "Water",
    TRANSPORT: "Transport",
    LOGISTICS: "Logistics",
    IT: "IT",
    TELECOM: "Telecom",
    DIGITAL_INFRASTRUCTURE: "Digital infrastructure",
    CLOUD: "Cloud",
    PUBLIC: "Public sector",
    GOVERNMENT: "Government",
    MUNICIPAL: "Municipal",
    MANUFACTURING: "Manufacturing",
    INDUSTRIAL: "Industrial",
    RETAIL: "Retail",
    ECOMMERCE: "E-commerce",
    EDUCATION: "Education",
    MEDIA: "Media",
    FOOD: "Food",
    OTHER: "Other",
  };

  return labels[sector || ""] || formatEnumLabel(sector);
}

export function formatFrameworkCode(code?: FrameworkCode | string | null) {
  const labels: Record<string, string> = {
    AI_ACT: "AI Act",
    DATA_ACT: "Data Act",
    CIS_CONTROLS: "CIS Controls",
    NIST_CSF: "NIST CSF",
    D_MAERKET: "D-mærket",
  };

  return labels[code || ""] || code || "";
}

// Generic fallback formatter for enum-like strings.
export function formatEnumLabel(value?: string | null) {
  if (!value) return "";

  return value
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
