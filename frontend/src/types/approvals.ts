export type ApprovalStatus = "PENDING" | "IN_REVIEW" | "APPROVED";
export type ApprovalDecision = "APPROVE" | "REQUEST_CHANGES" | "REVIEW";
export type ApprovalPriority = "LOW" | "MEDIUM" | "HIGH";

export type ApprovalItem = {
  id: string;
  title: string;
  description?: string | null;
  status: ApprovalStatus;
  taskStatus: string;
  priority: ApprovalPriority;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: string;
  reviewer: string;
  framework?: string | null;
  requirement?: string | null;
};

export type ApprovalSummary = {
  total: number;
  pending: number;
  inReview: number;
  approved: number;
  high: number;
};

export type ApprovalsResponse = {
  summary: ApprovalSummary;
  approvals: ApprovalItem[];
};
