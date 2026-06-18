const express = require('express');

const prisma = require('../db');
const { requireAuth, requirePlatformAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requirePlatformAdmin);

function parsePositiveInt(value, fallback, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseRecordId(value) {
  const id = String(value || '').trim();
  return id.length ? id : null;
}

router.get('/', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 100000);
    const pageSize = parsePositiveInt(req.query.pageSize, 50, 200);
    const userId = req.query.userId ? parseRecordId(req.query.userId) : null;
    const entityId = req.query.entityId ? parseRecordId(req.query.entityId) : null;
    const action = req.query.action ? String(req.query.action).trim() : null;
    const entity = req.query.entity ? String(req.query.entity).trim() : null;
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    const where = {};

    if (userId) where.userId = userId;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [total, auditLogs] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.json({
      auditLogs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /audit-logs error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseRecordId(req.params.id);

    if (!id) {
      return res.status(400).json({ error: 'Invalid audit log id' });
    }

    const auditLog = await prisma.auditLog.findUnique({ where: { id } });

    if (!auditLog) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    return res.json(auditLog);
  } catch (error) {
    console.error('GET /audit-logs/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
