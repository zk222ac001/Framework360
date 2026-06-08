const express = require('express');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { vendorSchema, updateVendorSchema } = require('../validators/systemRegister.validator');
const {
  getCompanyId,
  requireWriteAccess,
  parsePositiveId,
  mapDateFields,
} = require('../utils/systemRegisterAccess');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const vendors = await prisma.vendor.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    return res.json({ vendors });
  } catch (error) {
    console.error('GET /vendors error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/', validate(vendorSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const data = mapDateFields(req.body, ['reviewDate']);

    const vendor = await prisma.vendor.create({
      data: {
        companyId,
        ...data,
      },
    });

    return res.status(201).json({ vendor });
  } catch (error) {
    console.error('POST /vendors error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});
router.get('/gaps', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const vendors = await prisma.vendor.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    const now = new Date();
    const gaps = [];

    for (const vendor of vendors) {
      const isCritical = vendor.criticality === 'CRITICAL' || vendor.isCriticalSupplier;

      if (isCritical && !vendor.hasDpa) {
        gaps.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          severity: 'HIGH',
          type: 'MISSING_DPA',
          message: 'Critical vendor is missing DPA.',
        });
      }

      if (isCritical && !vendor.hasSla) {
        gaps.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          severity: 'HIGH',
          type: 'MISSING_SLA',
          message: 'Critical vendor is missing SLA.',
        });
      }

      if (isCritical && !vendor.hasSecurityReview) {
        gaps.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          severity: 'HIGH',
          type: 'MISSING_SECURITY_REVIEW',
          message: 'Critical vendor is missing security review.',
        });
      }

      if (vendor.reviewDate && new Date(vendor.reviewDate) < now) {
        gaps.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          severity: 'MEDIUM',
          type: 'OVERDUE_REVIEW',
          message: 'Vendor review date is overdue.',
        });
      }
    }

    return res.json({
      gaps,
      count: gaps.length,
    });
  } catch (error) {
    console.error('GET /vendors/gaps error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/critical', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const vendors = await prisma.vendor.findMany({
      where: {
        companyId,
        OR: [
          { criticality: 'CRITICAL' },
          { isCriticalSupplier: true },
        ],
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.json({
      vendors,
      count: vendors.length,
    });
  } catch (error) {
    console.error('GET /vendors/critical error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid vendor id' });

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId },
    });

    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    return res.json({ vendor });
  } catch (error) {
    console.error('GET /vendors/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.patch('/:id', validate(updateVendorSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid vendor id' });

    const existing = await prisma.vendor.findFirst({
      where: { id, companyId },
    });

    if (!existing) return res.status(404).json({ error: 'Vendor not found' });

    const data = mapDateFields(req.body, ['reviewDate']);

    const vendor = await prisma.vendor.update({
      where: { id },
      data,
    });

    return res.json({ vendor });
  } catch (error) {
    console.error('PATCH /vendors/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid vendor id' });

    const existing = await prisma.vendor.findFirst({
      where: { id, companyId },
    });

    if (!existing) return res.status(404).json({ error: 'Vendor not found' });

    await prisma.vendor.delete({
      where: { id },
    });

    return res.json({ message: 'Vendor deleted' });
  } catch (error) {
    console.error('DELETE /vendors/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;