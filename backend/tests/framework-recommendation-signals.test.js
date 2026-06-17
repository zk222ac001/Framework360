const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

function generateCvr() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

async function createUserWithCompany({
  email = 'framework-signals@test.dk',
  sector = 'OTHER',
} = {}) {
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.create({
    data: {
      name: 'Framework Signals Company ApS',
      cvr: generateCvr(),
      sector,
      country: 'Denmark',
    },
  });

  const user = await prisma.user.create({
    data: {
      firstName: 'Signal',
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

describe('Framework recommendations with system signals', () => {
  it('should use registered systems as recommendation signals', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'system-signals@test.dk',
      sector: 'OTHER',
    });

    await request(app)
      .post('/systems')
      .set('Cookie', cookies)
      .send({
        name: 'Public Customer Payment Portal',
        description: 'Customer checkout and card payment portal',
        type: 'PAYMENT_SYSTEM',
        criticality: 'CRITICAL',
        containsPersonalData: true,
        containsSensitiveData: true,
        internetExposed: true,
        mfaEnabled: false,
        backupEnabled: false,
        loggingEnabled: false,
        monitoringEnabled: false,
      });

    const res = await request(app)
      .get('/onboarding/recommended-frameworks')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);

    expect(res.body.systemSignalsUsed).toBe(true);
    expect(res.body.systemSignals.hasPersonalDataSystems).toBe(true);
    expect(res.body.systemSignals.hasSensitiveDataSystems).toBe(true);
    expect(res.body.systemSignals.hasPaymentSystems).toBe(true);
    expect(res.body.systemSignals.hasInternetExposedCriticalSystems).toBe(true);

    const requiredCodes = res.body.required.map((item) => item.code);
    const recommendedCodes = res.body.recommended.map((item) => item.code);

    expect(requiredCodes).toContain('GDPR');
    expect(recommendedCodes).toContain('ISO27001');
    expect(recommendedCodes).toContain('NIS2');
    expect(recommendedCodes).toContain('PCI_DSS');
  });

  it('should recommend AI Act when registered systems look AI-related', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'ai-signals@test.dk',
      sector: 'OTHER',
    });

    await request(app)
      .post('/systems')
      .set('Cookie', cookies)
      .send({
        name: 'AI Support Assistant',
        description: 'LLM based support chatbot',
        type: 'SAAS',
        criticality: 'MEDIUM',
      });

    const res = await request(app)
      .get('/onboarding/recommended-frameworks')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.systemSignals.hasAiSystems).toBe(true);

    const recommendedCodes = res.body.recommended.map((item) => item.code);

    expect(recommendedCodes).toContain('AI_ACT');
  });

  it('should use critical vendors and dependencies as recommendation signals', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'vendor-dependency-signals@test.dk',
      sector: 'OTHER',
    });

    const vendorRes = await request(app)
      .post('/vendors')
      .set('Cookie', cookies)
      .send({
        name: 'Critical Cloud Supplier',
        criticality: 'CRITICAL',
        isCriticalSupplier: true,
      });

    const systemRes = await request(app)
      .post('/systems')
      .set('Cookie', cookies)
      .send({
        name: 'Core Platform',
        type: 'SAAS',
        criticality: 'CRITICAL',
        vendorId: vendorRes.body.vendor.id,
      });

    const processRes = await request(app)
      .post('/business-processes')
      .set('Cookie', cookies)
      .send({
        name: 'Customer Delivery',
        criticality: 'CRITICAL',
      });

    await request(app)
      .post('/dependencies')
      .set('Cookie', cookies)
      .send({
        sourceType: 'BUSINESS_PROCESS',
        sourceId: processRes.body.businessProcess.id,
        targetType: 'SYSTEM',
        targetId: systemRes.body.system.id,
        dependencyType: 'HOSTING',
        isCritical: true,
      });

    const res = await request(app)
      .get('/onboarding/recommended-frameworks')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);

    expect(res.body.systemSignals.hasCriticalVendors).toBe(true);
    expect(res.body.systemSignals.hasCriticalDependencies).toBe(true);
    expect(res.body.systemSignals.hasCriticalBusinessProcesses).toBe(true);

    const recommendedCodes = res.body.recommended.map((item) => item.code);

    expect(recommendedCodes).toContain('ISO27001');
    expect(recommendedCodes).toContain('NIS2');
    expect(recommendedCodes).toContain('ISO22301');
  });
});
