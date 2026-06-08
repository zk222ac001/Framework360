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

    const topActions = user.company.assessments
      .flatMap((assessment) => getAssessmentActions(assessment))
      .sort((a, b) => b.priorityWeight - a.priorityWeight)
      .slice(0, 5)
      .map(({ priorityWeight, ...action }) => action);

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