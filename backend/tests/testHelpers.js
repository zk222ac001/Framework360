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
  const framework = await prisma.frameworkDefinition.create({
    data: {
      code,
      name: code,
      description: 'Test framework',
      category: 'Test',
      isActive: true,
      sections: {
        create: [
          {
            title: 'Security controls',
            description: 'Test section',
            order: 1,
            weight: 1,
            requirements: {
              create: [
                {
                  question: 'Is MFA enabled?',
                  description: 'MFA should be enabled.',
                  reference: 'TEST-1',
                  implementationGuide: 'Enable MFA for all users.',
                  exampleEvidence: 'Screenshot of MFA policy.',
                  riskIfMissing: 'Account takeover risk.',
                  order: 1,
                  weight: requirementWeight,
                  isRequired: true,
                  isActive: true,
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      sections: {
        include: {
          requirements: true,
        },
      },
    },
  });

  const assessment = await prisma.companyFrameworkAssessment.create({
    data: {
      companyId,
      frameworkDefinitionId: framework.id,
      status: 'IN_PROGRESS',
      score: 0,
    },
  });

  const requirement = framework.sections[0].requirements[0];

  const answer = await prisma.frameworkRequirementAnswer.create({
    data: {
      assessmentId: assessment.id,
      requirementId: requirement.id,
      status: 'UNANSWERED',
    },
  });

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