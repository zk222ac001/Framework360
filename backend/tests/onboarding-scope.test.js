const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

function generateCvr() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

async function createUserWithCompany({
  email = 'scope@test.dk',
  sector = 'IT',
  role = 'CUSTOMER_ADMIN',
} = {}) {
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.create({
    data: {
      name: 'Scope Test Company ApS',
      cvr: generateCvr(),
      sector,
      country: 'Denmark',
    },
  });

  const user = await prisma.user.create({
    data: {
      firstName: 'Scope',
      lastName: 'User',
      email,
      password,
      role,
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

describe('Onboarding scope', () => {
  it('should return null scope when no scope exists', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'no-scope@test.dk',
    });

    const res = await request(app)
      .get('/onboarding/scope')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.scope).toBeNull();
  });

  it('should create company scope', async () => {
    const { company, cookies } = await createUserWithCompany({
      email: 'create-scope@test.dk',
    });

    const res = await request(app)
      .post('/onboarding/scope')
      .set('Cookie', cookies)
      .send({
        employeeCount: 'FIFTY_TO_TWO_FORTY_NINE',
        processesPersonalData: true,
        handlesSensitiveData: true,
        acceptsCardPayments: true,
        usesAiSystems: false,
        servesFinancialCustomers: false,
        isDigitalServiceProvider: true,
        operatesCriticalInfrastructure: false,
        hasEuCustomers: true,
        usesCloudProviders: true,
        hasCriticalSuppliers: true,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Company scope saved');
    expect(res.body.scope.companyId).toBe(company.id);
    expect(res.body.scope.employeeCount).toBe('FIFTY_TO_TWO_FORTY_NINE');
    expect(res.body.scope.processesPersonalData).toBe(true);
    expect(res.body.scope.handlesSensitiveData).toBe(true);
    expect(res.body.scope.acceptsCardPayments).toBe(true);
    expect(res.body.scope.isDigitalServiceProvider).toBe(true);
    expect(res.body.scope.completedAt).toBeTruthy();
  });

  it('should return existing company scope', async () => {
    const { company, cookies } = await createUserWithCompany({
      email: 'get-existing-scope@test.dk',
    });

    await prisma.companyScope.create({
      data: {
        companyId: company.id,
        employeeCount: 'TEN_TO_FORTY_NINE',
        processesPersonalData: true,
        usesCloudProviders: true,
        completedAt: new Date(),
      },
    });

    const res = await request(app)
      .get('/onboarding/scope')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.scope.companyId).toBe(company.id);
    expect(res.body.scope.employeeCount).toBe('TEN_TO_FORTY_NINE');
    expect(res.body.scope.processesPersonalData).toBe(true);
    expect(res.body.scope.usesCloudProviders).toBe(true);
  });

  it('should update existing company scope with POST upsert', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'upsert-scope@test.dk',
    });

    const firstRes = await request(app)
      .post('/onboarding/scope')
      .set('Cookie', cookies)
      .send({
        employeeCount: 'ONE_TO_NINE',
        processesPersonalData: false,
        usesCloudProviders: false,
      });

    expect(firstRes.statusCode).toBe(201);
    expect(firstRes.body.scope.employeeCount).toBe('ONE_TO_NINE');
    expect(firstRes.body.scope.processesPersonalData).toBe(false);

    const secondRes = await request(app)
      .post('/onboarding/scope')
      .set('Cookie', cookies)
      .send({
        employeeCount: 'TEN_TO_FORTY_NINE',
        processesPersonalData: true,
        usesCloudProviders: true,
      });

    expect(secondRes.statusCode).toBe(201);
    expect(secondRes.body.scope.employeeCount).toBe('TEN_TO_FORTY_NINE');
    expect(secondRes.body.scope.processesPersonalData).toBe(true);
    expect(secondRes.body.scope.usesCloudProviders).toBe(true);
  });

  it('should patch existing company scope', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'patch-scope@test.dk',
    });

    const createRes = await request(app)
      .post('/onboarding/scope')
      .set('Cookie', cookies)
      .send({
        employeeCount: 'ONE_TO_NINE',
        processesPersonalData: false,
        usesCloudProviders: false,
      });

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .patch('/onboarding/scope')
      .set('Cookie', cookies)
      .send({
        processesPersonalData: true,
        usesCloudProviders: true,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Company scope updated');
    expect(res.body.scope.employeeCount).toBe('ONE_TO_NINE');
    expect(res.body.scope.processesPersonalData).toBe(true);
    expect(res.body.scope.usesCloudProviders).toBe(true);
  });

  it('should return 404 when patching scope before it exists', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'missing-patch-scope@test.dk',
    });

    const res = await request(app)
      .patch('/onboarding/scope')
      .set('Cookie', cookies)
      .send({
        processesPersonalData: true,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Company scope not found');
  });

  it('should reject invalid scope body', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'invalid-scope@test.dk',
    });

    const res = await request(app)
      .post('/onboarding/scope')
      .set('Cookie', cookies)
      .send({
        employeeCount: 'INVALID_VALUE',
      });

    expect(res.statusCode).toBe(400);
  });

  it('should reject extra unknown fields', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'extra-field-scope@test.dk',
    });

    const res = await request(app)
      .post('/onboarding/scope')
      .set('Cookie', cookies)
      .send({
        employeeCount: 'TEN_TO_FORTY_NINE',
        unknownField: true,
      });

    expect(res.statusCode).toBe(400);
  });

  it('should reject unauthenticated scope access', async () => {
    const res = await request(app).get('/onboarding/scope');

    expect(res.statusCode).toBe(401);
  });
});