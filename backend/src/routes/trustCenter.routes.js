const express = require('express');
const { z } = require('zod');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { getCompanyId, requireWriteAccess } = require('../utils/systemRegisterAccess');

const trustCenterRoutes = express.Router();
const publicTrustCenterRoutes = express.Router();

const profileSchema = z.object({
  isPublished: z.boolean().optional(),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/).optional(),
  headline: z.string().max(180).optional().nullable(),
  overview: z.string().max(2000).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  publishedSections: z.record(z.string(), z.boolean()).optional(),
}).strict();

const documentSchema = z.object({
  title: z.string().min(1).max(160),
  category: z.enum(['SECURITY', 'PRIVACY', 'COMPLIANCE', 'REPORT', 'POLICY', 'OTHER']).default('SECURITY'),
  description: z.string().max(1200).optional().nullable(),
  evidenceId: z.string().min(1).optional().nullable(),
  isPublic: z.boolean().default(false),
}).strict();

const updateDocumentSchema = documentSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

publicTrustCenterRoutes.get('/trust-center/public/:slug', async (req, res) => {
  try {
    const profile = await prisma.trustCenterProfile.findUnique({
      where: { slug: req.params.slug },
      include: {
        company: {
          include: {
            frameworks: true,
            controls: {
              include: { evidence: true },
            },
            vendors: true,
            systems: true,
          },
        },
        documents: {
          where: { isPublic: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!profile || !profile.isPublished) {
      return res.status(404).json({ error: 'Trust center not found' });
    }

    return res.json(mapPublicTrustCenter(profile));
  } catch (error) {
    console.error('GET /trust-center/public/:slug error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

trustCenterRoutes.use(requireAuth);

trustCenterRoutes.get('/', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const profile = await ensureTrustCenterProfile(companyId);
    const documents = await prisma.trustCenterDocument.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });

    const evidence = await prisma.evidence.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        fileType: true,
        createdAt: true,
      },
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        frameworks: true,
        controls: { include: { evidence: true } },
        vendors: true,
        systems: true,
      },
    });

    return res.json({
      profile: mapProfile(profile),
      documents: documents.map(mapDocument),
      evidence,
      publicPreview: mapPublicTrustCenter({
        ...profile,
        company,
        documents: documents.filter((document) => document.isPublic),
      }),
    });
  } catch (error) {
    console.error('GET /trust-center error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

trustCenterRoutes.put('/profile', validate(profileSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const existing = await ensureTrustCenterProfile(companyId);

    const profile = await prisma.trustCenterProfile.update({
      where: { id: existing.id },
      data: {
        ...(req.body.isPublished !== undefined ? { isPublished: req.body.isPublished } : {}),
        ...(req.body.slug !== undefined ? { slug: req.body.slug } : {}),
        ...(req.body.headline !== undefined ? { headline: req.body.headline } : {}),
        ...(req.body.overview !== undefined ? { overview: req.body.overview } : {}),
        ...(req.body.contactEmail !== undefined ? { contactEmail: req.body.contactEmail } : {}),
        ...(req.body.publishedSections !== undefined ? { publishedSections: req.body.publishedSections } : {}),
      },
    });

    return res.json({ profile: mapProfile(profile) });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Trust center slug is already in use' });
    }

    console.error('PUT /trust-center/profile error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

trustCenterRoutes.post('/documents', validate(documentSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const profile = await ensureTrustCenterProfile(companyId);

    if (req.body.evidenceId) {
      const evidence = await prisma.evidence.findFirst({
        where: {
          id: req.body.evidenceId,
          companyId,
        },
      });

      if (!evidence) {
        return res.status(404).json({ error: 'Evidence not found' });
      }
    }

    const document = await prisma.trustCenterDocument.create({
      data: {
        companyId,
        profileId: profile.id,
        title: req.body.title,
        category: req.body.category,
        description: req.body.description || null,
        evidenceId: req.body.evidenceId || null,
        isPublic: req.body.isPublic,
      },
    });

    return res.status(201).json({ document: mapDocument(document) });
  } catch (error) {
    console.error('POST /trust-center/documents error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

trustCenterRoutes.patch('/documents/:id', validate(updateDocumentSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const existing = await prisma.trustCenterDocument.findFirst({
      where: { id: req.params.id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Trust center document not found' });
    }

    if (req.body.evidenceId) {
      const evidence = await prisma.evidence.findFirst({
        where: { id: req.body.evidenceId, companyId },
      });

      if (!evidence) {
        return res.status(404).json({ error: 'Evidence not found' });
      }
    }

    const document = await prisma.trustCenterDocument.update({
      where: { id: existing.id },
      data: {
        ...(req.body.title !== undefined ? { title: req.body.title } : {}),
        ...(req.body.category !== undefined ? { category: req.body.category } : {}),
        ...(req.body.description !== undefined ? { description: req.body.description } : {}),
        ...(req.body.evidenceId !== undefined ? { evidenceId: req.body.evidenceId } : {}),
        ...(req.body.isPublic !== undefined ? { isPublic: req.body.isPublic } : {}),
      },
    });

    return res.json({ document: mapDocument(document) });
  } catch (error) {
    console.error('PATCH /trust-center/documents/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

trustCenterRoutes.delete('/documents/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const existing = await prisma.trustCenterDocument.findFirst({
      where: { id: req.params.id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Trust center document not found' });
    }

    await prisma.trustCenterDocument.delete({ where: { id: existing.id } });

    return res.json({ message: 'Trust center document deleted' });
  } catch (error) {
    console.error('DELETE /trust-center/documents/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

async function ensureTrustCenterProfile(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  return prisma.trustCenterProfile.upsert({
    where: { companyId },
    update: {},
    create: {
      companyId,
      slug: `${slugify(company?.name || 'company')}-${companyId.slice(0, 6).toLowerCase()}`,
      headline: `${company?.name || 'Company'} trust center`,
      overview: 'Security, privacy, compliance, and audit readiness information.',
      publishedSections: {
        frameworks: true,
        documents: true,
        security: true,
        vendors: true,
      },
    },
  });
}

function mapProfile(profile) {
  return {
    id: profile.id,
    companyId: profile.companyId,
    slug: profile.slug,
    isPublished: profile.isPublished,
    headline: profile.headline,
    overview: profile.overview,
    contactEmail: profile.contactEmail,
    publishedSections: profile.publishedSections || {},
    publicUrl: `/trust/${profile.slug}`,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function mapDocument(document) {
  return {
    id: document.id,
    title: document.title,
    category: document.category,
    description: document.description,
    evidenceId: document.evidenceId,
    isPublic: document.isPublic,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function mapPublicTrustCenter(profile) {
  const company = profile.company;
  const controls = company?.controls || [];
  const implemented = controls.filter((control) =>
    control.status === 'IMPLEMENTED' || control.status === 'NOT_APPLICABLE'
  ).length;
  const frameworks = (company?.frameworks || [])
    .filter((framework) => framework.enabled !== false)
    .map((framework) => framework.framework);

  return {
    company: {
      name: company?.name || 'Company',
      sector: company?.sector || null,
      country: company?.country || null,
    },
    profile: {
      slug: profile.slug,
      headline: profile.headline,
      overview: profile.overview,
      contactEmail: profile.contactEmail,
      publishedSections: profile.publishedSections || {},
      updatedAt: profile.updatedAt,
    },
    posture: {
      frameworks,
      readinessScore: controls.length ? Math.round((implemented / controls.length) * 100) : 0,
      controlsTracked: controls.length,
      evidenceCount: controls.reduce((sum, control) => sum + (control.evidence?.length || 0), 0),
      systemsTracked: company?.systems?.length || 0,
      vendorsTracked: company?.vendors?.length || 0,
    },
    documents: (profile.documents || []).map(mapDocument),
  };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'company';
}

module.exports = {
  trustCenterRoutes,
  publicTrustCenterRoutes,
};
