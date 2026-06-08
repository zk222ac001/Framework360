const express = require('express');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createTaskSchema,
  updateTaskSchema,
} = require('../validators/task.validator');
const router = express.Router();

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

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return res.status(400).json({ error: 'User has no company' });
    }

    const task = await prisma.task.create({
      data: {
        companyId: user.companyId,
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
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return res.status(400).json({ error: 'User has no company' });
    }

    const tasks = await prisma.task.findMany({
      where: { companyId: user.companyId },
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

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return res.status(400).json({ error: 'User has no company' });
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask || existingTask.companyId !== user.companyId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
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