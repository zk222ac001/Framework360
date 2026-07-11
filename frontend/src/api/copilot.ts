import { apiFetch } from "./http";
import type {
  CopilotOverview,
  GeneratedPolicy,
  GeneratePolicyPayload,
} from "../types/copilot";

export function getCopilotOverview() {
  return apiFetch<CopilotOverview>("/copilot/overview");
}

export function generatePolicy(payload: GeneratePolicyPayload) {
  return apiFetch<{ policy: GeneratedPolicy }>("/copilot/policies/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
