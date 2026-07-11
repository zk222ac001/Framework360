const express = require('express');
const { z } = require('zod');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { getCompanyId, requireWriteAccess } = require('../utils/systemRegisterAccess');
const {
  INTEGRATION_PROVIDERS,
  getProvider,
  isSupportedProvider,
} = require('../utils/integrationCatalog');

const router = express.Router();

const connectionSchema = z.object({
  displayName: z.string().min(1).max(150).optional(),
  authType: z.string().min(1).max(80).optional(),
  config: z.record(z.string(), z.unknown()).optional().default({}),
}).strict();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const connections = await prisma.integrationConnection.findMany({
      where: { companyId },
      include: {
        evidenceJobs: {
          orderBy: { updatedAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { provider: 'asc' },
    });

    const connectionsByProvider = new Map(
      connections.map((connection) => [connection.provider, connection])
    );

    return res.json({
      providers: INTEGRATION_PROVIDERS.map((provider) => ({
        ...provider,
        connection: connectionsByProvider.has(provider.id)
          ? mapConnection(connectionsByProvider.get(provider.id))
          : null,
      })),
    });
  } catch (error) {
    console.error('GET /integrations error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.put('/:provider', validate(connectionSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const providerId = req.params.provider.toUpperCase();
    const provider = getProvider(providerId);

    if (!provider) {
      return res.status(404).json({ error: 'Integration provider not supported' });
    }

    const status = validateProviderConfig(provider, req.body.config).ok
      ? 'CONNECTED'
      : 'ERROR';
    const message =
      status === 'CONNECTED'
        ? 'Connection registered. Live provider API collection can be enabled with production credentials.'
        : 'Connection registered, but recommended configuration fields are missing.';

    const connection = await prisma.integrationConnection.upsert({
      where: {
        companyId_provider: {
          companyId,
          provider: providerId,
        },
      },
      update: {
        displayName: req.body.displayName || provider.name,
        authType: req.body.authType || provider.authType,
        config: req.body.config,
        status,
        lastSyncStatus: null,
        lastSyncMessage: message,
      },
      create: {
        companyId,
        provider: providerId,
        displayName: req.body.displayName || provider.name,
        authType: req.body.authType || provider.authType,
        config: req.body.config,
        status,
        lastSyncMessage: message,
      },
      include: {
        evidenceJobs: true,
      },
    });

    return res.json({ connection: mapConnection(connection) });
  } catch (error) {
    console.error('PUT /integrations/:provider error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/:provider/test', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const providerId = req.params.provider.toUpperCase();
    if (!isSupportedProvider(providerId)) {
      return res.status(404).json({ error: 'Integration provider not supported' });
    }

    const provider = getProvider(providerId);
    const connection = await prisma.integrationConnection.findUnique({
      where: {
        companyId_provider: {
          companyId,
          provider: providerId,
        },
      },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Integration connection not found' });
    }

    const result = validateProviderConfig(provider, connection.config || {});
    const status = result.ok ? 'CONNECTED' : 'ERROR';

    const updated = await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        status,
        lastSyncStatus: status,
        lastSyncMessage: result.message,
      },
      include: {
        evidenceJobs: true,
      },
    });

    return res.json({
      ok: result.ok,
      message: result.message,
      connection: mapConnection(updated),
    });
  } catch (error) {
    console.error('POST /integrations/:provider/test error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/:provider/disconnect', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const providerId = req.params.provider.toUpperCase();
    if (!isSupportedProvider(providerId)) {
      return res.status(404).json({ error: 'Integration provider not supported' });
    }

    const connection = await prisma.integrationConnection.findUnique({
      where: {
        companyId_provider: {
          companyId,
          provider: providerId,
        },
      },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Integration connection not found' });
    }

    const updated = await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        status: 'DISCONNECTED',
        lastSyncStatus: 'DISCONNECTED',
        lastSyncMessage: 'Integration disconnected by user.',
      },
      include: {
        evidenceJobs: true,
      },
    });

    return res.json({ connection: mapConnection(updated) });
  } catch (error) {
    console.error('POST /integrations/:provider/disconnect error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

function validateProviderConfig(provider, config) {
  const missing = provider.requiredFields.filter((field) => {
    const value = config?.[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length) {
    return {
      ok: false,
      message: `Missing recommended fields: ${missing.join(', ')}.`,
    };
  }

  return {
    ok: true,
    message: `${provider.name} configuration is ready for evidence collection jobs.`,
  };
}

function sanitizeConfig(config) {
  const sanitized = {};

  for (const [key, value] of Object.entries(config || {})) {
    if (/secret|token|password|private/i.test(key)) {
      sanitized[key] = value ? '********' : '';
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

function mapConnection(connection) {
  if (!connection) return null;

  return {
    id: connection.id,
    provider: connection.provider,
    displayName: connection.displayName,
    status: connection.status,
    authType: connection.authType,
    config: sanitizeConfig(connection.config || {}),
    lastSyncAt: connection.lastSyncAt,
    lastSyncStatus: connection.lastSyncStatus,
    lastSyncMessage: connection.lastSyncMessage,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
    evidenceJobs: (connection.evidenceJobs || []).map((job) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      schedule: job.schedule,
      lastRunAt: job.lastRunAt,
      lastRunStatus: job.lastRunStatus,
    })),
  };
}

module.exports = router;
