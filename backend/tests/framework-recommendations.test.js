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

describe('Framework recommendations', () => {
  it('should return grouped recommendations for finance company', async () => {
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
