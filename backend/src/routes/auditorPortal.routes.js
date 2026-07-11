const express = require('express');
const { z } = require('zod');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { getCompanyId, requireWriteAccess } = require('../utils/systemRegisterAccess');

const router = express.Router();

const grantSchema = z.object({
  email: z.string().email(),
  name: z.string().max(160).optional().nullable(),
  status: z.enum(['ACTIVE', 'PAUSED', 'EXPIRED']).default('ACTIVE'),
  expiresAt: z.string().min(1).optional().nullable(),
  scope: z.record(z.string(), z.boolean()).optional().default({
    frameworks: true,
    evidence: true,
    findings: true,
    trustCenter: true,
  }),
}).strict();

const updateGrantSchema = grantSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

router.use(requireAuth);

router.get('/overview', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const access = await assertAuditorAccess(req, res, companyId);
    if (!access) return;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        frameworks: true,
        controls: {
          include: {
            evidence: true,
            tasks: true,
          },
        },
        evidence: true,
        tasks: {
          include: {
            control: true,
            assignedTo: true,
          },
        },
        trustCenterProfile: true,
        trustCenterDocuments: true,
      },
    });

    return res.json(buildAuditorOverview(company));
  } catch (error) {
    console.error('GET /auditor-portal/overview error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/evidence', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const access = await assertAuditorAccess(req, res, companyId);
    if (!access) return;

    const evidence = await prisma.evidence.findMany({
      where: { companyId },
      include: {
        control: true,
        uploadedBy: {
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

    return res.json({
      evidence: evidence.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        fileType: item.fileType,
        fileSize: item.fileSize,
        status: item.status,
        createdAt: item.createdAt,
        uploadedBy: item.uploadedBy,
        control: item.control
          ? {
              id: item.control.id,
              framework: item.control.framework,
              reference: item.control.controlId,
              title: item.control.title,
              status: item.control.status,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('GET /auditor-portal/evidence error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/grants', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!canManageAuditorAccess(req.user)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const grants = await prisma.auditorAccessGrant.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ grants: grants.map(mapGrant) });
  } catch (error) {
    console.error('GET /auditor-portal/grants error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/grants', validate(grantSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const grant = await prisma.auditorAccessGrant.upsert({
      where: {
        companyId_email: {
          companyId,
          email: req.body.email.toLowerCase(),
        },
      },
      update: {
        name: req.body.name || null,
        status: req.body.status,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
        scope: req.body.scope,
      },
      create: {
        companyId,
        email: req.body.email.toLowerCase(),
        name: req.body.name || null,
        status: req.body.status,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
        scope: req.body.scope,
      },
    });

    return res.status(201).json({ grant: mapGrant(grant) });
  } catch (error) {
    console.error('POST /auditor-portal/grants error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.patch('/grants/:id', validate(updateGrantSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const existing = await prisma.auditorAccessGrant.findFirst({
      where: { id: req.params.id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Auditor access grant not found' });
    }

    const grant = await prisma.auditorAccessGrant.update({
      where: { id: existing.id },
      data: {
        ...(req.body.email !== undefined ? { email: req.body.email.toLowerCase() } : {}),
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.status !== undefined ? { status: req.body.status } : {}),
        ...(req.body.expiresAt !== undefined ? { expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null } : {}),
        ...(req.body.scope !== undefined ? { scope: req.body.scope } : {}),
      },
    });

    return res.json({ grant: mapGrant(grant) });
  } catch (error) {
    console.error('PATCH /auditor-portal/grants/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.delete('/grants/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const existing = await prisma.auditorAccessGrant.findFirst({
      where: { id: req.params.id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Auditor access grant not found' });
    }

    await prisma.auditorAccessGrant.delete({ where: { id: existing.id } });

    return res.json({ message: 'Auditor access grant deleted' });
  } catch (error) {
    console.error('DELETE /auditor-portal/grants/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

async function assertAuditorAccess(req, res, companyId) {
  if (canManageAuditorAccess(req.user)) return true;

  if (req.user.role !== 'AUDITOR') {
    res.status(403).json({ error: 'Auditor portal is read-only for auditors and administrators' });
    return false;
  }

  const grant = await prisma.auditorAccessGrant.findUnique({
    where: {
      companyId_email: {
        companyId,
        email: String(req.user.email || '').toLowerCase(),
      },
    },
  });

  if (!grant) return true;

  const expired = grant.expiresAt && new Date(grant.expiresAt).getTime() < Date.now();
  if (grant.status !== 'ACTIVE' || expired) {
    res.status(403).json({ error: 'Auditor access is not active' });
    return false;
  }

  return true;
}

function canManageAuditorAccess(user) {
  return user.role === 'CUSTOMER_ADMIN' || user.role === 'COMPLIANCE_MANAGER' || user.role === 'PLATFORM_ADMIN';
}

function buildAuditorOverview(company) {
  const controls = company.controls || [];
  const implemented = controls.filter((control) =>
    control.status === 'IMPLEMENTED' || control.status === 'NOT_APPLICABLE'
  ).length;
  const evidence = company.evidence || [];
  const tasks = company.tasks || [];
  const frameworks = (company.frameworks || []).map((framework) => {
    const frameworkControls = controls.filter((control) => control.framework === framework.framework);
    const frameworkImplemented = frameworkControls.filter((control) =>
      control.status === 'IMPLEMENTED' || control.status === 'NOT_APPLICABLE'
    ).length;

    return {
      id: framework.id,
      framework: framework.framework,
      enabled: framework.enabled,
      score: frameworkControls.length
        ? Math.round((frameworkImplemented / frameworkControls.length) * 100)
        : 0,
      controls: frameworkControls.length,
      evidence: frameworkControls.reduce((sum, control) => sum + (control.evidence?.length || 0), 0),
    };
  });

  return {
    company: {
      id: company.id,
      name: company.name,
      sector: company.sector,
      country: company.country,
    },
    summary: {
      readinessScore: controls.length ? Math.round((implemented / controls.length) * 100) : 0,
      controls: controls.length,
      evidence: evidence.length,
      openFindings: tasks.filter((task) => task.status !== 'DONE').length,
      publishedTrustCenter: Boolean(company.trustCenterProfile?.isPublished),
    },
    frameworks,
    findings: tasks
      .filter((task) => task.status !== 'DONE')
      .slice(0, 20)
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        control: task.control
          ? {
              framework: task.control.framework,
              reference: task.control.controlId,
              title: task.control.title,
            }
          : null,
        owner: task.assignedTo
          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim()
          : null,
      })),
    trustCenter: company.trustCenterProfile
      ? {
          slug: company.trustCenterProfile.slug,
          isPublished: company.trustCenterProfile.isPublished,
          documents: company.trustCenterDocuments.length,
        }
      : null,
  };
}

function mapGrant(grant) {
  return {
    id: grant.id,
    email: grant.email,
    name: grant.name,
    status: grant.status,
    scope: grant.scope || {},
    expiresAt: grant.expiresAt,
    createdAt: grant.createdAt,
    updatedAt: grant.updatedAt,
  };
}

module.exports = router;
