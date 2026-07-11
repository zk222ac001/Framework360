const express = require('express');
const { z } = require('zod');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { getCompanyId } = require('../utils/systemRegisterAccess');

const router = express.Router();

const POLICY_TEMPLATES = [
  {
    id: 'information-security',
    title: 'Information Security Policy',
    description: 'Baseline governance, risk, access, monitoring, and evidence expectations.',
    frameworks: ['ISO27001', 'NIS2', 'DORA'],
    reviewCadence: 'Quarterly owner review and annual management approval',
    evidenceChecklist: [
      'Approved policy document',
      'Security roles and ownership register',
      'Risk treatment plan',
      'Evidence of management review',
    ],
  },
  {
    id: 'access-control',
    title: 'Access Control Policy',
    description: 'Identity, MFA, privileged access, joiner-mover-leaver, and periodic access reviews.',
    frameworks: ['ISO27001', 'NIS2', 'GDPR'],
    reviewCadence: 'Monthly privileged access review and quarterly user access review',
    evidenceChecklist: [
      'MFA configuration export',
      'Access review record',
      'Privileged account inventory',
      'Joiner-mover-leaver sample',
    ],
  },
  {
    id: 'incident-response',
    title: 'Incident Response Policy',
    description: 'Preparation, detection, escalation, communication, and post-incident review.',
    frameworks: ['NIS2', 'DORA', 'ISO27001'],
    reviewCadence: 'Semi-annual tabletop exercise and post-incident review after every major event',
    evidenceChecklist: [
      'Incident response plan',
      'Escalation contact list',
      'Tabletop exercise record',
      'Incident register and lessons learned',
    ],
  },
  {
    id: 'vendor-management',
    title: 'Vendor Management Policy',
    description: 'Supplier due diligence, contracts, DPAs, SLAs, security reviews, and review cadence.',
    frameworks: ['NIS2', 'DORA', 'GDPR', 'ISO27001'],
    reviewCadence: 'Annual review for standard vendors and semi-annual review for critical suppliers',
    evidenceChecklist: [
      'Vendor inventory',
      'Signed DPA or data processing terms',
      'SLA or service commitment',
      'Security review or due diligence record',
    ],
  },
  {
    id: 'business-continuity',
    title: 'Business Continuity Policy',
    description: 'Critical services, backup, RTO/RPO, continuity testing, and manual workarounds.',
    frameworks: ['DORA', 'NIS2', 'ISO22301', 'ISO27001'],
    reviewCadence: 'Annual continuity test and quarterly review of critical RTO/RPO assumptions',
    evidenceChecklist: [
      'Business impact analysis',
      'Backup configuration evidence',
      'RTO/RPO register',
      'Continuity exercise report',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy and Data Protection Policy',
    description: 'Personal data handling, lawful processing, retention, subject rights, and DPIA triggers.',
    frameworks: ['GDPR', 'ISO27001'],
    reviewCadence: 'Annual privacy review and ad hoc review for new high-risk processing',
    evidenceChecklist: [
      'Processing activity register',
      'Privacy notice',
      'DPIA records where applicable',
      'Data retention and deletion evidence',
    ],
  },
];

const policyGenerationSchema = z.object({
  template: z.enum(POLICY_TEMPLATES.map((template) => template.id)),
  audience: z.enum(['BOARD', 'OPERATING', 'AUDIT']).default('OPERATING'),
  includeCompanyContext: z.boolean().default(true),
}).strict();

router.use(requireAuth);

router.get('/overview', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const company = await loadCompanyContext(companyId);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const overview = buildCopilotOverview(company);

    return res.json(overview);
  } catch (error) {
    console.error('GET /copilot/overview error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/policies/generate', validate(policyGenerationSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const company = await loadCompanyContext(companyId);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const overview = buildCopilotOverview(company);
    const policy = generatePolicy(company, overview, req.body);

    return res.json({ policy });
  } catch (error) {
    console.error('POST /copilot/policies/generate error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

function loadCompanyContext(companyId) {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      frameworks: true,
      users: {
        select: {
          id: true,
        },
      },
      controls: {
        include: {
          evidence: true,
          tasks: true,
        },
      },
      evidence: true,
      systems: {
        include: {
          vendor: true,
        },
      },
      vendors: true,
      businessProcesses: true,
      dependencies: true,
      scope: true,
    },
  });
}

function buildCopilotOverview(company) {
  const controlMappings = buildControlMappings(company);
  const securityGapAnalysis = buildSecurityGapAnalysis(company);
  const continuousMonitoring = buildContinuousMonitoring(company);
  const riskScoring = buildRiskScoring(company, securityGapAnalysis, continuousMonitoring);
  const recommendations = buildRecommendations(
    controlMappings,
    securityGapAnalysis,
    riskScoring,
    continuousMonitoring
  );

  return {
    generatedAt: new Date().toISOString(),
    company: {
      id: company.id,
      name: company.name,
      sector: company.sector || null,
      country: company.country || null,
    },
    implemented: {
      aiPoweredAssistant: true,
      automaticControlMapping: true,
      securityGapAnalysis: true,
      policyGenerator: true,
      riskScoring: true,
      continuousMonitoring: true,
      affordablePricing: true,
    },
    assistantSummary: {
      message: buildAssistantSummary(company, securityGapAnalysis, riskScoring, continuousMonitoring),
      activeFrameworks: (company.frameworks || []).filter((item) => item.enabled !== false).length,
      controlsAnalyzed: (company.controls || []).length,
      assetsAnalyzed:
        (company.systems || []).length +
        (company.vendors || []).length +
        (company.businessProcesses || []).length,
    },
    controlMappings,
    securityGapAnalysis,
    policyTemplates: POLICY_TEMPLATES,
    riskScoring,
    continuousMonitoring,
    recommendations,
  };
}

function buildAssistantSummary(company, gapAnalysis, riskScoring, monitoring) {
  const companyName = company.name || 'this company';
  const highGaps = gapAnalysis.summary.high + gapAnalysis.summary.critical;

  if (highGaps > 0) {
    return `${companyName} has ${highGaps} high-impact compliance or security gaps. Focus on the top monitoring, evidence, and ownership gaps first.`;
  }

  if (monitoring.health !== 'STABLE') {
    return `${companyName} is mostly structured, but monitoring coverage still needs attention before the next review.`;
  }

  return `${companyName} is in a ${riskScoring.label.toLowerCase()} risk posture. Keep evidence fresh and maintain the monitoring cadence.`;
}

function buildControlMappings(company) {
  const controls = company.controls || [];

  return controls
    .map((control) => {
      const focus = inferControlFocus(control);
      const mappedAssets = mapAssetsForControl(focus, company);
      const evidenceCount = control.evidence?.length || 0;
      const mappedCount =
        mappedAssets.systems.length +
        mappedAssets.vendors.length +
        mappedAssets.businessProcesses.length;

      return {
        controlId: control.id,
        framework: control.framework,
        reference: control.controlId,
        title: control.title,
        description: control.description || null,
        status: control.status,
        riskLevel: control.riskLevel || 'MEDIUM',
        focus,
        confidence: mappedCount >= 3 ? 'HIGH' : mappedCount > 0 ? 'MEDIUM' : 'LOW',
        mappedAssets,
        evidenceCoverage: {
          status: evidenceCount > 0 ? 'COVERED' : 'MISSING',
          evidenceCount,
        },
        suggestedEvidence: getSuggestedEvidence(focus),
        nextAction: getControlNextAction(control, focus, mappedCount, evidenceCount),
      };
    })
    .sort((a, b) => {
      const riskDiff = getSeverityWeight(b.riskLevel) - getSeverityWeight(a.riskLevel);
      if (riskDiff !== 0) return riskDiff;
      return getConfidenceWeight(b.confidence) - getConfidenceWeight(a.confidence);
    });
}

function inferControlFocus(control) {
  const text = `${control.framework} ${control.controlId} ${control.title} ${control.description || ''}`.toLowerCase();

  if (containsAny(text, ['access', 'mfa', 'identity', 'privileged', 'password', 'authentication'])) {
    return 'ACCESS_CONTROL';
  }

  if (containsAny(text, ['incident', 'logging', 'log ', 'monitoring', 'detect', 'alert', 'audit trail'])) {
    return 'MONITORING_AND_RESPONSE';
  }

  if (containsAny(text, ['backup', 'continuity', 'rto', 'rpo', 'resilience', 'recovery', 'dora'])) {
    return 'BUSINESS_CONTINUITY';
  }

  if (containsAny(text, ['vendor', 'supplier', 'third party', 'third-party', 'dpa', 'sla', 'processor'])) {
    return 'VENDOR_RISK';
  }

  if (containsAny(text, ['privacy', 'personal data', 'sensitive data', 'gdpr', 'data protection'])) {
    return 'PRIVACY_AND_DATA';
  }

  if (containsAny(text, ['evidence', 'audit', 'proof', 'record'])) {
    return 'EVIDENCE_MANAGEMENT';
  }

  if (containsAny(text, ['governance', 'ownership', 'owner', 'responsibility', 'policy'])) {
    return 'GOVERNANCE';
  }

  if (containsAny(text, ['review', 'periodic', 'cadence'])) {
    return 'PERIODIC_REVIEW';
  }

  if (containsAny(text, ['risk', 'treatment', 'assessment'])) {
    return 'RISK_MANAGEMENT';
  }

  return 'GENERAL_COMPLIANCE';
}

function containsAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function mapAssetsForControl(focus, company) {
  const systems = (company.systems || [])
    .filter((system) => shouldMapSystem(focus, system))
    .map((system) => ({
      id: system.id,
      name: system.name,
      criticality: system.criticality,
      reason: getSystemMappingReason(focus, system),
    }))
    .slice(0, 6);

  const vendors = (company.vendors || [])
    .filter((vendor) => shouldMapVendor(focus, vendor))
    .map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      criticality: vendor.criticality,
      reason: getVendorMappingReason(focus, vendor),
    }))
    .slice(0, 6);

  const businessProcesses = (company.businessProcesses || [])
    .filter((process) => shouldMapProcess(focus, process))
    .map((process) => ({
      id: process.id,
      name: process.name,
      criticality: process.criticality,
      reason: getProcessMappingReason(focus, process),
    }))
    .slice(0, 6);

  return {
    systems,
    vendors,
    businessProcesses,
  };
}

function shouldMapSystem(focus, system) {
  switch (focus) {
    case 'ACCESS_CONTROL':
      return system.internetExposed || system.containsSensitiveData || system.containsPersonalData || !system.mfaEnabled;
    case 'MONITORING_AND_RESPONSE':
      return system.criticality === 'CRITICAL' || !system.loggingEnabled || !system.monitoringEnabled;
    case 'BUSINESS_CONTINUITY':
      return system.criticality === 'CRITICAL' || !system.backupEnabled || system.rtoMinutes === null || system.rpoMinutes === null;
    case 'PRIVACY_AND_DATA':
      return system.containsPersonalData || system.containsSensitiveData;
    case 'GOVERNANCE':
      return !system.ownerUserId && !system.ownerDepartment;
    case 'PERIODIC_REVIEW':
      return system.criticality === 'CRITICAL' || system.criticality === 'HIGH';
    case 'RISK_MANAGEMENT':
    case 'EVIDENCE_MANAGEMENT':
    case 'GENERAL_COMPLIANCE':
    default:
      return system.criticality === 'CRITICAL' || system.criticality === 'HIGH' || system.internetExposed;
  }
}

function shouldMapVendor(focus, vendor) {
  const isCritical = vendor.criticality === 'CRITICAL' || vendor.isCriticalSupplier;

  switch (focus) {
    case 'VENDOR_RISK':
      return isCritical || !vendor.hasDpa || !vendor.hasSla || !vendor.hasSecurityReview;
    case 'PRIVACY_AND_DATA':
      return !vendor.hasDpa || isCritical;
    case 'BUSINESS_CONTINUITY':
      return isCritical || !vendor.hasSla;
    case 'GOVERNANCE':
      return !vendor.owner && isCritical;
    case 'PERIODIC_REVIEW':
      return isCritical || isOverdue(vendor.reviewDate);
    case 'RISK_MANAGEMENT':
    case 'EVIDENCE_MANAGEMENT':
    case 'GENERAL_COMPLIANCE':
    default:
      return isCritical || vendor.criticality === 'HIGH';
  }
}

function shouldMapProcess(focus, process) {
  const isImportant = process.criticality === 'CRITICAL' || process.criticality === 'HIGH';

  switch (focus) {
    case 'BUSINESS_CONTINUITY':
      return isImportant || !process.manualWorkaroundAvailable || process.maxTolerableDowntimeMinutes === null;
    case 'GOVERNANCE':
      return !process.ownerDepartment && isImportant;
    case 'PERIODIC_REVIEW':
    case 'RISK_MANAGEMENT':
    case 'EVIDENCE_MANAGEMENT':
    case 'GENERAL_COMPLIANCE':
    default:
      return isImportant;
  }
}

function getSystemMappingReason(focus, system) {
  if (focus === 'ACCESS_CONTROL') {
    if (system.internetExposed && !system.mfaEnabled) return 'Internet-exposed system without MFA.';
    if (!system.mfaEnabled) return 'MFA evidence is missing or disabled.';
    return 'Sensitive or personal data requires access control coverage.';
  }

  if (focus === 'MONITORING_AND_RESPONSE') {
    if (!system.monitoringEnabled) return 'Continuous monitoring is not enabled.';
    if (!system.loggingEnabled) return 'Logging is not enabled.';
    return 'Critical system should be monitored for incidents.';
  }

  if (focus === 'BUSINESS_CONTINUITY') {
    if (!system.backupEnabled) return 'Backup control is missing.';
    if (system.rtoMinutes === null || system.rpoMinutes === null) return 'RTO or RPO is not documented.';
    return 'Critical service needs continuity coverage.';
  }

  if (focus === 'PRIVACY_AND_DATA') return 'System stores personal or sensitive data.';
  if (focus === 'GOVERNANCE') return 'System owner is not assigned.';
  return 'High-impact asset should be linked to this control.';
}

function getVendorMappingReason(focus, vendor) {
  if (focus === 'VENDOR_RISK') {
    if (!vendor.hasDpa) return 'DPA evidence is missing.';
    if (!vendor.hasSla) return 'SLA evidence is missing.';
    if (!vendor.hasSecurityReview) return 'Security review is missing.';
    return 'Critical supplier requires due diligence coverage.';
  }

  if (focus === 'PRIVACY_AND_DATA') return 'Vendor needs data protection evidence.';
  if (focus === 'BUSINESS_CONTINUITY') return 'Vendor continuity dependency needs SLA or resilience evidence.';
  if (focus === 'PERIODIC_REVIEW' && isOverdue(vendor.reviewDate)) return 'Vendor review date is overdue.';
  return 'High-impact vendor should be linked to this control.';
}

function getProcessMappingReason(focus, process) {
  if (focus === 'BUSINESS_CONTINUITY') {
    if (!process.manualWorkaroundAvailable) return 'Manual workaround is not documented.';
    if (process.maxTolerableDowntimeMinutes === null) return 'Maximum tolerable downtime is not documented.';
    return 'Critical process requires continuity coverage.';
  }

  if (focus === 'GOVERNANCE') return 'Process owner is not assigned.';
  return 'Critical process should be covered by this control.';
}

function getSuggestedEvidence(focus) {
  switch (focus) {
    case 'ACCESS_CONTROL':
      return ['MFA export', 'Access review record', 'Privileged account list'];
    case 'MONITORING_AND_RESPONSE':
      return ['Logging configuration', 'Monitoring alert rule', 'Incident response test'];
    case 'BUSINESS_CONTINUITY':
      return ['Backup report', 'RTO/RPO register', 'Continuity test record'];
    case 'VENDOR_RISK':
      return ['DPA', 'SLA', 'Security review', 'Vendor risk assessment'];
    case 'PRIVACY_AND_DATA':
      return ['Processing register', 'DPIA', 'Privacy notice', 'Retention schedule'];
    case 'GOVERNANCE':
      return ['Policy approval', 'Owner register', 'Management review minutes'];
    case 'EVIDENCE_MANAGEMENT':
      return ['Evidence index', 'Upload history', 'Approval record'];
    default:
      return ['Policy', 'Procedure', 'Screenshot', 'System export', 'Owner attestation'];
  }
}

function getControlNextAction(control, focus, mappedCount, evidenceCount) {
  if (control.status === 'IMPLEMENTED' && evidenceCount > 0) {
    return 'Keep the evidence current during the next scheduled review.';
  }

  if (evidenceCount === 0) {
    return `Collect ${getSuggestedEvidence(focus)[0].toLowerCase()} and attach it to this control.`;
  }

  if (mappedCount === 0) {
    return 'Register related systems, vendors, or processes so the control can be mapped automatically.';
  }

  return 'Assign an owner, confirm implementation, and move the remediation task through review.';
}

function buildSecurityGapAnalysis(company) {
  const gaps = [
    ...buildFrameworkGaps(company.controls || []),
    ...buildSystemSecurityGaps(company.systems || []),
    ...buildVendorGaps(company.vendors || []),
    ...buildContinuityGaps(company.systems || [], company.vendors || []),
  ];
  const deduped = dedupeGaps(gaps)
    .sort((a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity));

  return {
    totalGaps: deduped.length,
    summary: {
      critical: deduped.filter((gap) => gap.severity === 'CRITICAL').length,
      high: deduped.filter((gap) => gap.severity === 'HIGH').length,
      medium: deduped.filter((gap) => gap.severity === 'MEDIUM').length,
      low: deduped.filter((gap) => gap.severity === 'LOW').length,
    },
    gaps: deduped.slice(0, 60),
  };
}

function buildFrameworkGaps(controls) {
  return controls
    .filter((control) => control.status !== 'IMPLEMENTED' && control.status !== 'NOT_APPLICABLE')
    .map((control) => ({
      id: `control-${control.id}`,
      source: 'FRAMEWORK',
      sourceId: control.id,
      sourceName: control.title,
      framework: control.framework,
      severity: control.riskLevel || 'MEDIUM',
      type: 'OPEN_CONTROL',
      message: `${control.framework} control "${control.title}" is not fully implemented.`,
      recommendation: control.description || 'Document, implement, and verify this control.',
      missingEvidence: !control.evidence?.length,
    }));
}

function buildSystemSecurityGaps(systems) {
  const gaps = [];

  for (const system of systems) {
    if (system.internetExposed && !system.mfaEnabled) {
      gaps.push(systemGap(system, 'HIGH', 'MISSING_MFA', 'Internet-exposed system does not have MFA enabled.'));
    }

    if (system.criticality === 'CRITICAL' && !system.loggingEnabled) {
      gaps.push(systemGap(system, 'HIGH', 'MISSING_LOGGING', 'Critical system does not have logging enabled.'));
    }

    if (system.criticality === 'CRITICAL' && !system.monitoringEnabled) {
      gaps.push(systemGap(system, 'HIGH', 'MISSING_MONITORING', 'Critical system does not have monitoring enabled.'));
    }

    if (system.containsPersonalData && !system.backupEnabled) {
      gaps.push(systemGap(system, 'MEDIUM', 'MISSING_BACKUP', 'System contains personal data but does not have backup enabled.'));
    }

    if (!system.ownerUserId && !system.ownerDepartment) {
      gaps.push(systemGap(system, 'MEDIUM', 'MISSING_OWNER', 'System has no owner user or owner department.'));
    }
  }

  return gaps;
}

function buildVendorGaps(vendors) {
  const gaps = [];

  for (const vendor of vendors) {
    const isCritical = vendor.criticality === 'CRITICAL' || vendor.isCriticalSupplier;

    if (isCritical && !vendor.hasDpa) {
      gaps.push(vendorGap(vendor, 'HIGH', 'MISSING_DPA', 'Critical vendor is missing DPA.'));
    }

    if (isCritical && !vendor.hasSla) {
      gaps.push(vendorGap(vendor, 'HIGH', 'MISSING_SLA', 'Critical vendor is missing SLA.'));
    }

    if (isCritical && !vendor.hasSecurityReview) {
      gaps.push(vendorGap(vendor, 'HIGH', 'MISSING_SECURITY_REVIEW', 'Critical vendor is missing security review.'));
    }

    if (isOverdue(vendor.reviewDate)) {
      gaps.push(vendorGap(vendor, 'MEDIUM', 'OVERDUE_REVIEW', 'Vendor review date is overdue.'));
    }
  }

  return gaps;
}

function buildContinuityGaps(systems, vendors) {
  const gaps = [];

  for (const system of systems) {
    if (system.criticality !== 'CRITICAL') continue;

    if (system.rtoMinutes === null) {
      gaps.push(systemGap(system, 'HIGH', 'MISSING_RTO', 'Critical system is missing RTO.'));
    }

    if (system.rpoMinutes === null) {
      gaps.push(systemGap(system, 'HIGH', 'MISSING_RPO', 'Critical system is missing RPO.'));
    }

    if (!system.backupEnabled) {
      gaps.push(systemGap(system, 'HIGH', 'MISSING_BACKUP', 'Critical system does not have backup enabled.'));
    }
  }

  for (const vendor of vendors) {
    if ((vendor.criticality === 'CRITICAL' || vendor.isCriticalSupplier) && !vendor.hasSla) {
      gaps.push(vendorGap(vendor, 'HIGH', 'MISSING_SLA', 'Critical vendor is missing SLA.'));
    }
  }

  return gaps;
}

function systemGap(system, severity, type, message) {
  return {
    id: `system-${system.id}-${type}`,
    source: 'SYSTEM',
    sourceId: system.id,
    sourceName: system.name,
    severity,
    type,
    message,
    recommendation: getGapRecommendation(type),
    missingEvidence: true,
  };
}

function vendorGap(vendor, severity, type, message) {
  return {
    id: `vendor-${vendor.id}-${type}`,
    source: 'VENDOR',
    sourceId: vendor.id,
    sourceName: vendor.name,
    severity,
    type,
    message,
    recommendation: getGapRecommendation(type),
    missingEvidence: true,
  };
}

function getGapRecommendation(type) {
  const recommendations = {
    OPEN_CONTROL: 'Assign an owner, implement the control, and attach supporting evidence.',
    MISSING_MFA: 'Enable MFA and attach configuration evidence.',
    MISSING_LOGGING: 'Enable central logging and attach the logging configuration.',
    MISSING_MONITORING: 'Enable monitoring and alerting for the critical system.',
    MISSING_BACKUP: 'Enable backups and attach the latest backup job report.',
    MISSING_OWNER: 'Assign a business or technical owner.',
    MISSING_DPA: 'Collect and upload the signed DPA.',
    MISSING_SLA: 'Collect and upload SLA or service commitment evidence.',
    MISSING_SECURITY_REVIEW: 'Complete supplier security review and attach the record.',
    OVERDUE_REVIEW: 'Schedule a review and update the review date.',
    MISSING_RTO: 'Define and approve RTO.',
    MISSING_RPO: 'Define and approve RPO.',
  };

  return recommendations[type] || 'Review the gap and add remediation evidence.';
}

function dedupeGaps(gaps) {
  const seen = new Set();

  return gaps.filter((gap) => {
    const key = `${gap.source}-${gap.sourceId}-${gap.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildContinuousMonitoring(company) {
  const systems = company.systems || [];
  const vendors = company.vendors || [];
  const criticalSystems = systems.filter((system) => system.criticality === 'CRITICAL');
  const monitoredSystems = systems.filter((system) => system.monitoringEnabled);
  const loggingSystems = systems.filter((system) => system.loggingEnabled);
  const backedUpSystems = systems.filter((system) => system.backupEnabled);
  const mfaSystems = systems.filter((system) => system.mfaEnabled);
  const criticalWithoutMonitoring = criticalSystems.filter((system) => !system.monitoringEnabled);
  const alerts = [
    ...buildSystemSecurityGaps(systems),
    ...buildVendorGaps(vendors),
  ]
    .filter((gap) => ['HIGH', 'CRITICAL', 'MEDIUM'].includes(gap.severity))
    .sort((a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity))
    .slice(0, 20);

  const highAlerts = alerts.filter((alert) => alert.severity === 'HIGH' || alert.severity === 'CRITICAL').length;

  return {
    health: highAlerts > 0 ? 'ATTENTION' : alerts.length > 0 ? 'WATCH' : 'STABLE',
    totalSystems: systems.length,
    monitoredSystems: monitoredSystems.length,
    monitoringCoverage: percent(monitoredSystems.length, systems.length),
    criticalSystems: criticalSystems.length,
    criticalSystemsWithoutMonitoring: criticalWithoutMonitoring.length,
    loggingCoverage: percent(loggingSystems.length, systems.length),
    backupCoverage: percent(backedUpSystems.length, systems.length),
    mfaCoverage: percent(mfaSystems.length, systems.length),
    alerts,
  };
}

function buildRiskScoring(company, gapAnalysis, monitoring) {
  const controls = company.controls || [];
  const vendors = company.vendors || [];
  const evidence = company.evidence || [];
  const controlReadiness = percent(
    controls.filter((control) => control.status === 'IMPLEMENTED' || control.status === 'NOT_APPLICABLE').length,
    controls.length
  );
  const missingEvidenceControls = controls.filter((control) => !control.evidence?.length).length;
  const criticalVendors = vendors.filter((vendor) => vendor.criticality === 'CRITICAL' || vendor.isCriticalSupplier).length;

  const gapPressure =
    gapAnalysis.summary.critical * 18 +
    gapAnalysis.summary.high * 12 +
    gapAnalysis.summary.medium * 6 +
    gapAnalysis.summary.low * 3;
  const readinessPressure = Math.round((100 - controlReadiness) * 0.35);
  const evidencePressure = Math.min(18, missingEvidenceControls * 3 + (evidence.length === 0 && controls.length ? 6 : 0));
  const monitoringPressure = Math.min(20, monitoring.criticalSystemsWithoutMonitoring * 8);
  const vendorPressure = Math.min(14, criticalVendors * 3);
  const score = clamp(
    Math.round(
      Math.min(45, gapPressure) +
      readinessPressure +
      evidencePressure +
      monitoringPressure +
      vendorPressure
    ),
    0,
    100
  );

  return {
    score,
    label: getRiskLabel(score),
    readinessScore: 100 - score,
    components: {
      controlReadiness,
      gapPressure: Math.min(45, gapPressure),
      evidencePressure,
      monitoringPressure,
      vendorPressure,
    },
    drivers: buildRiskDrivers(gapAnalysis, monitoring, missingEvidenceControls, criticalVendors),
  };
}

function buildRiskDrivers(gapAnalysis, monitoring, missingEvidenceControls, criticalVendors) {
  const drivers = [];
  const highGaps = gapAnalysis.summary.critical + gapAnalysis.summary.high;

  if (highGaps > 0) {
    drivers.push({
      label: 'High-impact gaps',
      value: highGaps,
      impact: 'HIGH',
      description: 'Open critical or high severity gaps increase audit and security exposure.',
    });
  }

  if (monitoring.criticalSystemsWithoutMonitoring > 0) {
    drivers.push({
      label: 'Critical systems without monitoring',
      value: monitoring.criticalSystemsWithoutMonitoring,
      impact: 'HIGH',
      description: 'Critical assets need active monitoring for detection and response.',
    });
  }

  if (missingEvidenceControls > 0) {
    drivers.push({
      label: 'Controls missing evidence',
      value: missingEvidenceControls,
      impact: 'MEDIUM',
      description: 'Evidence gaps reduce audit readiness even when controls are in progress.',
    });
  }

  if (criticalVendors > 0) {
    drivers.push({
      label: 'Critical vendors',
      value: criticalVendors,
      impact: 'MEDIUM',
      description: 'Critical suppliers should have DPA, SLA, and security review evidence.',
    });
  }

  if (!drivers.length) {
    drivers.push({
      label: 'No major exposure drivers',
      value: 0,
      impact: 'LOW',
      description: 'No high-impact gaps were detected in the current workspace data.',
    });
  }

  return drivers;
}

function buildRecommendations(controlMappings, gapAnalysis, riskScoring, monitoring) {
  const recommendations = [];
  const missingEvidence = controlMappings.filter((mapping) => mapping.evidenceCoverage.status === 'MISSING');
  const highGap = gapAnalysis.gaps.find((gap) => gap.severity === 'CRITICAL' || gap.severity === 'HIGH');

  if (highGap) {
    recommendations.push({
      title: `Fix ${formatEnum(highGap.type)}`,
      priority: highGap.severity,
      description: highGap.message,
      action: highGap.recommendation,
    });
  }

  if (monitoring.criticalSystemsWithoutMonitoring > 0) {
    recommendations.push({
      title: 'Enable critical monitoring',
      priority: 'HIGH',
      description: `${monitoring.criticalSystemsWithoutMonitoring} critical systems are not continuously monitored.`,
      action: 'Turn on monitoring and attach alerting evidence.',
    });
  }

  if (missingEvidence.length > 0) {
    recommendations.push({
      title: 'Close evidence gaps',
      priority: 'MEDIUM',
      description: `${missingEvidence.length} controls are missing linked evidence.`,
      action: `Start with ${missingEvidence[0].title}.`,
    });
  }

  if (riskScoring.score >= 50) {
    recommendations.push({
      title: 'Reduce risk score',
      priority: riskScoring.label,
      description: `Current risk exposure is ${riskScoring.score}/100.`,
      action: 'Resolve high-impact gaps before lower-priority documentation cleanup.',
    });
  }

  return recommendations.slice(0, 6);
}

function generatePolicy(company, overview, payload) {
  const template = POLICY_TEMPLATES.find((item) => item.id === payload.template);
  const companyName = company.name || 'the company';
  const frameworks = (company.frameworks || [])
    .filter((framework) => framework.enabled !== false)
    .map((framework) => framework.framework);
  const selectedFrameworks = frameworks.length ? frameworks.join(', ') : 'the selected compliance frameworks';
  const mappedControls = overview.controlMappings
    .filter((mapping) => template.frameworks.includes(mapping.framework) || mapping.focus === templateFocus(template.id))
    .slice(0, 6);

  const sections = [
    {
      heading: 'Purpose',
      body: `${companyName} uses this policy to define clear compliance, security, and evidence expectations for ${selectedFrameworks}.`,
    },
    {
      heading: 'Scope',
      body: buildPolicyScope(company, payload.includeCompanyContext),
    },
    {
      heading: 'Roles and Responsibilities',
      body: 'Management approves the policy, control owners maintain implementation evidence, and system or vendor owners remediate gaps within agreed due dates.',
    },
    {
      heading: 'Policy Requirements',
      body: buildPolicyRequirements(template.id, overview),
    },
    {
      heading: 'Evidence and Control Mapping',
      body: mappedControls.length
        ? `This policy maps to ${mappedControls.map((mapping) => mapping.reference).join(', ')}. Required evidence includes ${template.evidenceChecklist.join(', ')}.`
        : `Required evidence includes ${template.evidenceChecklist.join(', ')}.`,
    },
    {
      heading: 'Monitoring and Review',
      body: `${template.reviewCadence}. Current monitoring health is ${overview.continuousMonitoring.health.toLowerCase()} with ${overview.continuousMonitoring.monitoringCoverage}% system monitoring coverage.`,
    },
    {
      heading: 'Exceptions',
      body: 'Exceptions must be documented with business justification, risk acceptance, owner, expiry date, and compensating controls.',
    },
  ];

  if (payload.audience === 'BOARD') {
    sections.splice(1, 0, {
      heading: 'Executive Summary',
      body: `Current risk exposure is ${overview.riskScoring.score}/100 (${overview.riskScoring.label}). The highest priority is to address high-impact gaps and keep evidence audit-ready.`,
    });
  }

  if (payload.audience === 'AUDIT') {
    sections.push({
      heading: 'Audit Trail',
      body: 'Each policy requirement must be linked to evidence, approval records, remediation tasks, and review outcomes in Framework360.',
    });
  }

  return {
    template: template.id,
    title: template.title,
    generatedAt: new Date().toISOString(),
    company: {
      id: company.id,
      name: companyName,
    },
    audience: payload.audience,
    sections,
    controlsCovered: mappedControls.map((mapping) => ({
      controlId: mapping.controlId,
      reference: mapping.reference,
      framework: mapping.framework,
      title: mapping.title,
    })),
    evidenceChecklist: template.evidenceChecklist,
    markdown: toPolicyMarkdown(template.title, companyName, sections),
    disclaimer: 'Generated policy text is a starting point and should be reviewed by qualified compliance, legal, or security owners before approval.',
  };
}

function buildPolicyScope(company, includeCompanyContext) {
  if (!includeCompanyContext) {
    return 'This policy applies to employees, contractors, systems, vendors, business processes, and evidence used in the compliance program.';
  }

  return `This policy applies to ${company.users?.length || 'all'} users, ${(company.systems || []).length} registered systems, ${(company.vendors || []).length} vendors, and ${(company.businessProcesses || []).length} business processes in the workspace.`;
}

function buildPolicyRequirements(templateId, overview) {
  const highGapCount = overview.securityGapAnalysis.summary.critical + overview.securityGapAnalysis.summary.high;

  switch (templateId) {
    case 'access-control':
      return 'MFA must be enabled for internet-exposed and sensitive systems. Privileged access must be approved, reviewed, and evidenced. Access changes must follow joiner-mover-leaver procedures.';
    case 'incident-response':
      return 'Logging, monitoring, escalation, containment, communication, and post-incident review must be defined and tested. Critical alerts must have named owners.';
    case 'vendor-management':
      return 'Critical suppliers must have documented due diligence, DPA where data is processed, SLA where service continuity matters, and recurring security review evidence.';
    case 'business-continuity':
      return 'Critical systems and processes must have approved RTO/RPO, tested backups, continuity procedures, and manual workaround records where applicable.';
    case 'privacy':
      return 'Personal data processing must be documented, lawful, minimized, retained only as needed, and protected with suitable technical and organizational controls.';
    case 'information-security':
    default:
      return `Controls must be owned, risk-assessed, evidenced, and reviewed. The current workspace has ${highGapCount} high-impact gaps requiring prioritized remediation.`;
  }
}

function templateFocus(templateId) {
  const mapping = {
    'access-control': 'ACCESS_CONTROL',
    'incident-response': 'MONITORING_AND_RESPONSE',
    'vendor-management': 'VENDOR_RISK',
    'business-continuity': 'BUSINESS_CONTINUITY',
    privacy: 'PRIVACY_AND_DATA',
    'information-security': 'GOVERNANCE',
  };

  return mapping[templateId] || 'GENERAL_COMPLIANCE';
}

function toPolicyMarkdown(title, companyName, sections) {
  const body = sections
    .map((section) => `## ${section.heading}\n${section.body}`)
    .join('\n\n');

  return `# ${title}\n\nCompany: ${companyName}\n\n${body}`;
}

function isOverdue(value) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getRiskLabel(score) {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

function getSeverityWeight(severity) {
  if (severity === 'CRITICAL') return 4;
  if (severity === 'HIGH') return 3;
  if (severity === 'MEDIUM') return 2;
  return 1;
}

function getConfidenceWeight(confidence) {
  if (confidence === 'HIGH') return 3;
  if (confidence === 'MEDIUM') return 2;
  return 1;
}

function formatEnum(value) {
  return String(value || '')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (char) => char.toUpperCase());
}

module.exports = router;
