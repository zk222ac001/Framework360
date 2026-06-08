const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { getFrameworksFromSector } = require('../utils/frameworkMapping');
const { logAction } = require('../utils/audit');
const { setAuthCookie, clearAuthCookie } = require('../utils/cookies');
const {
  normalizeEmail,
  normalizeName,
  normalizeCompanyName,
  normalizeUpperEnum,
  normalizeNullableString,
} = require('../utils/normalizeInput');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateMyProfileSchema,
  updateMyEmailSchema, } = require('../validators/auth.validator');
const router = express.Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      companyName,
      cvr,
      sector,
      country,
    } = req.body;

    const normalizedFirstName = normalizeName(firstName);
    const normalizedLastName = normalizeName(lastName);
    const normalizedEmail = normalizeEmail(email);
    const normalizedCompanyName = normalizeCompanyName(companyName);
    const normalizedCvr = normalizeNullableString(cvr);
    const normalizedSector = sector ? normalizeUpperEnum(sector) : null;
    const normalizedCountry = normalizeNullableString(country);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    let company = null;

    if (normalizedCvr) {
      company = await prisma.company.findUnique({
        where: { cvr: normalizedCvr },
      });
    }

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: normalizedCompanyName,
          cvr: normalizedCvr,
          sector: normalizedSector,
          country: normalizedCountry,
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const user = await prisma.user.create({
      data: {
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        password: hashedPassword,
        authProvider: 'LOCAL',
        providerId: null,
        role: 'CUSTOMER_ADMIN',
        isActive: true,
        mustChangePassword: false,
        onboardingCompleted: false,
        companyId: company.id,
      },
    });

    const frameworks = getFrameworksFromSector(company.sector);

    await prisma.$transaction(
      frameworks.map((framework) =>
        prisma.companyFramework.upsert({
          where: {
            companyId_framework: {
              companyId: company.id,
              framework,
            },
          },
          update: {},
          create: {
            companyId: company.id,
            framework,
          },
        })
      )
    );

    const result = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        onboardingCompleted: true,
        createdAt: true,
        company: {
          include: {
            frameworks: true,
          },
        },
      },
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('POST /auth/register error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      include: {
        company: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'User is not active' });
    }

    if (!user.password) {
      return res.status(401).json({
        error: 'This account uses SSO. Please sign in with your identity provider.',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await logAction({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
      metadata: {
        email: user.email,
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '8h' }
    );

    setAuthCookie(res, token, rememberMe);

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        onboardingCompleted: user.onboardingCompleted,
        companyId: user.companyId,
        company: user.company,
      },
    });
  } catch (error) {
    console.error('POST /auth/login error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        onboardingCompleted: true,
        companyId: true,
        company: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('GET /auth/me error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});
router.patch('/me/profile', requireAuth, validate(updateMyProfileSchema), async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid authentication session',
      });
    }

    const { firstName, lastName } = req.body;

    const data = {};

    if (firstName !== undefined) {
      data.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      data.lastName = lastName.trim();
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: 'At least one field must be provided',
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            cvr: true,
            sector: true,
            country: true,
          },
        },
      },
    });

    return res.json({
      message: 'Profile updated',
      user,
    });
  } catch (error) {
    console.error('PATCH /auth/me/profile error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});
router.patch('/me/email', requireAuth, validate(updateMyEmailSchema), async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid authentication session',
      });
    }

    const { currentPassword, newEmail } = req.body;
    const normalizedEmail = newEmail.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    if (!existingUser.password) {
      return res.status(400).json({
        error: 'Email cannot be changed for this account',
      });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, existingUser.password);

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Current password is incorrect',
      });
    }

    const emailAlreadyUsed = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
      },
    });

    if (emailAlreadyUsed && emailAlreadyUsed.id !== userId) {
      return res.status(409).json({
        error: 'Email is already in use',
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            cvr: true,
            sector: true,
            country: true,
          },
        },
      },
    });

    return res.json({
      message: 'Email updated',
      user,
    });
  } catch (error) {
    console.error('PATCH /auth/me/email error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});
router.post('/logout', requireAuth, async (req, res) => {
  try {
    clearAuthCookie(res);

    return res.json({
      message: 'Logged out',
    });
  } catch (error) {
    console.error('POST /auth/logout error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          mustChangePassword: false,
        },
      });

      await logAction({
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        entity: 'User',
        entityId: user.id,
        metadata: {
          email: user.email,
        },
      });

      return res.json({
        message: 'Password updated',
      });
    } catch (error) {
      console.error('POST /auth/change-password error:', error);

      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
);

module.exports = router;