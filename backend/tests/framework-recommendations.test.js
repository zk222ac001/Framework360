const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

async function createUserWithCompany({
  email = 'recommend@test.dk',
  sector = 'FINANCE',
} = {}) {
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.create({
    data: {
      name: 'Recommendation Test Company ApS',
      cvr: String(Math.floor(10000000 + Math.random() * 90000000)),
      sector,
      country: 'Denmark',
    },
  });

  const user = await prisma.user.create({
    data: {
      firstName: 'Recommend',
      lastName: 'User',
      email,
      password,
      role: 'CUSTOMER_ADMIN',
      isActive: true,
      companyId: company.id,
    },
  });

  const loginRes = await request(app)
    .post('/auth/login')
    .send({
      email,
      password: 'password123',
    });

  expect(loginRes.statusCode).toBe(200);

  return {
    user,
    company,
    cookies: loginRes.headers['set-cookie'],
  };
}

async function createFrameworks() {
  const frameworks = [
    ['GDPR', 'GDPR', 'EU Law'],
    ['DORA', 'DORA', 'EU Law'],
    ['NIS2', 'NIS2', 'EU Law'],
    ['ISO27001', 'ISO 27001', 'Standard'],
    ['D_MAERKET', 'D-mærket', 'Trust Mark'],
    ['PCI_DSS', 'PCI DSS', 'Standard'],
    ['AI_ACT', 'EU AI Act', 'EU Law'],
    ['SOC2', 'SOC 2', 'Standard'],
    ['CER', 'CER', 'EU Law'],
  ];

  for (const [code, name, category] of frameworks) {
    await prisma.frameworkDefinition.upsert({
      where: { code },
      create: {
        code,
        name,
        category,
        description: `${name} description`,
        isActive: true,
      },
      update: {
        name,
        category,
        description: `${name} description`,
        isActive: true,
      },
    });
  }
}

describe('Framework recommendations', () => {
  it('should return grouped recommendations for finance company', async () => {
    await createFrameworks();

    const { cookies } = await createUserWithCompany({
      email: 'finance-recommend@test.dk',
      sector: 'FINANCE',
    });

    const res = await request(app)
      .get('/onboarding/recommended-frameworks')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.sector).toBe('FINANCE');
    expect(Array.isArray(res.body.required)).toBe(true);
    expect(Array.isArray(res.body.recommended)).toBe(true);
    expect(Array.isArray(res.body.other)).toBe(true);

    const requiredCodes = res.body.required.map((item) => item.code);
    const recommendedCodes = res.body.recommended.map((item) => item.code);

    expect(requiredCodes).toContain('DORA');
    expect(requiredCodes).toContain('GDPR');
    expect(recommendedCodes).toContain('ISO27001');
  });

  it('should use scope answers in recommendations', async () => {
    await createFrameworks();

    const { cookies } = await createUserWithCompany({
      email: 'scope-recommend@test.dk',
      sector: 'RETAIL',
    });

    await request(app)
      .post('/onboarding/scope')
      .set('Cookie', cookies)
      .send({
        employeeCount: 'TEN_TO_FORTY_NINE',
        processesPersonalData: true,
        acceptsCardPayments: true,
        usesAiSystems: true,
      });

    const res = await request(app)
      .get('/onboarding/recommended-frameworks')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.scopeCompleted).toBe(true);

    const requiredCodes = res.body.required.map((item) => item.code);
    const recommendedCodes = res.body.recommended.map((item) => item.code);

    expect(requiredCodes).toContain('GDPR');
    expect(recommendedCodes).toContain('PCI_DSS');
    expect(recommendedCodes).toContain('AI_ACT');
  });

  it('should reject unauthenticated recommendation access', async () => {
    const res = await request(app)
      .get('/onboarding/recommended-frameworks');

    expect(res.statusCode).toBe(401);
  });
});