const express = require('express');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createTaskSchema,
  updateTaskSchema,
} = require('../validators/task.validator');
const router = express.Router();

async function getUserCompanyId(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { companyId: true },
  });

  if (!user?.companyId) {
    res.status(400).json({ error: 'User has no company' });
    return null;
  }

  return user.companyId;
}

async function validateTaskRelations({ companyId, assessmentId, assignedToUserId }) {
  if (assessmentId) {
    const assessment = await prisma.companyFrameworkAssessment.findFirst({
      where: {
        id: assessmentId,
        companyId,
      },
      select: { id: true },
    });

    if (!assessment) {
      return { ok: false, status: 400, error: 'Assessment does not belong to this company' };
    }
  }

  if (assignedToUserId) {
    const assignee = await prisma.user.findFirst({
      where: {
        id: assignedToUserId,
        companyId,
      },
      select: { id: true },
    });

    if (!assignee) {
      return { ok: false, status: 400, error: 'Assigned user does not belong to this company' };
    }
  }

  return { ok: true };
}

router.post('/', requireAuth, validate(createTaskSchema), async (req, res) => {
  try {
    const {
      assessmentId,
      requirementId,
      title,
      description,
      priority,
      dueDate,
      assignedToUserId,
    } = req.body;

    const companyId = await getUserCompanyId(req, res);
    if (!companyId) return;

    const relationValidation = await validateTaskRelations({
      companyId,
      assessmentId,
      assignedToUserId,
    });

    if (!relationValidation.ok) {
      return res.status(relationValidation.status).json({ error: relationValidation.error });
    }

    const task = await prisma.task.create({
      data: {
        companyId,
        assessmentId: assessmentId || null,
        requirementId: requirementId || null,
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        assignedToUserId: assignedToUserId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('POST /tasks error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const companyId = await getUserCompanyId(req, res);
    if (!companyId) return;

    const tasks = await prisma.task.findMany({
      where: { companyId },
      include: {
        requirement: true,
        assessment: {
          include: {
            frameworkDefinition: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(tasks);
  } catch (error) {
    console.error('GET /tasks error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.patch('/:id', requireAuth, validate(updateTaskSchema), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid task id' });
    }

    const companyId = await getUserCompanyId(req, res);
    if (!companyId) return;

    const existingTask = await prisma.task.findFirst({
      where: { id, companyId },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const nextAssessmentId = req.body.assessmentId !== undefined ? req.body.assessmentId : existingTask.assessmentId;
    const nextAssignedToUserId = req.body.assignedToUserId !== undefined ? req.body.assignedToUserId : existingTask.assignedToUserId;

    const relationValidation = await validateTaskRelations({
      companyId,
      assessmentId: nextAssessmentId,
      assignedToUserId: nextAssignedToUserId,
    });

    if (!relationValidation.ok) {
      return res.status(relationValidation.status).json({ error: relationValidation.error });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        assessmentId: req.body.assessmentId,
        requirementId: req.body.requirementId,
        assignedToUserId: req.body.assignedToUserId,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : req.body.dueDate,
      },
    });

    return res.json(task);
  } catch (error) {
    console.error('PATCH /tasks/:id error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
