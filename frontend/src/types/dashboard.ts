// Type definitions for dashboard overview data.

export type DashboardFrameworkProgress = {
  assessmentId?: number;
  code: string;
  name: string;
  category?: string | null;
  description?: string | null;
  score: number;
  progressPercentage?: number;
  answeredCount?: number;
  totalCount?: number;
  gapsCount?: number;
  status: "IN_PROGRESS" | "COMPLETED";
  completedAt?: string | null;
};

export type DashboardTopAction = {
  framework: string;
  assessmentId: number;
  requirementId: number;
  section: string;
  title: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
  action: string;
  evidenceNeeded?: string | null;
  risk?: string | null;
  hasEvidence: boolean;
};

export type DashboardVendorRisk = {
  totalVendors: number;
  criticalVendors: Array<{
    id: number;
    name: string;
    category?: string | null;
    criticality: string;
    riskScore: number;
  }>;
  matrix: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
};

export type DashboardEvidenceAnalytics = {
  totalEvidence: number;
  missingEvidenceActions: number;
  recentUploads: Array<{
    id: number;
    filename: string;
    fileType: string;
    size: number;
    createdAt: string;
  }>;
};

export type DashboardActivityItem = {
  type: "ASSESSMENT_UPDATED" | "EVIDENCE_UPLOADED" | "TASK_ACTIVITY" | string;
  title: string;
  description?: string | null;
  createdAt: string;
};

export type DashboardAiRecommendation = {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
};

export type DashboardResponse = {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  company: {
    id?: number;
    name?: string;
    cvr?: string | null;
    sector?: string | null;
    country?: string | null;
  };
  overall?: {
    averageScore: number;
    totalFrameworks: number;
    completedFrameworks: number;
    totalGaps: number;
  };
  overallScore?: number;
  lawScore: number;
  certificateScore: number;
  frameworks: DashboardFrameworkProgress[];
  topActions?: DashboardTopAction[];
  vendorRisk?: DashboardVendorRisk;
  evidenceAnalytics?: DashboardEvidenceAnalytics;
  activity?: DashboardActivityItem[];
  aiRecommendations?: DashboardAiRecommendation[];
};
