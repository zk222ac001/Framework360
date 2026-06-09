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
    const assessmentId = Number(req.params.id);

    if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
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

    const assessment = await prisma.companyFrameworkAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        company: true,
        frameworkDefinition: {
          include: {
            sections: {
              orderBy: { order: 'asc' },
              include: {
                requirements: {
                  where: { isActive: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        answers: {
          include: {
            evidence: true,
          },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.companyId !== user.companyId) {
      return res.status(403).json({ error: 'No access to this assessment' });
    }

    await logAction({
      userId: req.user.userId,
      action: 'ASSESSMENT_REPORT_GENERATED',
      entity: 'CompanyFrameworkAssessment',
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
      assessments: {
        include: {
          frameworkDefinition: true,
          answers: { include: { evidence: true } },
        },
      },
    },
  });

  if (!company) {
    throw new Error('Company not found');
  }

  const frameworks = company.assessments.map((assessment) => {
    const evidenceCount = assessment.answers.reduce(
      (sum, answer) => sum + (answer.evidence?.length || 0),
      0
    );
    const answeredCount = assessment.answers.filter(
      (answer) => answer.status !== 'UNANSWERED'
    ).length;
    const totalCount = assessment.answers.length || 1;

    return {
      code: assessment.frameworkDefinition.code,
      name: assessment.frameworkDefinition.name,
      score: Math.round(assessment.score || 0),
      status: assessment.status,
      gapsCount: assessment.answers.filter((answer) =>
        ['NO', 'PARTIAL', 'UNANSWERED'].includes(answer.status)
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
      criticality: vendor.criticality || 'MEDIUM',
      riskScore: getCriticalityScore(vendor.criticality || 'MEDIUM'),
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const vendorMatrix = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const vendor of company.vendors) {
    const score = getCriticalityScore(vendor.criticality || 'MEDIUM');
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

function getCriticalityScore(criticality) {
  if (criticality === 'CRITICAL') return 95;
  if (criticality === 'HIGH') return 75;
  if (criticality === 'MEDIUM') return 50;
  return 25;
}

module.exports = router;
