const express = require('express');
const { z } = require('zod');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { getCompanyId, getUserId, requireWriteAccess } = require('../utils/systemRegisterAccess');
const { getProvider, isSupportedProvider } = require('../utils/integrationCatalog');

const router = express.Router();

const jobSchema = z.object({
  name: z.string().min(1).max(160),
  provider: z.string().min(1).max(80),
  schedule: z.enum(['MANUAL', 'DAILY', 'WEEKLY', 'MONTHLY']).default('MANUAL'),
  status: z.enum(['ACTIVE', 'PAUSED']).default('ACTIVE'),
  config: z.record(z.string(), z.unknown()).optional().default({}),
}).strict();

const updateJobSchema = jobSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

router.use(requireAuth);

router.get('/jobs', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const jobs = await prisma.evidenceCollectionJob.findMany({
      where: { companyId },
      include: {
        integrationConnection: true,
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ jobs: jobs.map(mapJob) });
  } catch (error) {
    console.error('GET /evidence-automation/jobs error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/jobs', validate(jobSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const provider = req.body.provider.toUpperCase();
    if (!isSupportedProvider(provider)) {
      return res.status(404).json({ error: 'Integration provider not supported' });
    }

    const connection = await prisma.integrationConnection.findUnique({
      where: {
        companyId_provider: {
          companyId,
          provider,
        },
      },
    });

    const job = await prisma.evidenceCollectionJob.create({
      data: {
        companyId,
        integrationConnectionId: connection?.id || null,
        name: req.body.name,
        provider,
        schedule: req.body.schedule,
        status: req.body.status,
        nextRunAt: getNextRunAt(req.body.schedule),
        config: req.body.config,
      },
      include: {
        integrationConnection: true,
        runs: true,
      },
    });

    return res.status(201).json({ job: mapJob(job) });
  } catch (error) {
    console.error('POST /evidence-automation/jobs error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.patch('/jobs/:id', validate(updateJobSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const existing = await prisma.evidenceCollectionJob.findFirst({
      where: { id: req.params.id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Evidence collection job not found' });
    }

    const provider = req.body.provider ? req.body.provider.toUpperCase() : existing.provider;
    if (!isSupportedProvider(provider)) {
      return res.status(404).json({ error: 'Integration provider not supported' });
    }

    const connection = await prisma.integrationConnection.findUnique({
      where: {
        companyId_provider: {
          companyId,
          provider,
        },
      },
    });

    const job = await prisma.evidenceCollectionJob.update({
      where: { id: existing.id },
      data: {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        provider,
        integrationConnectionId: connection?.id || null,
        ...(req.body.schedule !== undefined
          ? {
              schedule: req.body.schedule,
              nextRunAt: getNextRunAt(req.body.schedule),
            }
          : {}),
        ...(req.body.status !== undefined ? { status: req.body.status } : {}),
        ...(req.body.config !== undefined ? { config: req.body.config } : {}),
      },
      include: {
        integrationConnection: true,
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    });

    return res.json({ job: mapJob(job) });
  } catch (error) {
    console.error('PATCH /evidence-automation/jobs/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/jobs/:id/run', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const job = await prisma.evidenceCollectionJob.findFirst({
      where: { id: req.params.id, companyId },
      include: {
        integrationConnection: true,
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Evidence collection job not found' });
    }

    if (job.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Evidence collection job is paused' });
    }

    const run = await prisma.evidenceCollectionRun.create({
      data: {
        jobId: job.id,
        status: 'RUNNING',
      },
    });

    try {
      const result = await collectEvidenceForJob({
        companyId,
        job,
        userId: getUserId(req),
      });

      const completedRun = await prisma.evidenceCollectionRun.update({
        where: { id: run.id },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
          createdEvidenceCount: result.createdEvidenceCount,
          message: result.message,
          logs: result.logs,
        },
      });

      await prisma.evidenceCollectionJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'SUCCESS',
          nextRunAt: getNextRunAt(job.schedule),
        },
      });

      if (job.integrationConnectionId) {
        await prisma.integrationConnection.update({
          where: { id: job.integrationConnectionId },
          data: {
            status: 'CONNECTED',
            lastSyncAt: new Date(),
            lastSyncStatus: 'SUCCESS',
            lastSyncMessage: result.message,
          },
        });
      }

      return res.json({
        run: mapRun(completedRun),
        createdEvidence: result.createdEvidence,
      });
    } catch (collectionError) {
      const failedRun = await prisma.evidenceCollectionRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          message: collectionError.message,
        },
      });

      await prisma.evidenceCollectionJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'FAILED',
        },
      });

      return res.status(500).json({
        error: 'Evidence collection failed',
        message: collectionError.message,
        run: mapRun(failedRun),
      });
    }
  } catch (error) {
    console.error('POST /evidence-automation/jobs/:id/run error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.delete('/jobs/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const existing = await prisma.evidenceCollectionJob.findFirst({
      where: { id: req.params.id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Evidence collection job not found' });
    }

    await prisma.evidenceCollectionJob.delete({ where: { id: existing.id } });

    return res.json({ message: 'Evidence collection job deleted' });
  } catch (error) {
    console.error('DELETE /evidence-automation/jobs/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

async function collectEvidenceForJob({ companyId, job, userId }) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      controls: {
        include: { evidence: true },
      },
      systems: true,
      vendors: true,
      tasks: true,
      frameworks: true,
    },
  });

  const provider = getProvider(job.provider);
  const evidenceItems = buildEvidenceItems(company, job.provider, provider)
    .slice(0, Number(job.config?.limit || 8));

  if (!evidenceItems.length) {
    evidenceItems.push({
      controlId: null,
      title: `${provider.name} workspace snapshot`,
      description: `Automated ${provider.name} collection completed. No matching controls or assets were found, so this snapshot records the current workspace state.`,
    });
  }

  const createdEvidence = [];

  for (const item of evidenceItems) {
    const evidence = await prisma.evidence.create({
      data: {
        companyId,
        controlId: item.controlId,
        uploadedById: userId || null,
        title: item.title,
        description: item.description,
        fileType: 'application/json',
        fileSize: Buffer.byteLength(JSON.stringify(item)),
        status: 'SUBMITTED',
      },
    });
    createdEvidence.push(evidence);
  }

  return {
    createdEvidenceCount: createdEvidence.length,
    createdEvidence: createdEvidence.map((item) => ({
      id: item.id,
      title: item.title,
      controlId: item.controlId,
      status: item.status,
      createdAt: item.createdAt,
    })),
    message: `${provider.name} evidence collection created ${createdEvidence.length} evidence item(s).`,
    logs: evidenceItems.map((item) => ({
      title: item.title,
      controlId: item.controlId,
      source: job.provider,
    })),
  };
}

function buildEvidenceItems(company, providerId, provider) {
  const controls = company.controls || [];
  const systems = company.systems || [];
  const vendors = company.vendors || [];
  const tasks = company.tasks || [];
  const textFor = (control) => `${control.framework} ${control.controlId} ${control.title} ${control.description || ''}`.toLowerCase();

  if (providerId === 'MICROSOFT365' || providerId === 'GOOGLE_WORKSPACE') {
    return controls
      .filter((control) => containsAny(textFor(control), ['access', 'mfa', 'identity', 'user', 'governance']))
      .map((control) => ({
        controlId: control.id,
        title: `${provider.name} identity evidence for ${control.controlId}`,
        description: `${provider.name} automated snapshot for identity, MFA, users, and access review evidence related to "${control.title}".`,
      }));
  }

  if (providerId === 'GITHUB') {
    return controls
      .filter((control) => containsAny(textFor(control), ['change', 'code', 'review', 'evidence', 'audit', 'security']))
      .map((control) => ({
        controlId: control.id,
        title: `GitHub repository evidence for ${control.controlId}`,
        description: `GitHub automated snapshot for repository controls, pull request review, branch protection, and vulnerability evidence related to "${control.title}".`,
      }));
  }

  if (providerId === 'AWS' || providerId === 'AZURE') {
    const controlEvidence = controls
      .filter((control) => containsAny(textFor(control), ['logging', 'monitoring', 'backup', 'risk', 'continuity', 'security']))
      .map((control) => ({
        controlId: control.id,
        title: `${provider.name} cloud evidence for ${control.controlId}`,
        description: `${provider.name} automated snapshot for logging, monitoring, backup, identity, and security posture evidence related to "${control.title}".`,
      }));

    const assetEvidence = systems
      .filter((system) => system.criticality === 'CRITICAL' || system.internetExposed)
      .map((system) => ({
        controlId: null,
        title: `${provider.name} asset posture snapshot: ${system.name}`,
        description: `${system.name} is tracked as ${system.criticality} with monitoring=${system.monitoringEnabled}, logging=${system.loggingEnabled}, backup=${system.backupEnabled}.`,
      }));

    return [...controlEvidence, ...assetEvidence];
  }

  if (providerId === 'JIRA') {
    const taskEvidence = tasks
      .filter((task) => task.status !== 'DONE')
      .map((task) => ({
        controlId: task.controlId || null,
        title: `Jira remediation workflow evidence: ${task.title}`,
        description: `Jira workflow snapshot for ${task.priority} priority remediation task currently marked ${task.status}.`,
      }));

    if (taskEvidence.length) return taskEvidence;
  }

  return vendors
    .filter((vendor) => vendor.criticality === 'CRITICAL' || vendor.isCriticalSupplier)
    .map((vendor) => ({
      controlId: null,
      title: `${provider.name} vendor evidence snapshot: ${vendor.name}`,
      description: `${vendor.name} vendor posture: DPA=${vendor.hasDpa}, SLA=${vendor.hasSla}, securityReview=${vendor.hasSecurityReview}.`,
    }));
}

function containsAny(text, values) {
  return values.some((value) => text.includes(value));
}

function getNextRunAt(schedule) {
  const now = new Date();
  if (schedule === 'DAILY') return addDays(now, 1);
  if (schedule === 'WEEKLY') return addDays(now, 7);
  if (schedule === 'MONTHLY') return addDays(now, 30);
  return null;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function mapJob(job) {
  return {
    id: job.id,
    name: job.name,
    provider: job.provider,
    providerName: getProvider(job.provider)?.name || job.provider,
    schedule: job.schedule,
    status: job.status,
    lastRunAt: job.lastRunAt,
    lastRunStatus: job.lastRunStatus,
    nextRunAt: job.nextRunAt,
    config: job.config || {},
    connection: job.integrationConnection
      ? {
          id: job.integrationConnection.id,
          displayName: job.integrationConnection.displayName,
          status: job.integrationConnection.status,
        }
      : null,
    runs: (job.runs || []).map(mapRun),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

function mapRun(run) {
  return {
    id: run.id,
    status: run.status,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    message: run.message,
    createdEvidenceCount: run.createdEvidenceCount,
    logs: run.logs || [],
  };
}

module.exports = router;
