const express = require('express');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  dependencySchema,
  updateDependencySchema,
} = require('../validators/systemRegister.validator');
const {
  getCompanyId,
  requireWriteAccess,
  parsePositiveId,
} = require('../utils/systemRegisterAccess');

const router = express.Router();

router.use(requireAuth);

async function nodeExists({ companyId, type, id }) {
  if (type === 'SYSTEM') {
    return prisma.systemAsset.findFirst({ where: { id, companyId } });
  }

  if (type === 'VENDOR') {
    return prisma.vendor.findFirst({ where: { id, companyId } });
  }

  if (type === 'BUSINESS_PROCESS') {
    return prisma.businessProcess.findFirst({ where: { id, companyId } });
  }

  return null;
}

async function validateDependencyNodes({ companyId, sourceType, sourceId, targetType, targetId }) {
  if (sourceType && sourceId) {
    const source = await nodeExists({ companyId, type: sourceType, id: sourceId });

    if (!source) {
      return { ok: false, status: 400, error: 'Source node does not exist in this company' };
    }
  }

  if (targetType && targetId) {
    const target = await nodeExists({ companyId, type: targetType, id: targetId });

    if (!target) {
      return { ok: false, status: 400, error: 'Target node does not exist in this company' };
    }
  }

  return { ok: true };
}

router.get('/', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const dependencies = await prisma.dependency.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ dependencies });
  } catch (error) {
    console.error('GET /dependencies error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/', validate(dependencySchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const nodeValidation = await validateDependencyNodes({
      companyId,
      sourceType: req.body.sourceType,
      sourceId: req.body.sourceId,
      targetType: req.body.targetType,
      targetId: req.body.targetId,
    });

    if (!nodeValidation.ok) {
      return res.status(nodeValidation.status).json({ error: nodeValidation.error });
    }

    const dependency = await prisma.dependency.create({
      data: {
        companyId,
        ...req.body,
      },
    });

    return res.status(201).json({ dependency });
  } catch (error) {
    console.error('POST /dependencies error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid dependency id' });

    const dependency = await prisma.dependency.findFirst({
      where: { id, companyId },
    });

    if (!dependency) return res.status(404).json({ error: 'Dependency not found' });

    return res.json({ dependency });
  } catch (error) {
    console.error('GET /dependencies/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.patch('/:id', validate(updateDependencySchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid dependency id' });

    const existing = await prisma.dependency.findFirst({
      where: { id, companyId },
    });

    if (!existing) return res.status(404).json({ error: 'Dependency not found' });

    const sourceType = req.body.sourceType || existing.sourceType;
    const sourceId = req.body.sourceId || existing.sourceId;
    const targetType = req.body.targetType || existing.targetType;
    const targetId = req.body.targetId || existing.targetId;

    const nodeValidation = await validateDependencyNodes({
      companyId,
      sourceType,
      sourceId,
      targetType,
      targetId,
    });

    if (!nodeValidation.ok) {
      return res.status(nodeValidation.status).json({ error: nodeValidation.error });
    }

    const dependency = await prisma.dependency.update({
      where: { id },
      data: req.body,
    });

    return res.json({ dependency });
  } catch (error) {
    console.error('PATCH /dependencies/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid dependency id' });

    const existing = await prisma.dependency.findFirst({
      where: { id, companyId },
    });

    if (!existing) return res.status(404).json({ error: 'Dependency not found' });

    await prisma.dependency.delete({
      where: { id },
    });

    return res.json({ message: 'Dependency deleted' });
  } catch (error) {
    console.error('DELETE /dependencies/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;