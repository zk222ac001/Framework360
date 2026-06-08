const express = require('express');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  businessProcessSchema,
  updateBusinessProcessSchema,
} = require('../validators/systemRegister.validator');
const {
  getCompanyId,
  requireWriteAccess,
  parsePositiveId,
} = require('../utils/systemRegisterAccess');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const businessProcesses = await prisma.businessProcess.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    return res.json({ businessProcesses });
  } catch (error) {
    console.error('GET /business-processes error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/', validate(businessProcessSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const businessProcess = await prisma.businessProcess.create({
      data: {
        companyId,
        ...req.body,
      },
    });

    return res.status(201).json({ businessProcess });
  } catch (error) {
    console.error('POST /business-processes error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid business process id' });

    const businessProcess = await prisma.businessProcess.findFirst({
      where: { id, companyId },
    });

    if (!businessProcess) {
      return res.status(404).json({ error: 'Business process not found' });
    }

    return res.json({ businessProcess });
  } catch (error) {
    console.error('GET /business-processes/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.patch('/:id', validate(updateBusinessProcessSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid business process id' });

    const existing = await prisma.businessProcess.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Business process not found' });
    }

    const businessProcess = await prisma.businessProcess.update({
      where: { id },
      data: req.body,
    });

    return res.json({ businessProcess });
  } catch (error) {
    console.error('PATCH /business-processes/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid business process id' });

    const existing = await prisma.businessProcess.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Business process not found' });
    }

    await prisma.businessProcess.delete({
      where: { id },
    });

    return res.json({ message: 'Business process deleted' });
  } catch (error) {
    console.error('DELETE /business-processes/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;