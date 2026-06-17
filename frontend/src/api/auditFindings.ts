import { apiFetch } from "./http";
import type { AuditFinding, AuditFindingsResponse, CreateAuditFindingInput, UpdateAuditFindingInput } from "../types/auditFindings";

export function getAuditFindings() {
  return apiFetch<AuditFindingsResponse>("/audit-findings");
}

export function createAuditFinding(input: CreateAuditFindingInput) {
  return apiFetch<AuditFinding>("/audit-findings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAuditFinding(id: string, input: UpdateAuditFindingInput) {
  return apiFetch<AuditFinding>(`/audit-findings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
