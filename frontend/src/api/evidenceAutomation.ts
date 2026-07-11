import { apiFetch } from "./http";

export type EvidenceCollectionRun = {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  message?: string | null;
  createdEvidenceCount: number;
  logs: Array<Record<string, unknown>>;
};

export type EvidenceCollectionJob = {
  id: string;
  name: string;
  provider: string;
  providerName: string;
  schedule: string;
  status: string;
  lastRunAt?: string | null;
  lastRunStatus?: string | null;
  nextRunAt?: string | null;
  config: Record<string, unknown>;
  connection?: {
    id: string;
    displayName: string;
    status: string;
  } | null;
  runs: EvidenceCollectionRun[];
  createdAt: string;
  updatedAt: string;
};

export type EvidenceCollectionJobPayload = {
  name: string;
  provider: string;
  schedule?: "MANUAL" | "DAILY" | "WEEKLY" | "MONTHLY";
  status?: "ACTIVE" | "PAUSED";
  config?: Record<string, unknown>;
};

export function getEvidenceJobs() {
  return apiFetch<{ jobs: EvidenceCollectionJob[] }>("/evidence-automation/jobs");
}

export function createEvidenceJob(payload: EvidenceCollectionJobPayload) {
  return apiFetch<{ job: EvidenceCollectionJob }>("/evidence-automation/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEvidenceJob(id: string, payload: Partial<EvidenceCollectionJobPayload>) {
  return apiFetch<{ job: EvidenceCollectionJob }>(`/evidence-automation/jobs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function runEvidenceJob(id: string) {
  return apiFetch<{ run: EvidenceCollectionRun; createdEvidence: Array<{ id: string; title: string }> }>(`/evidence-automation/jobs/${id}/run`, {
    method: "POST",
  });
}

export function deleteEvidenceJob(id: string) {
  return apiFetch<{ message: string }>(`/evidence-automation/jobs/${id}`, {
    method: "DELETE",
  });
}
