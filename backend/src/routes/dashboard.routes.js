const express = require('express');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

const FRAMEWORK_CATALOG = {
  NIS2: {
    name: 'NIS2',
    category: 'EU law',
    description: 'EU cybersecurity requirements for essential and important entities.',
  },
  DORA: {
    name: 'DORA',
    category: 'EU law',
    description: 'Digital operational resilience requirements for financial entities.',
  },
  ISO27001: {
    name: 'ISO 27001',
    category: 'Certification',
    description: 'Information security management system controls and governance.',
  },
  GDPR: {
    name: 'GDPR',
    category: 'EU law',
    description: 'EU personal data protection and privacy compliance requirements.',
  },
  SOC2: {
    name: 'SOC 2',
    category: 'Certification',
    description: 'Trust services criteria for security, availability and confidentiality.',
  },
  CIS18: {
    name: 'CIS Controls v8',
    category: 'Security controls',
    description: 'Prioritized cybersecurity safeguards for practical risk reduction.',
  },
  NIST_CSF: {
    name: 'NIST CSF',
    category: 'Security framework',
    description: 'Cybersecurity framework for identifying, protecting, detecting, responding and recovering.',
  },
};

const LAW_FRAMEWORK_CODES = ['GDPR', 'NIS2', 'DORA'];
const CERTIFICATE_FRAMEWORK_CODES = ['ISO27001', 'SOC2', 'CIS18', 'NIST_CSF'];

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
            tasks: {
              include: {
                assignedTo: true,
                control: true,
              },
            },
            controls: {
              include: {
                evidence: true,
              },
            },
            evidence: true,
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

    const company = user.company;
    const controls = company.controls || [];
    const evidence = company.evidence || [];
    const tasks = company.tasks || [];
    const frameworkCards = buildFrameworkCards(company.frameworks || [], controls);
    const overallScore = average(frameworkCards.map((item) => item.score));
    const lawScore = average(
      frameworkCards
        .filter((item) => LAW_FRAMEWORK_CODES.includes(item.code))
        .map((item) => item.score),
    );
    const certificateScore = average(
      frameworkCards
        .filter((item) => CERTIFICATE_FRAMEWORK_CODES.includes(item.code))
        .map((item) => item.score),
    );
    const completedFrameworks = frameworkCards.filter(
      (item) => item.status === 'COMPLETED',
    ).length;
    const totalGaps = frameworkCards.reduce(
      (sum, item) => sum + item.gapsCount,
      0,
    );
    const topActions = buildTopActions(tasks, controls);
    const vendorRisk = buildVendorRisk(company.vendors || []);
    const activity = buildActivityTimeline(frameworkCards, evidence, tasks);
    const evidenceAnalytics = buildEvidenceAnalytics(evidence, topActions);
    const aiRecommendations = buildAiRecommendations(
      frameworkCards,
      topActions,
      vendorRisk,
      evidenceAnalytics,
    );
    const interactiveAnalytics = buildInteractiveAnalytics(
      frameworkCards,
      evidence,
      vendorRisk,
      company.vendors || [],
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
        id: company.id,
        name: company.name,
        cvr: company.cvr,
        sector: company.sector,
        country: company.country,
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

function buildFrameworkCards(companyFrameworks, controls) {
  return companyFrameworks
    .filter((item) => item.enabled !== false)
    .map((companyFramework) => {
      const code = companyFramework.framework;
      const metadata = FRAMEWORK_CATALOG[code] || {
        name: code,
        category: 'Framework',
        description: null,
      };
      const frameworkControls = controls.filter(
        (control) => control.framework === code,
      );
      const totalCount = frameworkControls.length;
      const answeredCount = frameworkControls.filter(
        (control) => control.status !== 'NOT_STARTED',
      ).length;
      const gapsCount = frameworkControls.filter(
        (control) =>
          control.status !== 'IMPLEMENTED' &&
          control.status !== 'NOT_APPLICABLE',
      ).length;
      const score = totalCount
        ? average(frameworkControls.map((control) => getControlScore(control)))
        : 0;
      const progressPercentage = totalCount
        ? Math.round((answeredCount / totalCount) * 100)
        : 0;
      const status =
        totalCount > 0 && gapsCount === 0 ? 'COMPLETED' : 'IN_PROGRESS';

      return {
        assessmentId: companyFramework.id,
        code,
        name: metadata.name,
        category: metadata.category,
        description: metadata.description,
        score,
        progressPercentage,
        answeredCount,
        totalCount,
        status,
        gapsCount,
        completedAt: status === 'COMPLETED' ? companyFramework.updatedAt : null,
        createdAt: companyFramework.createdAt || null,
        updatedAt: companyFramework.updatedAt || null,
      };
    });
}

function buildTopActions(tasks, controls) {
  const taskActions = tasks
    .filter((task) => task.status !== 'DONE')
    .map((task) => ({
      framework: task.control?.framework || 'GENERAL',
      assessmentId: task.control?.id || task.id,
      requirementId: task.control?.id || task.id,
      section: task.control ? 'Control remediation' : 'Task',
      title: task.title,
      status: task.status,
      priority: task.priority,
      priorityWeight: getPriorityWeight(task.priority),
      action: task.description || 'Review and close this remediation item.',
      evidenceNeeded: task.control ? 'Attach evidence to the related control.' : null,
      risk: task.control?.riskLevel || null,
      hasEvidence: Boolean(task.control?.evidence?.length),
    }));

  const controlActions = controls
    .filter(
      (control) =>
        control.status !== 'IMPLEMENTED' &&
        control.status !== 'NOT_APPLICABLE',
    )
    .map((control) => ({
      framework: control.framework,
      assessmentId: control.id,
      requirementId: control.id,
      section: 'Control',
      title: control.title,
      status: control.status,
      priority: control.riskLevel || 'MEDIUM',
      priorityWeight: getPriorityWeight(control.riskLevel || 'MEDIUM'),
      action: control.description || 'Document, implement, and verify this control.',
      evidenceNeeded: 'Upload evidence showing this control is implemented.',
      risk: control.riskLevel || null,
      hasEvidence: Boolean(control.evidence?.length),
    }));

  const seen = new Set();
  return [...taskActions, ...controlActions]
    .filter((action) => {
      const key = `${action.framework}-${action.requirementId}-${action.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.priorityWeight - a.priorityWeight)
    .slice(0, 8)
    .map(({ priorityWeight, ...action }) => action);
}

function buildVendorRisk(vendors) {
  const buckets = { critical: 0, high: 0, medium: 0, low: 0 };
  const criticalVendors = vendors
    .map((vendor) => {
      const criticality = vendor.riskLevel || 'MEDIUM';
      const riskScore = getCriticalityScore(criticality);
      return {
        id: vendor.id,
        name: vendor.name,
        category: vendor.service || null,
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
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        filename: item.title || item.filePath || 'Evidence file',
        fileType: item.fileType || 'unknown',
        size: item.fileSize || 0,
        createdAt: item.createdAt,
      })),
  };
}

function buildActivityTimeline(frameworks, evidence, tasks) {
  const frameworkEvents = frameworks.map((framework) => ({
    type: 'ASSESSMENT_UPDATED',
    title: `${framework.name} framework updated`,
    description: `${framework.status.replace('_', ' ').toLowerCase()} framework`,
    createdAt: framework.updatedAt || framework.createdAt,
  }));

  const evidenceEvents = evidence.map((item) => ({
    type: 'EVIDENCE_UPLOADED',
    title: `Evidence uploaded: ${item.title || item.filePath || 'Evidence file'}`,
    description: item.description || item.fileType,
    createdAt: item.createdAt,
  }));

  const taskEvents = tasks.map((task) => ({
    type: 'TASK_ACTIVITY',
    title: task.title,
    description: `${task.priority} priority - ${task.status.replace('_', ' ').toLowerCase()}`,
    createdAt: task.updatedAt,
  }));

  return [...frameworkEvents, ...evidenceEvents, ...taskEvents]
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

function getControlScore(control) {
  if (control.status === 'IMPLEMENTED' || control.status === 'NOT_APPLICABLE') return 100;
  if (control.status === 'IN_PROGRESS') return 50;
  return 0;
}

function getPriorityWeight(priority) {
  if (priority === 'CRITICAL') return 4;
  if (priority === 'HIGH') return 3;
  if (priority === 'MEDIUM') return 2;
  return 1;
}

function getCriticalityScore(criticality) {
  if (criticality === 'CRITICAL') return 95;
  if (criticality === 'HIGH') return 75;
  if (criticality === 'MEDIUM') return 50;
  return 25;
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

function average(values) {
  if (!values.length) return 0;

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

module.exports = router;
