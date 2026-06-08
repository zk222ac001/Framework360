const express = require('express');

const { buildAssessmentReport } = require('../utils/reportBuilder');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { saveAnswersSchema } = require('../validators/framework.validator');
const { calculateAssessmentScore } = require('../utils/scoreAssessment');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const frameworks = await prisma.frameworkDefinition.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        category: true,
      },
      orderBy: { id: 'asc' },
    });

    return res.json(frameworks);
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

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return res.status(400).json({ error: 'User has no company' });
    }

    const frameworkDefinition = await prisma.frameworkDefinition.findUnique({
      where: { code },
      include: {
        sections: {
          include: {
            requirements: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!frameworkDefinition || !frameworkDefinition.isActive) {
      return res.status(404).json({ error: 'Framework not found' });
    }

    const assessment = await prisma.companyFrameworkAssessment.upsert({
      where: {
        companyId_frameworkDefinitionId: {
          companyId: user.companyId,
          frameworkDefinitionId: frameworkDefinition.id,
        },
      },
      update: {},
      create: {
        companyId: user.companyId,
        frameworkDefinitionId: frameworkDefinition.id,
        status: 'IN_PROGRESS',
        score: 0,
      },
    });

    await prisma.companyFramework.upsert({
      where: {
        companyId_framework: {
          companyId: user.companyId,
          framework: frameworkDefinition.code,
        },
      },
      update: {},
      create: {
        companyId: user.companyId,
        framework: frameworkDefinition.code,
      },
    });

    const requirements = frameworkDefinition.sections.flatMap(
      (section) => section.requirements
    );

    await prisma.$transaction(
      requirements.map((requirement) =>
        prisma.frameworkRequirementAnswer.upsert({
          where: {
            assessmentId_requirementId: {
              assessmentId: assessment.id,
              requirementId: requirement.id,
            },
          },
          update: {},
          create: {
            assessmentId: assessment.id,
            requirementId: requirement.id,
            status: 'UNANSWERED',
          },
        })
      )
    );

    const fullAssessment = await prisma.companyFrameworkAssessment.findUnique({
      where: { id: assessment.id },
      include: getAssessmentInclude(),
    });

    const { score, progressPercentage, answeredCount, totalCount } =
      calculateAssessmentScore(fullAssessment);

    await prisma.companyFrameworkAssessment.update({
      where: { id: assessment.id },
      data: { score },
    });

    await logAction({
      userId: req.user.userId,
      action: 'ASSESSMENT_STARTED',
      entity: 'CompanyFrameworkAssessment',
      entityId: assessment.id,
      metadata: {
        framework: frameworkDefinition.code,
      },
    });

    return res.status(201).json({
      assessmentId: assessment.id,
      framework: frameworkDefinition.code,
      status: assessment.status,
      score,
      progressPercentage,
      answeredCount,
      totalCount,
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

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return res.status(400).json({ error: 'User has no company' });
    }

    const frameworkDefinition = await prisma.frameworkDefinition.findUnique({
      where: { code },
    });

    if (!frameworkDefinition) {
      return res.status(404).json({ error: 'Framework not found' });
    }

    const assessment = await prisma.companyFrameworkAssessment.findUnique({
      where: {
        companyId_frameworkDefinitionId: {
          companyId: user.companyId,
          frameworkDefinitionId: frameworkDefinition.id,
        },
      },
      include: getAssessmentInclude(),
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment has not been started' });
    }

    return res.json(formatAssessmentResponse(assessment));
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
      const assessmentId = Number(req.params.assessmentId);
      const { answers } = req.body;

      if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
        return res.status(400).json({ error: 'Invalid assessmentId' });
      }

      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: 'answers must be a non-empty list' });
      }

      const allowedStatuses = ['YES', 'PARTIAL', 'NO', 'NOT_APPLICABLE'];

      for (const item of answers) {
        if (
          !Number.isInteger(item.requirementId) ||
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

      const assessment = await prisma.companyFrameworkAssessment.findUnique({
        where: { id: assessmentId },
        include: {
          frameworkDefinition: {
            include: {
              sections: {
                include: {
                  requirements: true,
                },
              },
            },
          },
        },
      });

      if (!assessment || assessment.companyId !== user.companyId) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      const allRequirements = assessment.frameworkDefinition.sections.flatMap(
        (section) => section.requirements
      );

      const validRequirementIds = allRequirements.map(
        (requirement) => requirement.id
      );

      for (const item of answers) {
        if (!validRequirementIds.includes(item.requirementId)) {
          return res.status(400).json({
            error: `Requirement ${item.requirementId} does not belong to this framework`,
          });
        }
      }

      await prisma.$transaction(
        answers.map((item) =>
          prisma.frameworkRequirementAnswer.upsert({
            where: {
              assessmentId_requirementId: {
                assessmentId,
                requirementId: item.requirementId,
              },
            },
            update: {
              status: item.status,
              note: typeof item.note === 'string' ? item.note : null,
              answeredByUserId: req.user.userId,
              answeredAt: new Date(),
            },
            create: {
              assessmentId,
              requirementId: item.requirementId,
              status: item.status,
              note: typeof item.note === 'string' ? item.note : null,
              answeredByUserId: req.user.userId,
              answeredAt: new Date(),
            },
          })
        )
      );

      await createOrUpdateTasksFromAnswers({
        answers,
        assessmentId,
        companyId: user.companyId,
        requirements: allRequirements,
      });

      await logAction({
        userId: req.user.userId,
        action: 'ASSESSMENT_ANSWERS_UPDATED',
        entity: 'CompanyFrameworkAssessment',
        entityId: assessmentId,
        metadata: {
          answersCount: answers.length,
          requirementIds: answers.map((answer) => answer.requirementId),
        },
      });

      const updatedAssessment = await prisma.companyFrameworkAssessment.findUnique({
        where: { id: assessmentId },
        include: getAssessmentInclude(),
      });

      const { score, progressPercentage, answeredCount, totalCount } =
        calculateAssessmentScore(updatedAssessment);

      await prisma.companyFrameworkAssessment.update({
        where: { id: assessmentId },
        data: { score },
      });

      return res.json({
        assessmentId,
        score,
        progressPercentage,
        answeredCount,
        totalCount,
        status: updatedAssessment.status,
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
    const assessmentId = Number(req.params.assessmentId);

    if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
      return res.status(400).json({ error: 'Invalid assessmentId' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return res.status(400).json({ error: 'User has no company' });
    }

    const assessment = await prisma.companyFrameworkAssessment.findUnique({
      where: { id: assessmentId },
      include: getAssessmentInclude(),
    });

    if (!assessment || assessment.companyId !== user.companyId) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const { score } = calculateAssessmentScore(assessment);

    const completed = await prisma.companyFrameworkAssessment.update({
      where: { id: assessmentId },
      data: {
        score,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: getAssessmentInclude(),
    });

    const { progressPercentage, answeredCount, totalCount } =
      calculateAssessmentScore(completed);

    await logAction({
      userId: req.user.userId,
      action: 'ASSESSMENT_COMPLETED',
      entity: 'CompanyFrameworkAssessment',
      entityId: assessmentId,
      metadata: {
        score: completed.score,
        status: completed.status,
      },
    });

    return res.json({
      assessmentId,
      score: completed.score,
      progressPercentage,
      answeredCount,
      totalCount,
      status: completed.status,
      completedAt: completed.completedAt,
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
    const assessment = await getAuthorizedAssessment(req, res);
    if (!assessment) return;

    const gaps = buildGaps(assessment);

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
    const assessment = await getAuthorizedAssessment(req, res);
    if (!assessment) return;

    const actionPlan = buildActionPlan(assessment);

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
    const assessment = await getAuthorizedAssessment(req, res);
    if (!assessment) return;

    const actionPlan = buildActionPlan(assessment);

    return buildAssessmentReport(res, assessment, {
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

async function getAuthorizedAssessment(req, res) {
  const assessmentId = Number(req.params.assessmentId);

  if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
    res.status(400).json({ error: 'Invalid assessmentId' });
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { companyId: true },
  });

  if (!user?.companyId) {
    res.status(400).json({ error: 'User has no company' });
    return null;
  }

  const assessment = await prisma.companyFrameworkAssessment.findUnique({
    where: { id: assessmentId },
    include: getAssessmentInclude(),
  });

  if (!assessment || assessment.companyId !== user.companyId) {
    res.status(404).json({ error: 'Assessment not found' });
    return null;
  }

  return assessment;
}

function buildGaps(assessment) {
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
        answerId: answer?.id || null,
        section: section.title,
        question: requirement.question,
        status,
        priority: requirement.weight,
        implementationGuide: requirement.implementationGuide,
        exampleEvidence: requirement.exampleEvidence,
        riskIfMissing: requirement.riskIfMissing,
        hasEvidence: (answer?.evidence?.length || 0) > 0,
      });
    }
  }

  return gaps.sort((a, b) => b.priority - a.priority);
}

function buildActionPlan(assessment) {
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
        requirementId: requirement.id,
        answerId: answer?.id || null,
        title: requirement.question,
        section: section.title,
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

  actions.sort((a, b) => b.priorityWeight - a.priorityWeight);

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

async function createOrUpdateTasksFromAnswers({
  answers,
  assessmentId,
  companyId,
  requirements,
}) {
  for (const item of answers) {
    const requirement = requirements.find(
      (candidate) => candidate.id === item.requirementId
    );

    if (!requirement) {
      continue;
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        assessmentId,
        requirementId: requirement.id,
        companyId,
      },
    });

    if (item.status === 'YES' || item.status === 'NOT_APPLICABLE') {
      if (existingTask && existingTask.status !== 'DONE') {
        await prisma.task.update({
          where: { id: existingTask.id },
          data: { status: 'DONE' },
        });
      }

      continue;
    }

    const priority =
      item.status === 'NO' ? 'HIGH' : getPriority(requirement.weight).label;

    if (existingTask) {
      await prisma.task.update({
        where: { id: existingTask.id },
        data: {
          title: requirement.question,
          description:
            requirement.implementationGuide ||
            requirement.description ||
            'Document, implement, and verify this control.',
          priority,
          status: existingTask.status === 'DONE' ? 'OPEN' : existingTask.status,
        },
      });

      continue;
    }

    await prisma.task.create({
      data: {
        companyId,
        assessmentId,
        requirementId: requirement.id,
        title: requirement.question,
        description:
          requirement.implementationGuide ||
          requirement.description ||
          'Document, implement, and verify this control.',
        priority,
        status: 'OPEN',
      },
    });
  }
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

function removePriorityWeight(action) {
  const { priorityWeight, ...cleanAction } = action;
  return cleanAction;
}

function getAssessmentInclude() {
  return {
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
  };
}

function formatAssessmentResponse(assessment) {
  const {
    score,
    progressPercentage,
    answeredCount,
    totalCount,
    sectionScores,
  } = calculateAssessmentScore(assessment);

  return {
    assessmentId: assessment.id,
    framework: {
      code: assessment.frameworkDefinition.code,
      name: assessment.frameworkDefinition.name,
      description: assessment.frameworkDefinition.description,
      category: assessment.frameworkDefinition.category,
    },
    status: assessment.status,
    score,
    progressPercentage,
    answeredCount,
    totalCount,
    sections: assessment.frameworkDefinition.sections.map((section) => {
      const sectionProgress = sectionScores.find(
        (item) => item.sectionId === section.id
      );

      const sectionScore = sectionProgress?.sectionScore || 0;
      const sectionProgressPercentage =
        sectionProgress?.sectionProgressPercentage || 0;
      const sectionAnsweredCount = sectionProgress?.answeredCount || 0;
      const sectionTotalCount = sectionProgress?.totalCount || 0;

      return {
        id: section.id,
        title: section.title,
        description: section.description,
        order: section.order,
        weight: section.weight,
        sectionScore,
        sectionProgressPercentage,
        answeredCount: sectionAnsweredCount,
        totalCount: sectionTotalCount,
        requirements: section.requirements.map((requirement) => {
          const answer = assessment.answers.find(
            (item) => item.requirementId === requirement.id
          );

          return {
            id: requirement.id,
            question: requirement.question,
            description: requirement.description,
            reference: requirement.reference,
            implementationGuide: requirement.implementationGuide,
            exampleEvidence: requirement.exampleEvidence,
            riskIfMissing: requirement.riskIfMissing,
            order: requirement.order,
            weight: requirement.weight,
            isRequired: requirement.isRequired,
            answer: {
              id: answer?.id || null,
              status: answer?.status || 'UNANSWERED',
              note: answer?.note || null,
              evidence: answer?.evidence || [],
            },
          };
        }),
      };
    }),
  };
}

module.exports = router;