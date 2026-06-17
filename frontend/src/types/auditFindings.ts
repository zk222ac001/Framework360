export type AuditFindingStatus = "OPEN" | "IN_PROGRESS" | "DONE";
export type AuditFindingPriority = "LOW" | "MEDIUM" | "HIGH";

export type AuditFinding = {
  id: string;
  title: string;
  description?: string | null;
  status: AuditFindingStatus;
  priority: AuditFindingPriority;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: string;
  framework?: string | null;
  requirement?: string | null;
  reference?: string | null;
};

export type AuditFindingsSummary = {
  total: number;
  open: number;
  inProgress: number;
  done: number;
  high: number;
};

export type AuditFindingsResponse = {
  summary: AuditFindingsSummary;
  findings: AuditFinding[];
};

export type CreateAuditFindingInput = {
  title: string;
  description?: string;
  priority?: AuditFindingPriority;
  dueDate?: string;
};

export type UpdateAuditFindingInput = Partial<CreateAuditFindingInput> & {
  status?: AuditFindingStatus;
};
