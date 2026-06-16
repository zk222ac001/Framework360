const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

function generateCvr() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

async function createUserWithCompany({
  email = 'system-register@test.dk',
  role = 'CUSTOMER_ADMIN',
} = {}) {
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.create({
    data: {
      name: 'System Register Company ApS',
      cvr: generateCvr(),
      sector: 'IT',
      country: 'Denmark',
    },
  });

  const user = await prisma.user.create({
    data: {
      firstName: 'System',
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

describe('System register MVP', () => {
  it('should create, list, update and delete vendor', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'vendor-crud@test.dk',
    });

    const createRes = await request(app)
      .post('/vendors')
      .set('Cookie', cookies)
      .send({
        name: 'Microsoft',
        criticality: 'HIGH',
        isCriticalSupplier: true,
        hasDpa: true,
        hasSla: true,
        country: 'Denmark',
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.vendor.name).toBe('Microsoft');

    const vendorId = createRes.body.vendor.id;

    const listRes = await request(app)
      .get('/vendors')
      .set('Cookie', cookies);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.vendors).toHaveLength(1);

    const updateRes = await request(app)
      .patch(`/vendors/${vendorId}`)
      .set('Cookie', cookies)
      .send({
        hasSecurityReview: true,
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.vendor.hasSecurityReview).toBe(true);

    const deleteRes = await request(app)
      .delete(`/vendors/${vendorId}`)
      .set('Cookie', cookies);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.message).toBe('Vendor deleted');
  });

  it('should create system with vendor and owner', async () => {
    const { user, cookies } = await createUserWithCompany({
      email: 'system-crud@test.dk',
    });

    const vendorRes = await request(app)
      .post('/vendors')
      .set('Cookie', cookies)
      .send({
        name: 'AWS',
        criticality: 'HIGH',
      });

    expect(vendorRes.statusCode).toBe(201);

    const systemRes = await request(app)
      .post('/systems')
      .set('Cookie', cookies)
      .send({
        name: 'Customer Portal',
        type: 'WEBSITE',
        criticality: 'CRITICAL',
        ownerUserId: user.id,
        vendorId: vendorRes.body.vendor.id,
        containsPersonalData: true,
        internetExposed: true,
        mfaEnabled: false,
        backupEnabled: true,
        loggingEnabled: true,
        monitoringEnabled: false,
        rtoMinutes: 240,
        rpoMinutes: 60,
      });

    expect(systemRes.statusCode).toBe(201);
    expect(systemRes.body.system.name).toBe('Customer Portal');
    expect(systemRes.body.system.vendor.name).toBe('AWS');
    expect(systemRes.body.system.ownerUser.id).toBe(user.id);

    const listRes = await request(app)
      .get('/systems')
      .set('Cookie', cookies);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.systems).toHaveLength(1);
  });

  it('should create business process', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'business-process@test.dk',
    });

    const res = await request(app)
      .post('/business-processes')
      .set('Cookie', cookies)
      .send({
        name: 'Customer Support',
        criticality: 'HIGH',
        maxTolerableDowntimeMinutes: 480,
        manualWorkaroundAvailable: false,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.businessProcess.name).toBe('Customer Support');

    const listRes = await request(app)
      .get('/business-processes')
      .set('Cookie', cookies);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.businessProcesses).toHaveLength(1);
  });

  it('should create dependency between business process and system', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'dependency@test.dk',
    });

    const processRes = await request(app)
      .post('/business-processes')
      .set('Cookie', cookies)
      .send({
        name: 'Order Handling',
        criticality: 'HIGH',
      });

    expect(processRes.statusCode).toBe(201);

    const systemRes = await request(app)
      .post('/systems')
      .set('Cookie', cookies)
      .send({
        name: 'ERP',
        type: 'ERP',
        criticality: 'HIGH',
      });

    expect(systemRes.statusCode).toBe(201);

    const dependencyRes = await request(app)
      .post('/dependencies')
      .set('Cookie', cookies)
      .send({
        sourceType: 'BUSINESS_PROCESS',
        sourceId: processRes.body.businessProcess.id,
        targetType: 'SYSTEM',
        targetId: systemRes.body.system.id,
        dependencyType: 'DATA',
        isCritical: true,
        failureImpact: 'Order handling is delayed',
      });

    expect(dependencyRes.statusCode).toBe(201);
    expect(dependencyRes.body.dependency.sourceType).toBe('BUSINESS_PROCESS');
    expect(dependencyRes.body.dependency.targetType).toBe('SYSTEM');
    expect(dependencyRes.body.dependency.isCritical).toBe(true);

    const listRes = await request(app)
      .get('/dependencies')
      .set('Cookie', cookies);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.dependencies).toHaveLength(1);
  });

  it('should prevent evidence contributors from creating resources but allow reading', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'readonly@test.dk',
      role: 'EVIDENCE_CONTRIBUTOR',
    });

    const createRes = await request(app)
      .post('/vendors')
      .set('Cookie', cookies)
      .send({
        name: 'Blocked Vendor',
      });

    expect(createRes.statusCode).toBe(403);

    const listRes = await request(app)
      .get('/vendors')
      .set('Cookie', cookies);

    expect(listRes.statusCode).toBe(200);
  });

  it('should prevent cross-company access', async () => {
    const first = await createUserWithCompany({
      email: 'first-system-company@test.dk',
    });

    const second = await createUserWithCompany({
      email: 'second-system-company@test.dk',
    });

    const vendorRes = await request(app)
      .post('/vendors')
      .set('Cookie', first.cookies)
      .send({
        name: 'Private Vendor',
      });

    expect(vendorRes.statusCode).toBe(201);

    const res = await request(app)
      .get(`/vendors/${vendorRes.body.vendor.id}`)
      .set('Cookie', second.cookies);

    expect(res.statusCode).toBe(404);
  });
});
