const express = require('express');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  buildAssessmentReportPdf,
  buildExecutiveComplianceReport,
} = require('../utils/reportBuilder');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.get('/reports/executive', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return res.status(400).json({ error: 'User has no company' });
    }

    const dashboardResponse = await buildExecutiveReportPayload(user.companyId);

    await logAction({
      userId: req.user.userId,
      action: 'EXECUTIVE_REPORT_GENERATED',
      entity: 'Company',
      entityId: user.companyId,
      metadata: { reportType: 'executive' },
    });

    return buildExecutiveComplianceReport(res, dashboardResponse);
  } catch (error) {
    console.error('GET /reports/executive error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.get('/assessments/:id/report', requireAuth, async (req, res) => {
  try {
    const assessmentId = String(req.params.id || '').trim();

    if (!assessmentId) {
      return res.status(400).json({ error: 'Invalid assessment id' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        companyId: true,
      },
    });

    if (!user?.companyId) {
      return res.status(400).json({ error: 'User has no company' });
    }

    const assessment = await buildControlAssessmentReportPayload({
      companyId: user.companyId,
      assessmentId,
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    await logAction({
      userId: req.user.userId,
      action: 'REPORT_GENERATED',
      entity: 'CompanyFramework',
      entityId: assessment.id,
      metadata: {
        framework: assessment.frameworkDefinition.code,
      },
    });

    return buildAssessmentReportPdf(assessment, res);
  } catch (error) {
    console.error('GET /assessments/:id/report error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

async function buildExecutiveReportPayload(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      vendors: true,
      frameworks: true,
      controls: {
        include: {
          evidence: true,
        },
      },
      tasks: true,
    },
  });

  if (!company) {
    throw new Error('Company not found');
  }

  const frameworks = company.frameworks.map((framework) => {
    const controls = company.controls.filter(
      (control) => control.framework === framework.framework
    );
    const evidenceCount = controls.reduce(
      (sum, control) => sum + (control.evidence?.length || 0),
      0
    );
    const answeredCount = controls.filter(
      (control) => control.status !== 'NOT_STARTED'
    ).length;
    const totalCount = controls.length || 1;
    const score = controls.length
      ? Math.round(
          controls.reduce((sum, control) => sum + getControlScore(control.status), 0) /
            controls.length
        )
      : 0;

    return {
      code: framework.framework,
      name: getFrameworkName(framework.framework),
      score,
      status: controls.length && controls.every((control) =>
        ['IMPLEMENTED', 'NOT_APPLICABLE'].includes(control.status)
      ) ? 'COMPLETED' : 'IN_PROGRESS',
      gapsCount: controls.filter((control) =>
        !['IMPLEMENTED', 'NOT_APPLICABLE'].includes(control.status)
      ).length,
      evidenceCount,
      progressPercentage: Math.round((answeredCount / totalCount) * 100),
    };
  });

  const totalEvidence = frameworks.reduce((sum, item) => sum + item.evidenceCount, 0);
  const totalGaps = frameworks.reduce((sum, item) => sum + item.gapsCount, 0);
  const averageScore = frameworks.length
    ? Math.round(frameworks.reduce((sum, item) => sum + item.score, 0) / frameworks.length)
    : 0;

  const criticalVendors = company.vendors
    .map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      criticality: vendor.criticality || vendor.riskLevel || 'MEDIUM',
      riskScore: getCriticalityScore(vendor.criticality || vendor.riskLevel || 'MEDIUM'),
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const vendorMatrix = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const vendor of company.vendors) {
    const score = getCriticalityScore(vendor.criticality || vendor.riskLevel || 'MEDIUM');
    if (score >= 90) vendorMatrix.critical += 1;
    else if (score >= 70) vendorMatrix.high += 1;
    else if (score >= 40) vendorMatrix.medium += 1;
    else vendorMatrix.low += 1;
  }

  const topActions = frameworks
    .filter((framework) => framework.gapsCount > 0)
    .sort((a, b) => b.gapsCount - a.gapsCount)
    .slice(0, 5)
    .map((framework) => ({
      priority: framework.gapsCount >= 10 ? 'HIGH' : 'MEDIUM',
      title: `Close ${framework.gapsCount} open gaps in ${framework.name}`,
      framework: framework.code,
      section: 'Executive remediation',
      evidenceNeeded: 'Updated control evidence and owner review',
    }));

  return {
    company,
    frameworks,
    topActions,
    overall: {
      averageScore,
      totalFrameworks: frameworks.length,
      completedFrameworks: frameworks.filter((item) => item.status === 'COMPLETED').length,
      totalGaps,
    },
    evidenceAnalytics: {
      totalEvidence,
      missingEvidenceActions: topActions.length,
    },
    vendorRisk: {
      totalVendors: company.vendors.length,
      criticalVendors,
      matrix: vendorMatrix,
    },
    aiRecommendations: topActions.map((action) => ({
      title: action.title,
      description: `Prioritize ${action.framework} remediation and attach fresh evidence for audit readiness.`,
      priority: action.priority,
    })),
  };
}

async function buildControlAssessmentReportPayload({ companyId, assessmentId }) {
  const companyFramework = await prisma.companyFramework.findFirst({
    where: {
      id: assessmentId,
      companyId,
    },
    include: {
      company: true,
    },
  });

  if (!companyFramework) return null;

  const controls = await prisma.control.findMany({
    where: {
      companyId,
      framework: companyFramework.framework,
    },
    include: {
      evidence: true,
    },
    orderBy: {
      controlId: 'asc',
    },
  });

  const score = controls.length
    ? Math.round(
        controls.reduce((sum, control) => sum + getControlScore(control.status), 0) /
          controls.length
      )
    : 0;

  return {
    id: companyFramework.id,
    companyId,
    company: companyFramework.company,
    score,
    status: controls.length && controls.every((control) =>
      ['IMPLEMENTED', 'NOT_APPLICABLE'].includes(control.status)
    ) ? 'COMPLETED' : 'IN_PROGRESS',
    frameworkDefinition: {
      code: companyFramework.framework,
      name: getFrameworkName(companyFramework.framework),
      sections: [
        {
          id: `${companyFramework.framework}-controls`,
          title: `${getFrameworkName(companyFramework.framework)} controls`,
          requirements: controls.map((control, index) => ({
            id: control.id,
            question: control.title,
            reference: control.controlId,
            description: control.description,
            implementationGuide: control.description,
            exampleEvidence: 'Policy, procedure, screenshot, system export, report, attestation, or vendor documentation',
            riskIfMissing: control.riskLevel ? `${control.riskLevel} risk if missing` : null,
            order: index + 1,
          })),
        },
      ],
    },
    answers: controls.map((control) => ({
      id: control.id,
      requirementId: control.id,
      status: control.answerStatus || controlStatusToAnswerStatus(control.status),
      note: control.answerNote || null,
      evidence: control.evidence.map((evidence) => ({
        ...evidence,
        filename: evidence.title,
        size: evidence.fileSize,
      })),
    })),
  };
}

function getFrameworkName(code) {
  const names = {
    NIS2: 'NIS2',
    DORA: 'DORA',
    ISO27001: 'ISO 27001',
    GDPR: 'GDPR',
    SOC2: 'SOC 2',
    CIS18: 'CIS Controls v8',
    NIST_CSF: 'NIST CSF',
  };

  return names[code] || code;
}

function getControlScore(status) {
  if (status === 'IMPLEMENTED' || status === 'NOT_APPLICABLE') return 100;
  if (status === 'IN_PROGRESS') return 50;
  return 0;
}

function controlStatusToAnswerStatus(status) {
  if (status === 'IMPLEMENTED') return 'YES';
  if (status === 'NOT_APPLICABLE') return 'NOT_APPLICABLE';
  if (status === 'IN_PROGRESS') return 'PARTIAL';
  return 'UNANSWERED';
}

function getCriticalityScore(criticality) {
  if (criticality === 'CRITICAL') return 95;
  if (criticality === 'HIGH') return 75;
  if (criticality === 'MEDIUM') return 50;
  return 25;
}

module.exports = router;
