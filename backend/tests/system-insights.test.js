const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

function generateCvr() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

async function createUserWithCompany({
  email = 'system-insights@test.dk',
  role = 'CUSTOMER_ADMIN',
} = {}) {
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.create({
    data: {
      name: 'System Insights Company ApS',
      cvr: generateCvr(),
      sector: 'IT',
      country: 'Denmark',
    },
  });

  const user = await prisma.user.create({
    data: {
      firstName: 'Insight',
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

describe('System graph and insights', () => {
  it('should return graph nodes and edges', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'graph@test.dk',
    });

    const vendorRes = await request(app)
      .post('/vendors')
      .set('Cookie', cookies)
      .send({
        name: 'Microsoft',
        criticality: 'HIGH',
      });

    const systemRes = await request(app)
      .post('/systems')
      .set('Cookie', cookies)
      .send({
        name: 'Microsoft 365',
        type: 'SAAS',
        criticality: 'HIGH',
        vendorId: vendorRes.body.vendor.id,
      });

    const processRes = await request(app)
      .post('/business-processes')
      .set('Cookie', cookies)
      .send({
        name: 'Email communication',
        criticality: 'HIGH',
      });

    await request(app)
      .post('/dependencies')
      .set('Cookie', cookies)
      .send({
        sourceType: 'BUSINESS_PROCESS',
        sourceId: processRes.body.businessProcess.id,
        targetType: 'SYSTEM',
        targetId: systemRes.body.system.id,
        dependencyType: 'EMAIL',
        isCritical: true,
      });

    const res = await request(app)
      .get('/systems/graph')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.nodes)).toBe(true);
    expect(Array.isArray(res.body.edges)).toBe(true);

    const nodeIds = res.body.nodes.map((node) => node.id);
    expect(nodeIds).toContain(`vendor-${vendorRes.body.vendor.id}`);
    expect(nodeIds).toContain(`system-${systemRes.body.system.id}`);
    expect(nodeIds).toContain(`process-${processRes.body.businessProcess.id}`);

    expect(res.body.edges).toHaveLength(1);
    expect(res.body.edges[0].source).toBe(`process-${processRes.body.businessProcess.id}`);
    expect(res.body.edges[0].target).toBe(`system-${systemRes.body.system.id}`);
  });

  it('should return critical systems', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'critical-systems@test.dk',
    });

    await request(app)
      .post('/systems')
      .set('Cookie', cookies)
      .send({
        name: 'Customer Portal',
        type: 'WEBSITE',
        criticality: 'CRITICAL',
      });

    const res = await request(app)
      .get('/systems/critical')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.systems[0].name).toBe('Customer Portal');
  });

  it('should return system security gaps', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'security-gaps@test.dk',
    });

    await request(app)
      .post('/systems')
      .set('Cookie', cookies)
      .send({
        name: 'Public CRM',
        type: 'CRM',
        criticality: 'CRITICAL',
        internetExposed: true,
        mfaEnabled: false,
        loggingEnabled: false,
        monitoringEnabled: false,
        containsPersonalData: true,
        backupEnabled: false,
      });

    const res = await request(app)
      .get('/systems/security-gaps')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);

    const gapTypes = res.body.gaps.map((gap) => gap.type);

    expect(gapTypes).toContain('MISSING_MFA');
    expect(gapTypes).toContain('MISSING_LOGGING');
    expect(gapTypes).toContain('MISSING_MONITORING');
    expect(gapTypes).toContain('MISSING_BACKUP');
    expect(gapTypes).toContain('MISSING_OWNER');
  });

  it('should return system continuity gaps', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'continuity-gaps@test.dk',
    });

    await request(app)
      .post('/systems')
      .set('Cookie', cookies)
      .send({
        name: 'ERP',
        type: 'ERP',
        criticality: 'CRITICAL',
        backupEnabled: false,
      });

    await request(app)
      .post('/vendors')
      .set('Cookie', cookies)
      .send({
        name: 'Critical Hosting Provider',
        criticality: 'CRITICAL',
        hasSla: false,
      });

    const res = await request(app)
      .get('/systems/continuity-gaps')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);

    const gapTypes = res.body.gaps.map((gap) => gap.type);

    expect(gapTypes).toContain('MISSING_RTO');
    expect(gapTypes).toContain('MISSING_RPO');
    expect(gapTypes).toContain('MISSING_BACKUP');
    expect(gapTypes).toContain('MISSING_SLA');
  });

  it('should return vendor gaps and critical vendors', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'vendor-gaps@test.dk',
    });

    await request(app)
      .post('/vendors')
      .set('Cookie', cookies)
      .send({
        name: 'Critical Supplier',
        criticality: 'CRITICAL',
        isCriticalSupplier: true,
        hasDpa: false,
        hasSla: false,
        hasSecurityReview: false,
      });

    const gapsRes = await request(app)
      .get('/vendors/gaps')
      .set('Cookie', cookies);

    expect(gapsRes.statusCode).toBe(200);

    const gapTypes = gapsRes.body.gaps.map((gap) => gap.type);

    expect(gapTypes).toContain('MISSING_DPA');
    expect(gapTypes).toContain('MISSING_SLA');
    expect(gapTypes).toContain('MISSING_SECURITY_REVIEW');

    const criticalRes = await request(app)
      .get('/vendors/critical')
      .set('Cookie', cookies);

    expect(criticalRes.statusCode).toBe(200);
    expect(criticalRes.body.count).toBe(1);
    expect(criticalRes.body.vendors[0].name).toBe('Critical Supplier');
  });

  it('should return system impact analysis', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'impact@test.dk',
    });

    const processRes = await request(app)
      .post('/business-processes')
      .set('Cookie', cookies)
      .send({
        name: 'Order Handling',
        criticality: 'HIGH',
      });

    const systemRes = await request(app)
      .post('/systems')
      .set('Cookie', cookies)
      .send({
        name: 'Order System',
        type: 'ERP',
        criticality: 'CRITICAL',
        internetExposed: true,
        mfaEnabled: false,
        backupEnabled: false,
      });

    await request(app)
      .post('/dependencies')
      .set('Cookie', cookies)
      .send({
        sourceType: 'BUSINESS_PROCESS',
        sourceId: processRes.body.businessProcess.id,
        targetType: 'SYSTEM',
        targetId: systemRes.body.system.id,
        dependencyType: 'DATA',
        isCritical: true,
      });

    const res = await request(app)
      .get(`/systems/${systemRes.body.system.id}/impact`)
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.system.name).toBe('Order System');
    expect(res.body.affectedBusinessProcesses).toHaveLength(1);
    expect(res.body.relatedGaps.length).toBeGreaterThan(0);
    expect(res.body.suggestedActions.length).toBeGreaterThan(0);
  });

  it('should reject unauthenticated graph access', async () => {
    const res = await request(app).get('/systems/graph');

    expect(res.statusCode).toBe(401);
  });
});