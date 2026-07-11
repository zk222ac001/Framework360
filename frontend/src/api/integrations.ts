import { apiFetch } from "./http";

export type IntegrationConnection = {
  id: string;
  provider: string;
  displayName: string;
  status: string;
  authType: string;
  config: Record<string, unknown>;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncMessage?: string | null;
  evidenceJobs: Array<{
    id: string;
    name: string;
    status: string;
    schedule: string;
    lastRunAt?: string | null;
    lastRunStatus?: string | null;
  }>;
};

export type IntegrationProvider = {
  id: string;
  name: string;
  category: string;
  authType: string;
  evidenceTypes: string[];
  requiredFields: string[];
  connection: IntegrationConnection | null;
};

export function getIntegrations() {
  return apiFetch<{ providers: IntegrationProvider[] }>("/integrations");
}

export function saveIntegration(provider: string, payload: {
  displayName?: string;
  authType?: string;
  config?: Record<string, unknown>;
}) {
  return apiFetch<{ connection: IntegrationConnection }>(`/integrations/${provider}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function testIntegration(provider: string) {
  return apiFetch<{ ok: boolean; message: string; connection: IntegrationConnection }>(`/integrations/${provider}/test`, {
    method: "POST",
  });
}

export function disconnectIntegration(provider: string) {
  return apiFetch<{ connection: IntegrationConnection }>(`/integrations/${provider}/disconnect`, {
    method: "POST",
  });
}
