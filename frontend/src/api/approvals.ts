import { apiFetch } from "./http";
import type { ApprovalDecision, ApprovalItem, ApprovalsResponse } from "../types/approvals";

export function getApprovals() {
  return apiFetch<ApprovalsResponse>("/approvals");
}

export function updateApproval(id: string, decision: ApprovalDecision, note?: string) {
  return apiFetch<ApprovalItem>(`/approvals/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ decision, note }),
  });
}
