import { apiFetch } from "./http";

export type AuditorOverview = {
  company: {
    id: string;
    name: string;
    sector?: string | null;
    country?: string | null;
  };
  summary: {
    readinessScore: number;
    controls: number;
    evidence: number;
    openFindings: number;
    publishedTrustCenter: boolean;
  };
  frameworks: Array<{
    id: string;
    framework: string;
    enabled: boolean;
    score: number;
    controls: number;
    evidence: number;
  }>;
  findings: Array<{
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate?: string | null;
    owner?: string | null;
    control?: {
      framework: string;
      reference: string;
      title: string;
    } | null;
  }>;
  trustCenter?: {
    slug: string;
    isPublished: boolean;
    documents: number;
  } | null;
};

export type AuditorEvidence = {
  id: string;
  title: string;
  description?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  status: string;
  createdAt: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  control?: {
    id: string;
    framework: string;
    reference: string;
    title: string;
    status: string;
  } | null;
};

export type AuditorAccessGrant = {
  id: string;
  email: string;
  name?: string | null;
  status: string;
  scope: Record<string, boolean>;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function getAuditorOverview() {
  return apiFetch<AuditorOverview>("/auditor-portal/overview");
}

export function getAuditorEvidence() {
  return apiFetch<{ evidence: AuditorEvidence[] }>("/auditor-portal/evidence");
}

export function getAuditorGrants() {
  return apiFetch<{ grants: AuditorAccessGrant[] }>("/auditor-portal/grants");
}

export function createAuditorGrant(payload: {
  email: string;
  name?: string | null;
  status?: "ACTIVE" | "PAUSED" | "EXPIRED";
  expiresAt?: string | null;
  scope?: Record<string, boolean>;
}) {
  return apiFetch<{ grant: AuditorAccessGrant }>("/auditor-portal/grants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAuditorGrant(id: string, payload: Partial<AuditorAccessGrant>) {
  return apiFetch<{ grant: AuditorAccessGrant }>(`/auditor-portal/grants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAuditorGrant(id: string) {
  return apiFetch<{ message: string }>(`/auditor-portal/grants/${id}`, {
    method: "DELETE",
  });
}
