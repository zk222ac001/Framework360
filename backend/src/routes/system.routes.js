const express = require('express');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { systemAssetSchema, updateSystemAssetSchema } = require('../validators/systemRegister.validator');
const {
  getCompanyId,
  requireWriteAccess,
  parsePositiveId,
} = require('../utils/systemRegisterAccess');

const router = express.Router();

router.use(requireAuth);

async function validateRelations({ companyId, ownerUserId, vendorId }) {
  if (ownerUserId) {
    const owner = await prisma.user.findFirst({
      where: {
        id: ownerUserId,
        companyId,
      },
    });

    if (!owner) {
      return { ok: false, status: 400, error: 'Owner user does not belong to this company' };
    }
  }

  if (vendorId) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        companyId,
      },
    });

    if (!vendor) {
      return { ok: false, status: 400, error: 'Vendor does not belong to this company' };
    }
  }

  return { ok: true };
}

function toGraphNodeId(type, id) {
  if (type === 'SYSTEM') return `system-${id}`;
  if (type === 'VENDOR') return `vendor-${id}`;
  if (type === 'BUSINESS_PROCESS') return `process-${id}`;
  return `unknown-${id}`;
}

router.get('/', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const systems = await prisma.system.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: {
        vendor: true,
        ownerUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return res.json({ systems });
  } catch (error) {
    console.error('GET /systems error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/', validate(systemAssetSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const relationValidation = await validateRelations({
      companyId,
      ownerUserId: req.body.ownerUserId,
      vendorId: req.body.vendorId,
    });

    if (!relationValidation.ok) {
      return res.status(relationValidation.status).json({ error: relationValidation.error });
    }

    const system = await prisma.system.create({
      data: {
        companyId,
        ...req.body,
      },
      include: {
        vendor: true,
        ownerUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({ system });
  } catch (error) {
    console.error('POST /systems error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /systems/graph
 */
router.get('/graph', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const [systems, vendors, businessProcesses, dependencies] = await Promise.all([
      prisma.system.findMany({ where: { companyId } }),
      prisma.vendor.findMany({ where: { companyId } }),
      prisma.businessProcess.findMany({ where: { companyId } }),
      prisma.dependency.findMany({ where: { companyId } }),
    ]);

    const systemNodes = systems.map((system) => ({
      id: `system-${system.id}`,
      type: 'SYSTEM',
      label: system.name,
      criticality: system.criticality,
      metadata: {
        systemId: system.id,
        type: system.type,
        status: system.status,
        containsPersonalData: system.containsPersonalData,
        containsSensitiveData: system.containsSensitiveData,
        internetExposed: system.internetExposed,
        mfaEnabled: system.mfaEnabled,
        backupEnabled: system.backupEnabled,
        loggingEnabled: system.loggingEnabled,
        monitoringEnabled: system.monitoringEnabled,
        rtoMinutes: system.rtoMinutes,
        rpoMinutes: system.rpoMinutes,
      },
    }));

    const vendorNodes = vendors.map((vendor) => ({
      id: `vendor-${vendor.id}`,
      type: 'VENDOR',
      label: vendor.name,
      criticality: vendor.criticality,
      metadata: {
        vendorId: vendor.id,
        isCriticalSupplier: vendor.isCriticalSupplier,
        hasDpa: vendor.hasDpa,
        hasSla: vendor.hasSla,
        hasSecurityReview: vendor.hasSecurityReview,
        reviewDate: vendor.reviewDate,
      },
    }));

    const processNodes = businessProcesses.map((process) => ({
      id: `process-${process.id}`,
      type: 'BUSINESS_PROCESS',
      label: process.name,
      criticality: process.criticality,
      metadata: {
        businessProcessId: process.id,
        maxTolerableDowntimeMinutes: process.maxTolerableDowntimeMinutes,
        manualWorkaroundAvailable: process.manualWorkaroundAvailable,
      },
    }));

    const edges = dependencies.map((dependency) => ({
      id: `dependency-${dependency.id}`,
      source: toGraphNodeId(dependency.sourceType, dependency.sourceId),
      target: toGraphNodeId(dependency.targetType, dependency.targetId),
      label: 'depends on',
      dependencyType: dependency.dependencyType,
      isCritical: dependency.isCritical,
      metadata: {
        dependencyId: dependency.id,
        failureImpact: dependency.failureImpact,
        manualWorkaroundAvailable: dependency.manualWorkaroundAvailable,
        notes: dependency.notes,
      },
    }));

    return res.json({
      nodes: [...systemNodes, ...vendorNodes, ...processNodes],
      edges,
    });
  } catch (error) {
    console.error('GET /systems/graph error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /systems/critical
 */
router.get('/critical', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const systems = await prisma.system.findMany({
      where: { companyId },
      include: {
        vendor: true,
        ownerUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const dependencies = await prisma.dependency.findMany({
      where: { companyId },
    });

    const criticalSystemIdsFromDependencies = new Set(
      dependencies
        .filter((dependency) => dependency.targetType === 'SYSTEM' && dependency.isCritical)
        .map((dependency) => dependency.targetId)
    );

    const criticalSystems = systems.filter((system) =>
      system.criticality === 'CRITICAL' ||
      criticalSystemIdsFromDependencies.has(system.id) ||
      (system.internetExposed && system.containsPersonalData)
    );

    return res.json({
      systems: criticalSystems,
      count: criticalSystems.length,
    });
  } catch (error) {
    console.error('GET /systems/critical error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /systems/security-gaps
 */
router.get('/security-gaps', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const systems = await prisma.system.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    const gaps = [];

    for (const system of systems) {
      if (system.internetExposed && !system.mfaEnabled) {
        gaps.push({
          systemId: system.id,
          systemName: system.name,
          severity: 'HIGH',
          type: 'MISSING_MFA',
          message: 'Internet-exposed system does not have MFA enabled.',
        });
      }

      if (system.criticality === 'CRITICAL' && !system.loggingEnabled) {
        gaps.push({
          systemId: system.id,
          systemName: system.name,
          severity: 'HIGH',
          type: 'MISSING_LOGGING',
          message: 'Critical system does not have logging enabled.',
        });
      }

      if (system.criticality === 'CRITICAL' && !system.monitoringEnabled) {
        gaps.push({
          systemId: system.id,
          systemName: system.name,
          severity: 'HIGH',
          type: 'MISSING_MONITORING',
          message: 'Critical system does not have monitoring enabled.',
        });
      }

      if (system.containsPersonalData && !system.backupEnabled) {
        gaps.push({
          systemId: system.id,
          systemName: system.name,
          severity: 'MEDIUM',
          type: 'MISSING_BACKUP',
          message: 'System contains personal data but does not have backup enabled.',
        });
      }

      if (!system.ownerUserId && !system.ownerDepartment) {
        gaps.push({
          systemId: system.id,
          systemName: system.name,
          severity: 'MEDIUM',
          type: 'MISSING_OWNER',
          message: 'System has no owner user or owner department.',
        });
      }
    }

    return res.json({
      gaps,
      count: gaps.length,
    });
  } catch (error) {
    console.error('GET /systems/security-gaps error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /systems/continuity-gaps
 */
router.get('/continuity-gaps', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const systems = await prisma.system.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    const vendors = await prisma.vendor.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    const gaps = [];

    for (const system of systems) {
      const isCritical = system.criticality === 'CRITICAL';

      if (isCritical && system.rtoMinutes === null) {
        gaps.push({
          resourceType: 'SYSTEM',
          systemId: system.id,
          systemName: system.name,
          severity: 'HIGH',
          type: 'MISSING_RTO',
          message: 'Critical system is missing RTO.',
        });
      }

      if (isCritical && system.rpoMinutes === null) {
        gaps.push({
          resourceType: 'SYSTEM',
          systemId: system.id,
          systemName: system.name,
          severity: 'HIGH',
          type: 'MISSING_RPO',
          message: 'Critical system is missing RPO.',
        });
      }

      if (isCritical && !system.backupEnabled) {
        gaps.push({
          resourceType: 'SYSTEM',
          systemId: system.id,
          systemName: system.name,
          severity: 'HIGH',
          type: 'MISSING_BACKUP',
          message: 'Critical system does not have backup enabled.',
        });
      }
    }

    for (const vendor of vendors) {
      if ((vendor.criticality === 'CRITICAL' || vendor.isCriticalSupplier) && !vendor.hasSla) {
        gaps.push({
          resourceType: 'VENDOR',
          vendorId: vendor.id,
          vendorName: vendor.name,
          severity: 'HIGH',
          type: 'MISSING_SLA',
          message: 'Critical vendor is missing SLA.',
        });
      }
    }

    return res.json({
      gaps,
      count: gaps.length,
    });
  } catch (error) {
    console.error('GET /systems/continuity-gaps error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /systems/:id/impact
 * Important: this must be before GET /systems/:id only if it has a more specific pattern.
 */
router.get('/:id/impact', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid system id' });

    const system = await prisma.system.findFirst({
      where: { id, companyId },
      include: {
        vendor: true,
      },
    });

    if (!system) {
      return res.status(404).json({ error: 'System not found' });
    }

    const dependencies = await prisma.dependency.findMany({
      where: {
        companyId,
        OR: [
          {
            sourceType: 'SYSTEM',
            sourceId: id,
          },
          {
            targetType: 'SYSTEM',
            targetId: id,
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const affectedBusinessProcessIds = dependencies
      .filter((dependency) =>
        dependency.sourceType === 'BUSINESS_PROCESS' ||
        dependency.targetType === 'BUSINESS_PROCESS'
      )
      .map((dependency) =>
        dependency.sourceType === 'BUSINESS_PROCESS'
          ? dependency.sourceId
          : dependency.targetId
      );

    const affectedSystemIds = dependencies
      .filter((dependency) =>
        dependency.sourceType === 'SYSTEM' ||
        dependency.targetType === 'SYSTEM'
      )
      .map((dependency) =>
        dependency.sourceType === 'SYSTEM'
          ? dependency.sourceId
          : dependency.targetId
      )
      .filter((systemId) => systemId !== id);

    const affectedVendorIds = dependencies
      .filter((dependency) =>
        dependency.sourceType === 'VENDOR' ||
        dependency.targetType === 'VENDOR'
      )
      .map((dependency) =>
        dependency.sourceType === 'VENDOR'
          ? dependency.sourceId
          : dependency.targetId
      );

    const [affectedBusinessProcesses, affectedSystems, affectedVendors] = await Promise.all([
      prisma.businessProcess.findMany({
        where: {
          companyId,
          id: {
            in: [...new Set(affectedBusinessProcessIds)],
          },
        },
      }),
      prisma.system.findMany({
        where: {
          companyId,
          id: {
            in: [...new Set(affectedSystemIds)],
          },
        },
      }),
      prisma.vendor.findMany({
        where: {
          companyId,
          id: {
            in: [...new Set(affectedVendorIds)],
          },
        },
      }),
    ]);

    const relatedGaps = [];

    if (system.internetExposed && !system.mfaEnabled) {
      relatedGaps.push({
        type: 'MISSING_MFA',
        severity: 'HIGH',
        message: 'Internet-exposed system does not have MFA enabled.',
      });
    }

    if (system.criticality === 'CRITICAL' && !system.backupEnabled) {
      relatedGaps.push({
        type: 'MISSING_BACKUP',
        severity: 'HIGH',
        message: 'Critical system does not have backup enabled.',
      });
    }

    if (system.criticality === 'CRITICAL' && system.rtoMinutes === null) {
      relatedGaps.push({
        type: 'MISSING_RTO',
        severity: 'HIGH',
        message: 'Critical system is missing RTO.',
      });
    }

    if (system.criticality === 'CRITICAL' && system.rpoMinutes === null) {
      relatedGaps.push({
        type: 'MISSING_RPO',
        severity: 'HIGH',
        message: 'Critical system is missing RPO.',
      });
    }

    const suggestedActions = relatedGaps.map((gap) => ({
      type: gap.type,
      priority: gap.severity,
      title: `Fix ${gap.type.replaceAll('_', ' ').toLowerCase()}`,
      description: gap.message,
    }));

    return res.json({
      system,
      dependencies,
      affectedBusinessProcesses,
      affectedSystems,
      affectedVendors,
      relatedGaps,
      suggestedActions,
    });
  } catch (error) {
    console.error('GET /systems/:id/impact error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /systems/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid system id' });

    const system = await prisma.system.findFirst({
      where: { id, companyId },
      include: {
        vendor: true,
        ownerUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!system) return res.status(404).json({ error: 'System not found' });

    return res.json({ system });
  } catch (error) {
    console.error('GET /systems/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.patch('/:id', validate(updateSystemAssetSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid system id' });

    const existing = await prisma.system.findFirst({
      where: { id, companyId },
    });

    if (!existing) return res.status(404).json({ error: 'System not found' });

    const relationValidation = await validateRelations({
      companyId,
      ownerUserId: req.body.ownerUserId,
      vendorId: req.body.vendorId,
    });

    if (!relationValidation.ok) {
      return res.status(relationValidation.status).json({ error: relationValidation.error });
    }

    const system = await prisma.system.update({
      where: { id },
      data: req.body,
      include: {
        vendor: true,
        ownerUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return res.json({ system });
  } catch (error) {
    console.error('PATCH /systems/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    if (!requireWriteAccess(req, res)) return;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid system id' });

    const existing = await prisma.system.findFirst({
      where: { id, companyId },
    });

    if (!existing) return res.status(404).json({ error: 'System not found' });

    await prisma.system.delete({
      where: { id },
    });

    return res.json({ message: 'System deleted' });
  } catch (error) {
    console.error('DELETE /systems/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
