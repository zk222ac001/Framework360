// Evidence overview API requests.
import { apiFetch } from "./http";
import type { EvidenceFile } from "../types/framework";

// Supports multiple backend response shapes for evidence overview.
export type EvidenceOverviewResponse =
  | EvidenceFile[]
  | {
      evidence?: EvidenceFile[];
      items?: EvidenceFile[];
    };

// Retrieves uploaded evidence files across assessments.
export function getEvidenceOverview() {
  return apiFetch<EvidenceOverviewResponse>("/evidence");
}
