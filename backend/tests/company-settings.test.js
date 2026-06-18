const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

async function createUserWithCompany({
  email = 'admin@test.dk',
  role = 'CUSTOMER_ADMIN',
  companyName = 'Test Company ApS',
  cvr = '12345678',
} = {}) {
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.create({
    data: {
      name: companyName,
      cvr,
      sector: 'IT',
      country: 'Denmark',
    },
  });

  await prisma.user.create({
    data: {
      firstName: 'Test',
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
    company,
    cookies: loginRes.headers['set-cookie'],
  };
}

describe('Company settings', () => {
  it('should return the authenticated users own company', async () => {
    const { company, cookies } = await createUserWithCompany();

    const res = await request(app)
      .get('/companies/me')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(company.id);
    expect(res.body.name).toBe('Test Company ApS');
    expect(res.body.cvr).toBe('12345678');
    expect(res.body.country).toBe('Denmark');
  });

  it('should allow CUSTOMER_ADMIN to update own company', async () => {
    const { company, cookies } = await createUserWithCompany({
      email: 'customeradmin@test.dk',
      role: 'CUSTOMER_ADMIN',
    });

    const res = await request(app)
      .patch('/companies/me')
      .set('Cookie', cookies)
      .send({
        name: 'Updated Company ApS',
        country: 'Denmark',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(company.id);
    expect(res.body.name).toBe('Updated Company APS');
    expect(res.body.country).toBe('Denmark');
  });

  it('should allow CUSTOMER_ADMIN to partially update own company', async () => {
    const { company, cookies } = await createUserWithCompany({
      email: 'partialupdate@test.dk',
      role: 'CUSTOMER_ADMIN',
      companyName: 'Partial Update APS',
    });

    const res = await request(app)
      .patch('/companies/me')
      .set('Cookie', cookies)
      .send({
        name: 'Partially Updated APS',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(company.id);
    expect(res.body.name).toBe('Partially Updated APS');
    expect(res.body.cvr).toBe('12345678');
    expect(res.body.country).toBe('Denmark');
  });

  it('should reject invalid CVR when updating own company', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'invalidcvr@test.dk',
      role: 'CUSTOMER_ADMIN',
    });

    const res = await request(app)
      .patch('/companies/me')
      .set('Cookie', cookies)
      .send({
        cvr: 'abc123',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.details.fieldErrors.cvr).toContain(
      'CVR must be exactly 8 digits',
    );
  });

  it('should reject CVR already used by another company', async () => {
    const first = await createUserWithCompany({
      email: 'firstcvr@test.dk',
      role: 'CUSTOMER_ADMIN',
      cvr: '11111111',
    });
    const second = await createUserWithCompany({
      email: 'secondcvr@test.dk',
      role: 'CUSTOMER_ADMIN',
      companyName: 'Second Company ApS',
      cvr: '22222222',
    });

    const res = await request(app)
      .patch('/companies/me')
      .set('Cookie', second.cookies)
      .send({
        cvr: first.company.cvr,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('CVR is already registered to another company');
  });

  it('should reject blank onboarding CVR payloads', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'blankcvr@test.dk',
      role: 'CUSTOMER_ADMIN',
    });

    const res = await request(app)
      .patch('/companies/me')
      .set('Cookie', cookies)
      .send({
        name: 'Valid Company ApS',
        cvr: null,
        sector: 'IT',
        country: 'Denmark',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.details.fieldErrors.cvr).toBeDefined();
  });

  it('should reject blank onboarding sector and country payloads', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'missingcompanyfields@test.dk',
      role: 'CUSTOMER_ADMIN',
    });

    const sectorRes = await request(app)
      .patch('/companies/me')
      .set('Cookie', cookies)
      .send({
        name: 'Valid Company ApS',
        sector: null,
        country: 'Denmark',
      });

    const countryRes = await request(app)
      .patch('/companies/me')
      .set('Cookie', cookies)
      .send({
        name: 'Valid Company ApS',
        sector: 'IT',
        country: null,
      });

    expect(sectorRes.statusCode).toBe(400);
    expect(sectorRes.body.details.fieldErrors.sector).toBeDefined();
    expect(countryRes.statusCode).toBe(400);
    expect(countryRes.body.details.fieldErrors.country).toBeDefined();
  });

  it('should prevent evidence contributors from updating company settings', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'normaluser@test.dk',
      role: 'EVIDENCE_CONTRIBUTOR',
    });

    const res = await request(app)
      .patch('/companies/me')
      .set('Cookie', cookies)
      .send({
        name: 'Should Not Update APS',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('You do not have permission to update company settings');
  });

  it('should prevent CUSTOMER_ADMIN from using admin company list endpoint', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'blockedadmin@test.dk',
      role: 'CUSTOMER_ADMIN',
    });

    const res = await request(app)
      .get('/companies')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('You do not have permission to view all companies');
  });

  it('should allow PLATFORM_ADMIN to manage companies by string id', async () => {
    const target = await createUserWithCompany({
      email: 'target-company@test.dk',
      companyName: 'Target Company ApS',
      cvr: '33333333',
    });
    const admin = await createUserWithCompany({
      email: 'platform-company-admin@test.dk',
      role: 'PLATFORM_ADMIN',
      companyName: 'Platform Admin ApS',
      cvr: '44444444',
    });

    const getRes = await request(app)
      .get(`/companies/${target.company.id}`)
      .set('Cookie', admin.cookies);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.id).toBe(target.company.id);

    const updateRes = await request(app)
      .put(`/companies/${target.company.id}`)
      .set('Cookie', admin.cookies)
      .send({
        name: 'Admin Updated Company ApS',
        cvr: '55555555',
        sector: 'IT',
        country: 'Denmark',
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.id).toBe(target.company.id);
    expect(updateRes.body.name).toBe('Admin Updated Company APS');

    const deleteRes = await request(app)
      .delete(`/companies/${target.company.id}`)
      .set('Cookie', admin.cookies);

    expect(deleteRes.statusCode).toBe(204);
  });
});
