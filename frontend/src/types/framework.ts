// Type definitions for frameworks, assessments, answers, evidence and onboarding scope.

// Supported compliance framework codes.
export type FrameworkCode =
  | "GDPR"
  | "NIS2"
  | "DORA"
  | "AI_ACT"
  | "CRA"
  | "DATA_ACT"
  | "EIDAS"
  | "CER"
  | "ISO27001"
  | "ISO27002"
  | "ISO27701"
  | "ISO22301"
  | "ISO42001"
  | "SOC2"
  | "CIS_CONTROLS"
  | "NIST_CSF"
  | "PCI_DSS"
  | "TISAX";

// Possible answer states for assessment requirements.
export type RequirementAnswerStatus =
  | "YES"
  | "PARTIAL"
  | "NO"
  | "NOT_APPLICABLE"
  | "UNANSWERED";

export type AssessmentStatus = "IN_PROGRESS" | "COMPLETED";

export type FrameworkDefinition = {
  id: number;
  code: FrameworkCode;
  name: string;
  description?: string | null;
  category?: string | null;
  recommended?: boolean;
};

// Evidence file metadata returned from backend.
export type EvidenceFile = {
  id: number;
  answerId?: number;

  filename?: string | null;
  originalName?: string | null;

  filePath?: string | null;
  fileType?: string | null;

  size?: number | null;
  description?: string | null;

  createdAt?: string | null;

  uploadedBy?: {
    id?: number;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;

  framework?: {
    code?: string;
    name?: string;
  } | null;

  section?: {
    id?: number;
    title?: string;
  } | null;

  requirement?: {
    id?: number;
    question?: string;
  } | null;

  assessment?: {
    id?: number;
    status?: string;
    score?: number;
  } | null;
};

export type RequirementAnswer = {
  id?: number;
  status: RequirementAnswerStatus;
  note?: string | null;
  evidence?: EvidenceFile[];
};

export type FrameworkRequirement = {
  id: number;
  question: string;
  description?: string | null;
  reference?: string | null;
  implementationGuide?: string | null;
  exampleEvidence?: string | null;
  riskIfMissing?: string | null;
  order: number;
  weight: number;
  answer?: RequirementAnswer | null;
};

export type FrameworkSection = {
  id: number;
  title: string;
  description?: string | null;
  order: number;
  weight: number;
  sectionScore?: number;
  requirements: FrameworkRequirement[];
};

export type FrameworkAssessment = {
  assessmentId: number;
  framework: FrameworkDefinition;
  status: AssessmentStatus;
  score: number;
  sections: FrameworkSection[];
};

export type SaveFrameworkAnswer = {
  requirementId: number;
  status: RequirementAnswerStatus;
  note?: string;
};

export type FrameworkAssessmentSummary = {
  assessmentId: number;
  framework?: FrameworkDefinition | FrameworkCode | string;
  status: AssessmentStatus;
  score: number;
};

export type CompleteFrameworkAssessmentResponse = FrameworkAssessmentSummary & {
  completedAt: string;
};

export type AssessmentGap = {
  requirementId?: number;
  sectionTitle?: string;
  question?: string;
  status?: RequirementAnswerStatus;
  reason?: string;
  missingEvidence?: boolean;
  riskIfMissing?: string | null;
};

export type GapsResponse = {
  totalGaps: number;
  gaps: AssessmentGap[];
};

export type ActionPlanItem = {
  id?: number | string;
  requirementId?: number;
  title?: string;
  question?: string;
  action?: string;
  implementationGuide?: string | null;
  risk?: string | null;
  riskIfMissing?: string | null;
  evidenceNeeded?: string | null;
  exampleEvidence?: string | null;
  priority?: "HIGH" | "MEDIUM" | "LOW" | string;
  status?: string;
};

// Supports multiple backend action plan response formats.
export type ActionPlanResponse = {
  totalActions?: number;
  highPriority?: ActionPlanItem[];
  mediumPriority?: ActionPlanItem[];
  lowPriority?: ActionPlanItem[];

  // fallback til gamle/andre formater
  actions?: ActionPlanItem[];
  actionPlan?: ActionPlanItem[];
  items?: ActionPlanItem[];
};

export type EmployeeCount =
  | "ONE_TO_NINE"
  | "TEN_TO_FORTY_NINE"
  | "FIFTY_TO_TWO_FORTY_NINE"
  | "TWO_FIFTY_PLUS"
  | "UNKNOWN";

export type CompanyScope = {
  id?: number;
  companyId?: number;
  employeeCount?: EmployeeCount | null;
  processesPersonalData?: boolean;
  handlesSensitiveData?: boolean;
  acceptsCardPayments?: boolean;
  usesAiSystems?: boolean;
  servesFinancialCustomers?: boolean;
  isDigitalServiceProvider?: boolean;
  operatesCriticalInfrastructure?: boolean;
  hasEuCustomers?: boolean;
  usesCloudProviders?: boolean;
  hasCriticalSuppliers?: boolean;
  completedAt?: string | null;
};

export type SaveCompanyScopePayload = {
  employeeCount?: EmployeeCount;
  processesPersonalData?: boolean;
  handlesSensitiveData?: boolean;
  acceptsCardPayments?: boolean;
  usesAiSystems?: boolean;
  servesFinancialCustomers?: boolean;
  isDigitalServiceProvider?: boolean;
  operatesCriticalInfrastructure?: boolean;
  hasEuCustomers?: boolean;
  usesCloudProviders?: boolean;
  hasCriticalSuppliers?: boolean;
};

// Framework recommendation enriched with sector and confidence metadata.
export type FrameworkRecommendation = FrameworkDefinition & {
  sectorCategory: "REQUIRED" | "RECOMMENDED" | "OTHER";
  requiredByLaw: boolean;
  recommended: boolean;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
};

export type FrameworkRecommendationsResponse = {
  sector: string | null;
  scopeCompleted: boolean;
  systemSignalsUsed: boolean;
  systemSignals: unknown;
  required: FrameworkRecommendation[];
  recommended: FrameworkRecommendation[];
  other: FrameworkRecommendation[];
};

export type CompanyScopeResponse = {
  scope: CompanyScope | null;
};

export type SaveCompanyScopeResponse = {
  message: string;
  scope: CompanyScope;
};
