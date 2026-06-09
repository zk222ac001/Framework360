import { apiFetch } from "./http";
import type { EvidenceCampaignResponse } from "../types/evidenceCampaigns";

export function getEvidenceCampaigns() {
  return apiFetch<EvidenceCampaignResponse>("/evidence-campaigns");
}

export function sendEvidenceCampaignReminder(requestId: string) {
  return apiFetch<{ message: string }>("/evidence-campaigns/remind", {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });
}
