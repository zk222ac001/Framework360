export type RecordId = string | number;

export type CopilotSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;

export type CopilotImplementationStatus = {
  aiPoweredAssistant: boolean;
  automaticControlMapping: boolean;
  securityGapAnalysis: boolean;
  policyGenerator: boolean;
  riskScoring: boolean;
  continuousMonitoring: boolean;
  affordablePricing: boolean;
};

export type CopilotAssetMapping = {
  id: RecordId;
  name: string;
  criticality?: string | null;
  reason: string;
};

export type CopilotControlMapping = {
  controlId: RecordId;
  framework: string;
  reference: string;
  title: string;
  description?: string | null;
  status: string;
  riskLevel: CopilotSeverity;
  focus: string;
  confidence: "LOW" | "MEDIUM" | "HIGH" | string;
  mappedAssets: {
    systems: CopilotAssetMapping[];
    vendors: CopilotAssetMapping[];
    businessProcesses: CopilotAssetMapping[];
  };
  evidenceCoverage: {
    status: "COVERED" | "MISSING" | string;
    evidenceCount: number;
  };
  suggestedEvidence: string[];
  nextAction: string;
};

export type CopilotGap = {
  id: string;
  source: "FRAMEWORK" | "SYSTEM" | "VENDOR" | string;
  sourceId: RecordId;
  sourceName: string;
  framework?: string;
  severity: CopilotSeverity;
  type: string;
  message: string;
  recommendation: string;
  missingEvidence: boolean;
};

export type CopilotRiskScoring = {
  score: number;
  label: CopilotSeverity;
  readinessScore: number;
  components: {
    controlReadiness: number;
    gapPressure: number;
    evidencePressure: number;
    monitoringPressure: number;
    vendorPressure: number;
  };
  drivers: Array<{
    label: string;
    value: number;
    impact: CopilotSeverity;
    description: string;
  }>;
};

export type CopilotMonitoring = {
  health: "STABLE" | "WATCH" | "ATTENTION" | string;
  totalSystems: number;
  monitoredSystems: number;
  monitoringCoverage: number;
  criticalSystems: number;
  criticalSystemsWithoutMonitoring: number;
  loggingCoverage: number;
  backupCoverage: number;
  mfaCoverage: number;
  alerts: CopilotGap[];
};

export type CopilotPolicyTemplate = {
  id: string;
  title: string;
  description: string;
  frameworks: string[];
  reviewCadence: string;
  evidenceChecklist: string[];
};

export type CopilotRecommendation = {
  title: string;
  priority: CopilotSeverity;
  description: string;
  action: string;
};

export type CopilotOverview = {
  generatedAt: string;
  company: {
    id: RecordId;
    name: string;
    sector?: string | null;
    country?: string | null;
  };
  implemented: CopilotImplementationStatus;
  assistantSummary: {
    message: string;
    activeFrameworks: number;
    controlsAnalyzed: number;
    assetsAnalyzed: number;
  };
  controlMappings: CopilotControlMapping[];
  securityGapAnalysis: {
    totalGaps: number;
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    gaps: CopilotGap[];
  };
  policyTemplates: CopilotPolicyTemplate[];
  riskScoring: CopilotRiskScoring;
  continuousMonitoring: CopilotMonitoring;
  recommendations: CopilotRecommendation[];
};

export type CopilotPolicyAudience = "BOARD" | "OPERATING" | "AUDIT";

export type GeneratePolicyPayload = {
  template: string;
  audience: CopilotPolicyAudience;
  includeCompanyContext: boolean;
};

export type GeneratedPolicy = {
  template: string;
  title: string;
  generatedAt: string;
  company: {
    id: RecordId;
    name: string;
  };
  audience: CopilotPolicyAudience;
  sections: Array<{
    heading: string;
    body: string;
  }>;
  controlsCovered: Array<{
    controlId: RecordId;
    reference: string;
    framework: string;
    title: string;
  }>;
  evidenceChecklist: string[];
  markdown: string;
  disclaimer: string;
};
