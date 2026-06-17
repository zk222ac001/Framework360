const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

async function createCompanyWithUser({
  email = 'user@test.dk',
  password = 'password123',
  role = 'CUSTOMER_ADMIN',
  companyName = 'Test ApS',
  sector = 'IT',
} = {}) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const company = await prisma.company.create({
    data: {
      name: companyName,
      sector,
      users: {
        create: {
          firstName: 'Test',
          lastName: 'User',
          email,
          password: hashedPassword,
          role,
          isActive: true,
          mustChangePassword: false,
          onboardingCompleted: true,
        },
      },
    },
    include: {
      users: true,
    },
  });

  return {
    company,
    user: company.users[0],
    password,
  };
}

async function login(email, password = 'password123') {
  const res = await request(app).post('/auth/login').send({
    email,
    password,
  });

  return {
    res,
    cookies: res.headers['set-cookie'],
  };
}

async function createFrameworkWithAssessment({
  companyId,
  code = 'ISO27001',
  requirementWeight = 3,
} = {}) {
  const assessment = await prisma.companyFramework.upsert({
    where: {
      companyId_framework: {
        companyId,
        framework: code,
      },
    },
    update: { enabled: true },
    create: {
      companyId,
      framework: code,
      enabled: true,
    },
  });

  const control = await prisma.control.create({
    data: {
      companyId,
      framework: code,
      controlId: `${code}-TEST-1`,
      title: 'Is MFA enabled?',
      description: 'MFA should be enabled.',
      riskLevel: requirementWeight >= 3 ? 'HIGH' : 'MEDIUM',
      status: 'NOT_STARTED',
    },
  });

  const requirement = {
    ...control,
    question: control.title,
    reference: control.controlId,
  };

  const framework = {
    id: code,
    code,
    name: code,
    sections: [
      {
        id: `${code}-controls`,
        title: 'Security controls',
        requirements: [requirement],
      },
    ],
  };

  const answer = {
    id: requirement.id,
    assessmentId: assessment.id,
    requirementId: requirement.id,
    status: 'UNANSWERED',
  };

  return {
    framework,
    assessment,
    requirement,
    answer,
  };
}

module.exports = {
  app,
  prisma,
  createCompanyWithUser,
  login,
  createFrameworkWithAssessment,
};
