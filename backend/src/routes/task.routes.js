const express = require('express');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createTaskSchema,
  updateTaskSchema,
} = require('../validators/task.validator');

const router = express.Router();

function getUserId(req) {
  return req.user.userId || req.user.id;
}

function parseRecordId(value) {
  if (value === undefined || value === null) return null;
  const id = String(value).trim();
  return id.length ? id : null;
}

async function getUserCompanyId(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: getUserId(req) },
    select: { companyId: true },
  });

  if (!user?.companyId) {
    res.status(400).json({ error: 'User has no company' });
    return null;
  }

  return user.companyId;
}

async function validateTaskRelations({ companyId, controlId, assignedToId }) {
  if (controlId) {
    const control = await prisma.control.findFirst({
      where: {
        id: controlId,
        companyId,
      },
      select: { id: true },
    });

    if (!control) {
      return { ok: false, status: 400, error: 'Control does not belong to this company' };
    }
  }

  if (assignedToId) {
    const assignee = await prisma.user.findFirst({
      where: {
        id: assignedToId,
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

function buildTaskData(body) {
  const controlId = parseRecordId(body.controlId || body.requirementId);
  const assignedToId = parseRecordId(body.assignedToId || body.assignedToUserId);

  const data = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.status !== undefined) data.status = body.status;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.controlId !== undefined || body.requirementId !== undefined) data.controlId = controlId;
  if (body.assignedToId !== undefined || body.assignedToUserId !== undefined) data.assignedToId = assignedToId;

  return { data, controlId, assignedToId };
}

router.post('/', requireAuth, validate(createTaskSchema), async (req, res) => {
  try {
    const companyId = await getUserCompanyId(req, res);
    if (!companyId) return;

    const { data, controlId, assignedToId } = buildTaskData(req.body);

    const relationValidation = await validateTaskRelations({
      companyId,
      controlId,
      assignedToId,
    });

    if (!relationValidation.ok) {
      return res.status(relationValidation.status).json({ error: relationValidation.error });
    }

    const task = await prisma.task.create({
      data: {
        companyId,
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'MEDIUM',
        controlId: controlId || null,
        assignedToId: assignedToId || null,
        dueDate: data.dueDate || null,
      },
      include: {
        control: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('POST /tasks error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const companyId = await getUserCompanyId(req, res);
    if (!companyId) return;

    const tasks = await prisma.task.findMany({
      where: { companyId },
      include: {
        control: true,
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
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.patch('/:id', requireAuth, validate(updateTaskSchema), async (req, res) => {
  try {
    const id = parseRecordId(req.params.id);
    if (!id) {
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

    const { data, controlId, assignedToId } = buildTaskData(req.body);
    const nextControlId = data.controlId !== undefined ? controlId : existingTask.controlId;
    const nextAssignedToId = data.assignedToId !== undefined ? assignedToId : existingTask.assignedToId;

    const relationValidation = await validateTaskRelations({
      companyId,
      controlId: nextControlId,
      assignedToId: nextAssignedToId,
    });

    if (!relationValidation.ok) {
      return res.status(relationValidation.status).json({ error: relationValidation.error });
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        control: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return res.json(task);
  } catch (error) {
    console.error('PATCH /tasks/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
