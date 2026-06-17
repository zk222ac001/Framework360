const request = require('supertest');
const app = require('../src/app');
const bcrypt = require('bcrypt');
const prisma = require('../src/db');

describe('Dashboard', () => {
  it('should return dashboard data', async () => {
    const password = await bcrypt.hash('password123', 10);

    const company = await prisma.company.create({
      data: {
        name: 'Test ApS',
        sector: 'IT',
        users: {
          create: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@test.dk',
            password,
            role: 'CUSTOMER_ADMIN',
            isActive: true,
          },
        },
      },
      include: {
        users: true,
      },
    });

    await prisma.companyFramework.create({
      data: {
        companyId: company.id,
        framework: 'GDPR',
      },
    });

    const control = await prisma.control.create({
      data: {
        companyId: company.id,
        framework: 'GDPR',
        controlId: 'GDPR-1',
        title: 'Privacy governance',
        status: 'IN_PROGRESS',
        riskLevel: 'HIGH',
      },
    });

    await prisma.evidence.create({
      data: {
        companyId: company.id,
        controlId: control.id,
        uploadedById: company.users[0].id,
        title: 'Privacy policy',
        fileType: 'application/pdf',
        fileSize: 1234,
      },
    });

    await prisma.vendor.create({
      data: {
        companyId: company.id,
        name: 'Critical Vendor',
        service: 'Cloud hosting',
        riskLevel: 'HIGH',
      },
    });

    await prisma.task.create({
      data: {
        companyId: company.id,
        controlId: control.id,
        assignedToId: company.users[0].id,
        title: 'Finish privacy governance',
        status: 'OPEN',
        priority: 'HIGH',
      },
    });

    const login = await request(app).post('/auth/login').send({
      email: 'test@test.dk',
      password: 'password123',
    });

    const cookies = login.headers['set-cookie'];

    const res = await request(app)
      .get('/dashboard')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.company).toBeDefined();
    expect(res.body.frameworks).toHaveLength(1);
    expect(res.body.frameworks[0]).toMatchObject({
      code: 'GDPR',
      name: 'GDPR',
      score: 50,
      gapsCount: 1,
    });
    expect(res.body.topActions.length).toBeGreaterThan(0);
    expect(res.body.vendorRisk.totalVendors).toBe(1);
    expect(res.body.evidenceAnalytics.totalEvidence).toBe(1);
  });
});
