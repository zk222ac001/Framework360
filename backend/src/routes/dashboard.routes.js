const express = require('express');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { calculateAssessmentScore } = require('../utils/scoreAssessment');

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        onboardingCompleted: true,
        lastLogin: true,
        createdAt: true,
        company: {
          include: {
            frameworks: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('GET /me error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        company: {
          include: {
            frameworks: true,
            vendors: true,
            systems: true,
            dependencies: true,
            businessProcesses: true,
            tasks: true,
            assessments: {
              include: {
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
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.company) {
      return res.status(400).json({
        error: 'User has no company yet',
      });
    }

    const frameworkCards = user.company.assessments.map((assessment) => {
      const { score, progressPercentage, answeredCount, totalCount } =
        calculateAssessmentScore(assessment);

      const gaps = getAssessmentGaps(assessment);

      return {
        assessmentId: assessment.id,
        code: assessment.frameworkDefinition.code,
        name: assessment.frameworkDefinition.name,
        category: assessment.frameworkDefinition.category,
        description: assessment.frameworkDefinition.description,
        score,
        progressPercentage,
        answeredCount,
        totalCount,
        status: assessment.status,
        gapsCount: gaps.length,
        completedAt: assessment.completedAt,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
      };
    });

    const overallScore = average(frameworkCards.map((item) => item.score));

    const lawFrameworkCodes = [
      'GDPR',
      'NIS2',
      'DORA',
      'AI_ACT',
      'CRA',
      'DATA_ACT',
      'EIDAS',
      'CER',
    ];

    const certificateFrameworkCodes = [
      'ISO27001',
      'ISO27002',
      'ISO27701',
      'ISO22301',
      'ISO42001',
      'SOC2',
      'CIS_CONTROLS',
      'NIST_CSF',
      'PCI_DSS',
      'TISAX',
    ];

    const lawScore = average(
      frameworkCards
        .filter((item) => lawFrameworkCodes.includes(item.code))
        .map((item) => item.score)
    );

    const certificateScore = average(
      frameworkCards
        .filter((item) => certificateFrameworkCodes.includes(item.code))
        .map((item) => item.score)
    );

    const completedFrameworks = frameworkCards.filter(
      (item) => item.status === 'COMPLETED'
    ).length;

    const totalGaps = frameworkCards.reduce(
      (sum, item) => sum + item.gapsCount,
      0
    );

    const allEvidence = user.company.assessments.flatMap((assessment) =>
      assessment.answers.flatMap((answer) => answer.evidence || [])
    );

    const topActions = user.company.assessments
      .flatMap((assessment) => getAssessmentActions(assessment))
      .sort((a, b) => b.priorityWeight - a.priorityWeight)
      .slice(0, 8)
      .map(({ priorityWeight, ...action }) => action);

    const vendorRisk = buildVendorRisk(user.company.vendors || []);
    const activity = buildActivityTimeline(
      user.company.assessments,
      allEvidence,
      user.company.tasks || []
    );
    const evidenceAnalytics = buildEvidenceAnalytics(allEvidence, topActions);
    const aiRecommendations = buildAiRecommendations(
      frameworkCards,
      topActions,
      vendorRisk,
      evidenceAnalytics
    );
    const interactiveAnalytics = buildInteractiveAnalytics(
      frameworkCards,
      allEvidence,
      vendorRisk,
      user.company.vendors || []
    );

    return res.json({
      lawScore,
      certificateScore,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      company: {
        id: user.company.id,
        name: user.company.name,
        cvr: user.company.cvr,
        sector: user.company.sector,
        country: user.company.country,
      },
      overall: {
        averageScore: overallScore,
        totalFrameworks: frameworkCards.length,
        completedFrameworks,
        totalGaps,
      },
      frameworks: frameworkCards,
      topActions,
      vendorRisk,
      activity,
      evidenceAnalytics,
      aiRecommendations,
      interactiveAnalytics,
    });
  } catch (error) {
    console.error('GET /dashboard error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

function getAssessmentGaps(assessment) {
  const gaps = [];

  for (const section of assessment.frameworkDefinition.sections) {
    for (const requirement of section.requirements) {
      const answer = assessment.answers.find(
        (item) => item.requirementId === requirement.id
      );

      const status = answer?.status || 'UNANSWERED';

      if (status === 'YES' || status === 'NOT_APPLICABLE') {
        continue;
      }

      gaps.push({
        requirementId: requirement.id,
        status,
      });
    }
  }

  return gaps;
}

function getAssessmentActions(assessment) {
  const actions = [];

  for (const section of assessment.frameworkDefinition.sections) {
    for (const requirement of section.requirements) {
      const answer = assessment.answers.find(
        (item) => item.requirementId === requirement.id
      );

      const status = answer?.status || 'UNANSWERED';

      if (status === 'YES' || status === 'NOT_APPLICABLE') {
        continue;
      }

      const priority = getPriority(requirement.weight);

      actions.push({
        framework: assessment.frameworkDefinition.code,
        assessmentId: assessment.id,
        requirementId: requirement.id,
        section: section.title,
        title: requirement.question,
        status,
        priority: priority.label,
        priorityWeight: priority.weight,
        action:
          requirement.implementationGuide ||
          'Document, implement, and verify this control.',
        evidenceNeeded: requirement.exampleEvidence || null,
        risk: requirement.riskIfMissing || null,
        hasEvidence: (answer?.evidence?.length || 0) > 0,
      });
    }
  }

  return actions;
}

function buildVendorRisk(vendors) {
  const buckets = { critical: 0, high: 0, medium: 0, low: 0 };
  const criticalVendors = vendors
    .map((vendor) => {
      const criticality = vendor.criticality || 'MEDIUM';
      const riskScore = getCriticalityScore(criticality);
      return {
        id: vendor.id,
        name: vendor.name,
        category: vendor.category || null,
        criticality,
        riskScore,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  for (const vendor of criticalVendors) {
    if (vendor.riskScore >= 90) buckets.critical += 1;
    else if (vendor.riskScore >= 70) buckets.high += 1;
    else if (vendor.riskScore >= 40) buckets.medium += 1;
    else buckets.low += 1;
  }

  return {
    totalVendors: vendors.length,
    criticalVendors: criticalVendors.slice(0, 5),
    matrix: buckets,
  };
}

function buildEvidenceAnalytics(evidence, topActions) {
  const missingEvidenceActions = topActions.filter((action) => !action.hasEvidence).length;
  return {
    totalEvidence: evidence.length,
    missingEvidenceActions,
    recentUploads: evidence
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        filename: item.filename,
        fileType: item.fileType,
        size: item.size,
        createdAt: item.createdAt,
      })),
  };
}

function buildActivityTimeline(assessments, evidence, tasks) {
  const assessmentEvents = assessments.map((assessment) => ({
    type: 'ASSESSMENT_UPDATED',
    title: `${assessment.frameworkDefinition.name} assessment updated`,
    description: `${assessment.status.replace('_', ' ').toLowerCase()} assessment`,
    createdAt: assessment.updatedAt,
  }));

  const evidenceEvents = evidence.map((item) => ({
    type: 'EVIDENCE_UPLOADED',
    title: `Evidence uploaded: ${item.filename}`,
    description: item.description || item.fileType,
    createdAt: item.createdAt,
  }));

  const taskEvents = tasks.map((task) => ({
    type: 'TASK_ACTIVITY',
    title: task.title,
    description: `${task.priority} priority - ${task.status.replace('_', ' ').toLowerCase()}`,
    createdAt: task.updatedAt,
  }));

  return [...assessmentEvents, ...evidenceEvents, ...taskEvents]
    .filter((item) => item.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
}

function buildInteractiveAnalytics(frameworks, evidence, vendorRisk, vendors) {
  const months = getLastMonths(6);
  const currentReadiness = average(frameworks.map((item) => item.score));

  const readinessTrend = months.map((month, index) => ({
    label: month.label,
    value: Math.max(0, Math.min(100, Math.round(currentReadiness - (months.length - index - 1) * 4))),
  }));

  const evidenceGrowth = months.map((month) => ({
    label: month.label,
    value: evidence.filter((item) => isSameMonth(item.createdAt, month.date)).length,
  }));

  const vendorRiskChart = [
    { label: 'Critical', value: vendorRisk.matrix.critical },
    { label: 'High', value: vendorRisk.matrix.high },
    { label: 'Medium', value: vendorRisk.matrix.medium },
    { label: 'Low', value: vendorRisk.matrix.low },
  ];

  const frameworkPerformance = frameworks
    .map((framework) => ({
      label: framework.code,
      name: framework.name,
      score: Math.round(framework.score || 0),
      gaps: framework.gapsCount || 0,
      progress: framework.progressPercentage || 0,
    }))
    .sort((a, b) => b.score - a.score);

  return {
    readinessTrend,
    evidenceGrowth,
    vendorRiskChart,
    frameworkPerformance,
    vendorCount: vendors.length,
  };
}

function getLastMonths(count) {
  const now = new Date();
  return Array.from({ length: count }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - index - 1), 1);
    return {
      date,
      label: date.toLocaleString('en-US', { month: 'short' }),
    };
  });
}

function isSameMonth(value, date) {
  const parsed = new Date(value);
  return parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth();
}

function buildAiRecommendations(frameworks, topActions, vendorRisk, evidenceAnalytics) {
  const weakestFramework = [...frameworks].sort((a, b) => a.score - b.score)[0];
  const recommendations = [];

  if (weakestFramework) {
    recommendations.push({
      title: `Improve ${weakestFramework.name}`,
      description: `This is currently your weakest framework at ${Math.round(weakestFramework.score)}% readiness.`,
      priority: weakestFramework.score < 50 ? 'HIGH' : 'MEDIUM',
    });
  }

  if (evidenceAnalytics.missingEvidenceActions > 0) {
    recommendations.push({
      title: 'Attach missing evidence',
      description: `${evidenceAnalytics.missingEvidenceActions} prioritized actions need supporting evidence.`,
      priority: 'HIGH',
    });
  }

  if (vendorRisk.matrix.critical > 0 || vendorRisk.matrix.high > 0) {
    recommendations.push({
      title: 'Review third-party risk',
      description: `${vendorRisk.matrix.critical + vendorRisk.matrix.high} vendors require risk review.`,
      priority: 'MEDIUM',
    });
  }

  if (topActions.length > 0) {
    recommendations.push({
      title: 'Resolve top remediation items',
      description: `${topActions.length} high-value actions are ready for remediation planning.`,
      priority: 'MEDIUM',
    });
  }

  return recommendations.slice(0, 5);
}

function getCriticalityScore(criticality) {
  if (criticality === 'CRITICAL') return 95;
  if (criticality === 'HIGH') return 75;
  if (criticality === 'MEDIUM') return 50;
  return 25;
}

function getPriority(weight) {
  if (weight >= 3) {
    return { label: 'HIGH', weight: 3 };
  }

  if (weight === 2) {
    return { label: 'MEDIUM', weight: 2 };
  }

  return { label: 'LOW', weight: 1 };
}

function average(values) {
  if (!values.length) return 0;

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  );
}

module.exports = router;
