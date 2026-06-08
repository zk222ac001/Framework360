const express = require('express');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { buildAssessmentReportPdf } = require('../utils/reportBuilder');
const { logAction } = require('../utils/audit');

const router = express.Router();

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

module.exports = router;