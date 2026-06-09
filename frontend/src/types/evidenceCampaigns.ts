export type EvidenceRequestStatus = "REQUESTED" | "COLLECTED";
export type EvidenceRequestPriority = "LOW" | "MEDIUM" | "HIGH";

export type EvidenceCampaignRequest = {
  id: string;
  answerId: number;
  title: string;
  framework: string;
  section: string;
  owner: string;
  status: EvidenceRequestStatus;
  priority: EvidenceRequestPriority;
  dueDate: string;
  suggestedEvidence: string;
};

export type EvidenceCampaignSummary = {
  total: number;
  requested: number;
  collected: number;
  overdue: number;
  high: number;
};

export type EvidenceCampaign = {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "COMPLETE";
  dueDate: string;
  summary: EvidenceCampaignSummary;
  requests: EvidenceCampaignRequest[];
};

export type EvidenceCampaignResponse = {
  campaigns: EvidenceCampaign[];
};
