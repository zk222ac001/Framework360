const express = require('express');

const { buildAssessmentReport } = require('../utils/reportBuilder');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { saveAnswersSchema } = require('../validators/framework.validator');
const { logAction } = require('../utils/audit');

const router = express.Router();

const FRAMEWORK_CATALOG = [
  {
    id: 'NIS2',
    code: 'NIS2',
    name: 'NIS2',
    description: 'EU cybersecurity requirements for essential and important entities.',
    category: 'EU law',
    recommended: true,
  },
  {
    id: 'DORA',
    code: 'DORA',
    name: 'DORA',
    description: 'Digital operational resilience requirements for financial entities.',
    category: 'EU law',
    recommended: true,
  },
  {
    id: 'ISO27001',
    code: 'ISO27001',
    name: 'ISO 27001',
    description: 'Information security management system controls and governance.',
    category: 'Certification',
    recommended: true,
  },
  {
    id: 'GDPR',
    code: 'GDPR',
    name: 'GDPR',
    description: 'EU personal data protection and privacy compliance requirements.',
    category: 'EU law',
    recommended: true,
  },
  {
    id: 'SOC2',
    code: 'SOC2',
    name: 'SOC 2',
    description: 'Trust services criteria for security, availability and confidentiality.',
    category: 'Certification',
    recommended: false,
  },
  {
    id: 'CIS18',
    code: 'CIS18',
    name: 'CIS Controls v8',
    description: 'Prioritized cybersecurity safeguards for practical risk reduction.',
    category: 'Security controls',
    recommended: false,
  },
  {
    id: 'NIST_CSF',
    code: 'NIST_CSF',
    name: 'NIST CSF',
    description: 'Cybersecurity framework for identifying, protecting, detecting, responding and recovering.',
    category: 'Security framework',
    recommended: false,
  },
  {
    id: 'PCI_DSS',
    code: 'PCI_DSS',
    name: 'PCI DSS',
    description: 'Payment card data security standard for cardholder data environments.',
    category: 'Payments',
    recommended: false,
  },
  {
    id: 'AI_ACT',
    code: 'AI_ACT',
    name: 'EU AI Act',
    description: 'EU requirements for responsible AI governance and risk management.',
    category: 'EU law',
    recommended: false,
  },
  {
    id: 'CER',
    code: 'CER',
    name: 'CER',
    description: 'EU critical entities resilience requirements.',
    category: 'EU law',
    recommended: false,
  },
  {
    id: 'ISO22301',
    code: 'ISO22301',
    name: 'ISO 22301',
    description: 'Business continuity management system standard.',
    category: 'Certification',
    recommended: false,
  },
  {
    id: 'ISO42001',
    code: 'ISO42001',
    name: 'ISO 42001',
    description: 'AI management system standard.',
    category: 'Certification',
    recommended: false,
  },
];

const FRAMEWORK_CODES = new Set(FRAMEWORK_CATALOG.map((framework) => framework.code));

const DEFAULT_CONTROLS = [
  {
    suffix: 'GOV',
    title: 'Governance and ownership',
    description: 'Assign ownership, define policy expectations, and keep responsibilities visible.',
    riskLevel: 'HIGH',
  },
  {
    suffix: 'RISK',
    title: 'Risk assessment and treatment',
    description: 'Identify relevant risks, document decisions, and track treatment actions.',
    riskLevel: 'HIGH',
  },
  {
    suffix: 'EVIDENCE',
    title: 'Evidence and audit trail',
    description: 'Maintain evidence that proves the control is implemented and reviewed.',
    riskLevel: 'MEDIUM',
  },
  {
    suffix: 'REVIEW',
    title: 'Periodic review',
    description: 'Review control effectiveness and update documentation on a regular cadence.',
    riskLevel: 'MEDIUM',
  },
];

router.get('/', requireAuth, async (req, res) => {
  try {
    return res.json(FRAMEWORK_CATALOG);
  } catch (error) {
    console.error('GET /frameworks error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.post('/:code/start', requireAuth, async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    if (!FRAMEWORK_CODES.has(code)) {
      return res.status(404).json({ error: 'Framework not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return res.status(400).json({ error: 'User has no company' });
    }

    const companyFramework = await prisma.companyFramework.upsert({
      where: {
        companyId_framework: {
          companyId: user.companyId,
          framework: code,
        },
      },
      update: {
        enabled: true,
      },
      create: {
        companyId: user.companyId,
        framework: code,
        enabled: true,
      },
    });

    await ensureFrameworkControls(user.companyId, code);
    const controls = await getFrameworkControls(user.companyId, code);
    const summary = getControlSummary(controls);

    await logAction({
      userId: req.user.userId,
      action: 'COMPANY_UPDATED',
      entity: 'CompanyFramework',
      entityId: companyFramework.id,
      metadata: {
        framework: code,
      },
    });

    return res.status(201).json({
      assessmentId: companyFramework.id,
      framework: code,
      status: summary.status,
      score: summary.score,
      progressPercentage: summary.progressPercentage,
      answeredCount: summary.answeredCount,
      totalCount: summary.totalCount,
    });
  } catch (error) {
    console.error('POST /frameworks/:code/start error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.get('/:code/assessment', requireAuth, async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    if (!FRAMEWORK_CODES.has(code)) {
      return res.status(404).json({ error: 'Framework not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return res.status(400).json({ error: 'User has no company' });
    }

    const companyFramework = await prisma.companyFramework.findUnique({
      where: {
        companyId_framework: {
          companyId: user.companyId,
          framework: code,
        },
      },
    });

    if (!companyFramework) {
      return res.status(404).json({ error: 'Assessment has not been started' });
    }

    await ensureFrameworkControls(user.companyId, code);
    const controls = await getFrameworkControls(user.companyId, code);

    return res.json(formatControlAssessmentResponse(companyFramework, controls));
  } catch (error) {
    console.error('GET /frameworks/:code/assessment error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.patch(
  '/assessments/:assessmentId/answers',
  requireAuth,
  validate(saveAnswersSchema),
  async (req, res) => {
    try {
      const assessmentId = req.params.assessmentId;
      const { answers } = req.body;

      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: 'answers must be a non-empty list' });
      }

      const allowedStatuses = ['YES', 'PARTIAL', 'NO', 'NOT_APPLICABLE'];

      for (const item of answers) {
        if (
          !item.requirementId ||
          !allowedStatuses.includes(item.status)
        ) {
          return res.status(400).json({ error: 'Invalid answer payload' });
        }
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { companyId: true },
      });

      if (!user?.companyId) {
        return res.status(400).json({ error: 'User has no company' });
      }

      const companyFramework = await prisma.companyFramework.findFirst({
        where: {
          id: assessmentId,
          companyId: user.companyId,
        },
      });

      if (!companyFramework) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      const controls = await getFrameworkControls(
        user.companyId,
        companyFramework.framework,
      );

      await updateControlsFromAnswers({
        answers,
        companyId: user.companyId,
        controls,
      });

      await logAction({
        userId: req.user.userId,
        action: 'CONTROL_UPDATED',
        entity: 'CompanyFramework',
        entityId: assessmentId,
        metadata: {
          answersCount: answers.length,
          controlIds: answers.map((answer) => String(answer.requirementId)),
        },
      });

      const updatedControls = await getFrameworkControls(
        user.companyId,
        companyFramework.framework,
      );
      const summary = getControlSummary(updatedControls);

      return res.json({
        assessmentId,
        score: summary.score,
        progressPercentage: summary.progressPercentage,
        answeredCount: summary.answeredCount,
        totalCount: summary.totalCount,
        status: summary.status,
      });
    } catch (error) {
      console.error('PATCH /frameworks/assessments/:assessmentId/answers error:', error);

      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
);

router.post('/assessments/:assessmentId/complete', requireAuth, async (req, res) => {
  try {
    const assessmentId = req.params.assessmentId;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return res.status(400).json({ error: 'User has no company' });
    }

    const companyFramework = await prisma.companyFramework.findFirst({
      where: {
        id: assessmentId,
        companyId: user.companyId,
      },
    });

    if (!companyFramework) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const controls = await getFrameworkControls(
      user.companyId,
      companyFramework.framework,
    );
    const summary = getControlSummary(controls);

    await logAction({
      userId: req.user.userId,
      action: 'COMPANY_UPDATED',
      entity: 'CompanyFramework',
      entityId: assessmentId,
      metadata: {
        framework: companyFramework.framework,
        score: summary.score,
        status: summary.status,
      },
    });

    return res.json({
      assessmentId,
      score: summary.score,
      progressPercentage: summary.progressPercentage,
      answeredCount: summary.answeredCount,
      totalCount: summary.totalCount,
      status: summary.status,
      completedAt: summary.status === 'COMPLETED' ? new Date() : null,
    });
  } catch (error) {
    console.error('POST /frameworks/assessments/:assessmentId/complete error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.get('/assessments/:assessmentId/gaps', requireAuth, async (req, res) => {
  try {
    const assessment = await getAuthorizedControlAssessment(req, res);
    if (!assessment) return;

    const gaps = buildControlGaps(assessment.controls);

    return res.json({
      totalGaps: gaps.length,
      gaps,
    });
  } catch (error) {
    console.error('GET /frameworks/assessments/:assessmentId/gaps error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.get('/assessments/:assessmentId/action-plan', requireAuth, async (req, res) => {
  try {
    const assessment = await getAuthorizedControlAssessment(req, res);
    if (!assessment) return;

    const actionPlan = buildControlActionPlan(assessment.controls);

    return res.json(actionPlan);
  } catch (error) {
    console.error('GET /frameworks/assessments/:assessmentId/action-plan error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.get('/assessments/:assessmentId/report', requireAuth, async (req, res) => {
  try {
    const assessment = await getAuthorizedControlAssessment(req, res);
    if (!assessment) return;

    const reportAssessment = await formatControlReportAssessment(
      assessment.companyFramework,
      assessment.controls
    );
    const actionPlan = buildControlActionPlan(assessment.controls);

    return buildAssessmentReport(res, reportAssessment, {
      highPriority: actionPlan.highPriority,
      mediumPriority: actionPlan.mediumPriority,
      lowPriority: actionPlan.lowPriority,
    });
  } catch (error) {
    console.error('GET /frameworks/assessments/:assessmentId/report error:', error);

    return res.status(500).json({
      error: 'Could not generate report',
      message: error.message,
    });
  }
});

async function ensureFrameworkControls(companyId, framework) {
  await prisma.$transaction(
    DEFAULT_CONTROLS.map((control, index) =>
      prisma.control.upsert({
        where: {
          companyId_framework_controlId: {
            companyId,
            framework,
            controlId: `${framework}-${control.suffix}`,
          },
        },
        update: {},
        create: {
          companyId,
          framework,
          controlId: `${framework}-${control.suffix}`,
          title: control.title,
          description: control.description,
          riskLevel: control.riskLevel,
          status: 'NOT_STARTED',
          owner: null,
          dueDate: null,
        },
      })
    )
  );
}

function getFrameworkControls(companyId, framework) {
  return prisma.control.findMany({
    where: {
      companyId,
      framework,
    },
    include: {
      evidence: true,
      tasks: true,
    },
    orderBy: {
      controlId: 'asc',
    },
  });
}

function getControlSummary(controls) {
  const totalCount = controls.length;
  const answeredCount = controls.filter(
    (control) => control.status !== 'NOT_STARTED'
  ).length;
  const score = totalCount
    ? average(controls.map((control) => getControlScore(control)))
    : 0;
  const progressPercentage = totalCount
    ? Math.round((answeredCount / totalCount) * 100)
    : 0;
  const status =
    totalCount > 0 &&
    controls.every(
      (control) =>
        control.status === 'IMPLEMENTED' ||
        control.status === 'NOT_APPLICABLE'
    )
      ? 'COMPLETED'
      : 'IN_PROGRESS';

  return {
    score,
    progressPercentage,
    answeredCount,
    totalCount,
    status,
  };
}

function formatControlAssessmentResponse(companyFramework, controls) {
  const metadata = FRAMEWORK_CATALOG.find(
    (framework) => framework.code === companyFramework.framework
  );
  const summary = getControlSummary(controls);

  return {
    assessmentId: companyFramework.id,
    framework: metadata || {
      id: companyFramework.framework,
      code: companyFramework.framework,
      name: companyFramework.framework,
      description: null,
      category: 'Framework',
    },
    status: summary.status,
    score: summary.score,
    progressPercentage: summary.progressPercentage,
    answeredCount: summary.answeredCount,
    totalCount: summary.totalCount,
    sections: [
      {
        id: `${companyFramework.framework}-controls`,
        title: `${metadata?.name || companyFramework.framework} controls`,
        description: 'Answer the core controls for this framework.',
        order: 1,
        weight: 1,
        sectionScore: summary.score,
        sectionProgressPercentage: summary.progressPercentage,
        answeredCount: summary.answeredCount,
        totalCount: summary.totalCount,
        requirements: controls.map((control, index) => ({
          id: control.id,
          question: control.title,
          description: control.description,
          reference: control.controlId,
          implementationGuide:
            control.description || 'Document, implement, and verify this control.',
          exampleEvidence: 'Policy, procedure, screenshot, report, or other implementation evidence.',
          riskIfMissing: control.riskLevel
            ? `${control.riskLevel} risk if this control is missing.`
            : null,
          order: index + 1,
          weight: getPriorityWeight(control.riskLevel || 'MEDIUM'),
          isRequired: true,
          answer: {
            id: control.id,
            status: control.answerStatus || controlStatusToAnswerStatus(control.status),
            note: control.answerNote || null,
            evidence: control.evidence.map(formatEvidenceForRequirement),
          },
        })),
      },
    ],
  };
}

function formatEvidenceForRequirement(evidence) {
  return {
    id: evidence.id,
    answerId: evidence.controlId,
    filename: evidence.title || evidence.filePath || 'Evidence file',
    originalName: evidence.title || evidence.filePath || 'Evidence file',
    filePath: evidence.filePath,
    fileType: evidence.fileType,
    size: evidence.fileSize,
    description: evidence.description,
    createdAt: evidence.createdAt,
  };
}

async function formatControlReportAssessment(companyFramework, controls) {
  const metadata = FRAMEWORK_CATALOG.find(
    (framework) => framework.code === companyFramework.framework
  );
  const company = await prisma.company.findUnique({
    where: { id: companyFramework.companyId },
  });
  const summary = getControlSummary(controls);

  return {
    id: companyFramework.id,
    companyId: companyFramework.companyId,
    company,
    score: summary.score,
    status: summary.status,
    frameworkDefinition: {
      code: companyFramework.framework,
      name: metadata?.name || companyFramework.framework,
      sections: [
        {
          id: `${companyFramework.framework}-controls`,
          title: `${metadata?.name || companyFramework.framework} controls`,
          requirements: controls.map((control, index) => ({
            id: control.id,
            question: control.title,
            reference: control.controlId,
            description: control.description,
            implementationGuide:
              control.description || 'Document, implement, and verify this control.',
            exampleEvidence:
              'Policy, procedure, screenshot, report, or other implementation evidence.',
            riskIfMissing: control.riskLevel
              ? `${control.riskLevel} risk if this control is missing.`
              : null,
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

async function updateControlsFromAnswers({ answers, companyId, controls }) {
  const controlsById = new Map(controls.map((control) => [control.id, control]));

  for (const item of answers) {
    const controlId = String(item.requirementId);
    const control = controlsById.get(controlId);

    if (!control || control.companyId !== companyId) {
      continue;
    }

    const status = answerStatusToControlStatus(item.status);

    await prisma.control.update({
      where: { id: control.id },
      data: {
        status,
        answerStatus: item.status,
        answerNote: item.note || null,
      },
    });

    const existingTask = await prisma.task.findFirst({
      where: {
        companyId,
        controlId: control.id,
      },
    });

    if (status === 'IMPLEMENTED' || status === 'NOT_APPLICABLE') {
      if (existingTask && existingTask.status !== 'DONE') {
        await prisma.task.update({
          where: { id: existingTask.id },
          data: { status: 'DONE' },
        });
      }

      continue;
    }

    const priority = item.status === 'NO' ? 'HIGH' : control.riskLevel || 'MEDIUM';

    if (existingTask) {
      await prisma.task.update({
        where: { id: existingTask.id },
        data: {
          title: control.title,
          description:
            control.description || 'Document, implement, and verify this control.',
          priority,
          status: existingTask.status === 'DONE' ? 'OPEN' : existingTask.status,
        },
      });
      continue;
    }

    await prisma.task.create({
      data: {
        companyId,
        controlId: control.id,
        title: control.title,
        description:
          control.description || 'Document, implement, and verify this control.',
        priority,
        status: 'OPEN',
      },
    });
  }
}

async function getAuthorizedControlAssessment(req, res) {
  const assessmentId = req.params.assessmentId;
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { companyId: true },
  });

  if (!user?.companyId) {
    res.status(400).json({ error: 'User has no company' });
    return null;
  }

  const companyFramework = await prisma.companyFramework.findFirst({
    where: {
      id: assessmentId,
      companyId: user.companyId,
    },
  });

  if (!companyFramework) {
    res.status(404).json({ error: 'Assessment not found' });
    return null;
  }

  const controls = await getFrameworkControls(
    user.companyId,
    companyFramework.framework
  );

  return {
    companyFramework,
    controls,
  };
}

function buildControlGaps(controls) {
  return controls
    .filter(
      (control) =>
        control.status !== 'IMPLEMENTED' &&
        control.status !== 'NOT_APPLICABLE'
    )
    .map((control) => ({
      requirementId: control.id,
      answerId: control.id,
      sectionTitle: 'Control',
      question: control.title,
      status: control.answerStatus || controlStatusToAnswerStatus(control.status),
      reason: control.description || null,
      priority: getPriorityWeight(control.riskLevel || 'MEDIUM'),
      implementationGuide:
        control.description || 'Document, implement, and verify this control.',
      exampleEvidence: 'Policy, procedure, screenshot, report, or other implementation evidence.',
      riskIfMissing: control.riskLevel
        ? `${control.riskLevel} risk if this control is missing.`
        : null,
      missingEvidence: !control.evidence?.length,
      hasEvidence: Boolean(control.evidence?.length),
    }))
    .sort((a, b) => b.priority - a.priority);
}

function buildControlActionPlan(controls) {
  const actions = buildControlGaps(controls).map((gap) => {
    const priority = getPriority(gap.priority);

    return {
      requirementId: gap.requirementId,
      answerId: gap.answerId,
      title: gap.question,
      section: gap.sectionTitle,
      status: gap.status,
      priority: priority.label,
      priorityWeight: priority.weight,
      action: gap.implementationGuide,
      evidenceNeeded: gap.exampleEvidence,
      risk: gap.riskIfMissing,
      hasEvidence: gap.hasEvidence,
    };
  });

  return {
    totalActions: actions.length,
    highPriority: actions
      .filter((item) => item.priority === 'HIGH')
      .map(removePriorityWeight),
    mediumPriority: actions
      .filter((item) => item.priority === 'MEDIUM')
      .map(removePriorityWeight),
    lowPriority: actions
      .filter((item) => item.priority === 'LOW')
      .map(removePriorityWeight),
  };
}

function answerStatusToControlStatus(status) {
  if (status === 'YES') return 'IMPLEMENTED';
  if (status === 'NOT_APPLICABLE') return 'NOT_APPLICABLE';
  if (status === 'PARTIAL') return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

function controlStatusToAnswerStatus(status) {
  if (status === 'IMPLEMENTED') return 'YES';
  if (status === 'NOT_APPLICABLE') return 'NOT_APPLICABLE';
  if (status === 'IN_PROGRESS') return 'PARTIAL';
  return 'UNANSWERED';
}

function getControlScore(control) {
  if (control.status === 'IMPLEMENTED' || control.status === 'NOT_APPLICABLE') return 100;
  if (control.status === 'IN_PROGRESS') return 50;
  return 0;
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

function getPriorityWeight(priority) {
  if (priority === 'CRITICAL') return 4;
  if (priority === 'HIGH') return 3;
  if (priority === 'MEDIUM') return 2;
  return 1;
}

function average(values) {
  if (!values.length) return 0;

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  );
}

function removePriorityWeight(action) {
  const { priorityWeight, ...cleanAction } = action;
  return cleanAction;
}

module.exports = router;
