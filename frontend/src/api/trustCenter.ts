import { apiFetch } from "./http";

export type TrustCenterProfile = {
  id: string;
  companyId: string;
  slug: string;
  isPublished: boolean;
  headline?: string | null;
  overview?: string | null;
  contactEmail?: string | null;
  publishedSections: Record<string, boolean>;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type TrustCenterDocument = {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  evidenceId?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TrustCenterEvidenceOption = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  fileType?: string | null;
  createdAt: string;
};

export type PublicTrustCenter = {
  company: {
    name: string;
    sector?: string | null;
    country?: string | null;
  };
  profile: {
    slug: string;
    headline?: string | null;
    overview?: string | null;
    contactEmail?: string | null;
    publishedSections: Record<string, boolean>;
    updatedAt: string;
  };
  posture: {
    frameworks: string[];
    readinessScore: number;
    controlsTracked: number;
    evidenceCount: number;
    systemsTracked: number;
    vendorsTracked: number;
  };
  documents: TrustCenterDocument[];
};

export function getTrustCenter() {
  return apiFetch<{
    profile: TrustCenterProfile;
    documents: TrustCenterDocument[];
    evidence: TrustCenterEvidenceOption[];
    publicPreview: PublicTrustCenter;
  }>("/trust-center");
}

export function updateTrustCenterProfile(payload: Partial<Pick<TrustCenterProfile, "isPublished" | "slug" | "headline" | "overview" | "contactEmail" | "publishedSections">>) {
  return apiFetch<{ profile: TrustCenterProfile }>("/trust-center/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createTrustCenterDocument(payload: {
  title: string;
  category: string;
  description?: string | null;
  evidenceId?: string | null;
  isPublic: boolean;
}) {
  return apiFetch<{ document: TrustCenterDocument }>("/trust-center/documents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTrustCenterDocument(id: string, payload: Partial<TrustCenterDocument>) {
  return apiFetch<{ document: TrustCenterDocument }>(`/trust-center/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTrustCenterDocument(id: string) {
  return apiFetch<{ message: string }>(`/trust-center/documents/${id}`, {
    method: "DELETE",
  });
}

export function getPublicTrustCenter(slug: string) {
  return apiFetch<PublicTrustCenter>(`/trust-center/public/${slug}`);
}
