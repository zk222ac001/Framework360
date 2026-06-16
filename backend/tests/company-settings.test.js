const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

async function createUserWithCompany({
  email = 'admin@test.dk',
  role = 'CUSTOMER_ADMIN',
  companyName = 'Test Company ApS',
} = {}) {
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.create({
    data: {
      name: companyName,
      cvr: '12345678',
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
});
