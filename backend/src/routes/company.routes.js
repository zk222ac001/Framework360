const express = require('express');

const { validate } = require('../middleware/validate.middleware');
const { companySchema, updateMyCompanySchema } = require('../validators/company.validator');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { createTrialSubscriptionData } = require('../services/subscription.service');
const {
  normalizeCompanyName,
  normalizeUpperEnum,
  normalizeNullableString,
} = require('../utils/normalizeInput');

const router = express.Router();

function isPlatformAdmin(user) {
  return user.role === 'PLATFORM_ADMIN';
}

function isCustomerAdmin(user) {
  return user.role === 'CUSTOMER_ADMIN';
}

function canManageOwnCompany(user) {
  return isPlatformAdmin(user) || isCustomerAdmin(user);
}

function isUniqueCvrError(error) {
  return (
    error?.code === 'P2002' &&
    Array.isArray(error?.meta?.target) &&
    error.meta.target.includes('cvr')
  );
}

function handleCompanyWriteError(error, res) {
  if (isUniqueCvrError(error)) {
    return res.status(409).json({
      error: 'CVR is already registered to another company',
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
}

function parseRecordId(value) {
  const id = String(value || '').trim();
  return id.length ? id : null;
}

/**
 * GET /companies/me
 * Returns the authenticated user's own company.
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        error: 'User is not attached to a company',
      });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        frameworks: true,
      },
    });

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
      });
    }

    return res.json(company);
  } catch (error) {
    console.error('GET /companies/me error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * PATCH /companies/me
 * Allows CUSTOMER_ADMIN to update their own company.
 * PLATFORM_ADMIN is also allowed.
 */
router.patch('/me', requireAuth, validate(updateMyCompanySchema), async (req, res) => {
  try {
    const user = req.user;

    if (!user.companyId) {
      return res.status(400).json({
        error: 'User is not attached to a company',
      });
    }

    if (!canManageOwnCompany(user)) {
      return res.status(403).json({
        error: 'You do not have permission to update company settings',
      });
    }

    const { name, cvr, sector, country } = req.body;

    const data = {};

    if (name !== undefined) {
      data.name = normalizeCompanyName(name);
    }

    if (cvr !== undefined) {
      data.cvr = normalizeNullableString(cvr);
    }

    if (sector !== undefined) {
      data.sector = sector ? normalizeUpperEnum(sector) : null;
    }

    if (country !== undefined) {
      data.country = normalizeNullableString(country);
    }

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data,
      include: {
        frameworks: true,
      },
    });

    return res.json(company);
  } catch (error) {
    console.error('PATCH /companies/me error:', error);

    return handleCompanyWriteError(error, res);
  }
});

/**
 * GET /companies
 * Currently admin-style endpoint.
 * For now: only PLATFORM_ADMIN should access all companies.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        error: 'You do not have permission to view all companies',
      });
    }

    const companies = await prisma.company.findMany({
      orderBy: { id: 'asc' },
      include: {
        frameworks: true,
      },
    });

    return res.json(companies);
  } catch (error) {
    console.error('GET /companies error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /companies/:id
 * Admin-style endpoint.
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        error: 'You do not have permission to view this company',
      });
    }

    const id = parseRecordId(req.params.id);

    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        frameworks: true,
      },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    return res.json(company);
  } catch (error) {
    console.error('GET /companies/:id error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /companies
 * Admin-style endpoint.
 */
router.post('/', requireAuth, validate(companySchema), async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        error: 'You do not have permission to create companies',
      });
    }

    const { name, cvr, sector, country } = req.body;

    const company = await prisma.company.create({
      data: {
        name: normalizeCompanyName(name),
        cvr: normalizeNullableString(cvr),
        sector: sector ? normalizeUpperEnum(sector) : null,
        country: normalizeNullableString(country),
        ...createTrialSubscriptionData(),
      },
    });

    return res.status(201).json(company);
  } catch (error) {
    console.error('POST /companies error:', error);

    return handleCompanyWriteError(error, res);
  }
});

/**
 * PUT /companies/:id
 * Admin-style endpoint.
 */
router.put('/:id', requireAuth, validate(companySchema), async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        error: 'You do not have permission to update this company',
      });
    }

    const id = parseRecordId(req.params.id);
    const { name, cvr, sector, country } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: normalizeCompanyName(name),
        cvr: normalizeNullableString(cvr),
        sector: sector ? normalizeUpperEnum(sector) : null,
        country: normalizeNullableString(country),
      },
    });

    return res.json(company);
  } catch (error) {
    console.error('PUT /companies/:id error:', error);

    return handleCompanyWriteError(error, res);
  }
});

/**
 * DELETE /companies/:id
 * Admin-style endpoint.
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        error: 'You do not have permission to delete companies',
      });
    }

    const id = parseRecordId(req.params.id);

    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    await prisma.company.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('DELETE /companies/:id error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
