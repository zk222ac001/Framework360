const request = require('supertest');

const {
  app,
  prisma,
  createCompanyWithUser,
  login,
} = require('./testHelpers');

describe('AI compliance copilot', () => {
  it('should return control mapping, gap analysis, risk score, monitoring, and policy templates', async () => {
    const { company } = await createCompanyWithUser({
      email: 'copilot-overview@test.dk',
      companyName: 'Copilot Test ApS',
    });

    await prisma.companyFramework.create({
      data: {
        companyId: company.id,
        framework: 'ISO27001',
      },
    });

    await prisma.control.create({
      data: {
        companyId: company.id,
        framework: 'ISO27001',
        controlId: 'ISO27001-ACCESS-1',
        title: 'Is MFA enabled for internet exposed systems?',
        description: 'MFA should be enabled for exposed and sensitive systems.',
        status: 'NOT_STARTED',
        riskLevel: 'HIGH',
      },
    });

    await prisma.system.create({
      data: {
        companyId: company.id,
        name: 'Public CRM',
        type: 'CRM',
        criticality: 'CRITICAL',
        containsPersonalData: true,
        internetExposed: true,
        mfaEnabled: false,
        loggingEnabled: false,
        monitoringEnabled: false,
        backupEnabled: false,
      },
    });

    await prisma.vendor.create({
      data: {
        companyId: company.id,
        name: 'Critical Cloud Supplier',
        criticality: 'CRITICAL',
        isCriticalSupplier: true,
        hasDpa: false,
        hasSla: false,
        hasSecurityReview: false,
      },
    });

    await prisma.businessProcess.create({
      data: {
        companyId: company.id,
        name: 'Customer support',
        criticality: 'HIGH',
        manualWorkaroundAvailable: false,
      },
    });

    const { cookies } = await login('copilot-overview@test.dk');

    const res = await request(app)
      .get('/copilot/overview')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.implemented).toMatchObject({
      aiPoweredAssistant: true,
      automaticControlMapping: true,
      securityGapAnalysis: true,
      policyGenerator: true,
      riskScoring: true,
      continuousMonitoring: true,
      affordablePricing: true,
    });
    expect(res.body.controlMappings).toHaveLength(1);
    expect(res.body.controlMappings[0]).toMatchObject({
      focus: 'ACCESS_CONTROL',
      confidence: 'HIGH',
    });
    expect(res.body.controlMappings[0].mappedAssets.systems[0].name).toBe('Public CRM');

    const gapTypes = res.body.securityGapAnalysis.gaps.map((gap) => gap.type);
    expect(gapTypes).toContain('MISSING_MFA');
    expect(gapTypes).toContain('MISSING_MONITORING');
    expect(gapTypes).toContain('MISSING_DPA');

    expect(res.body.riskScoring.score).toBeGreaterThan(0);
    expect(res.body.continuousMonitoring.health).toBe('ATTENTION');
    expect(res.body.policyTemplates.map((template) => template.id)).toContain('access-control');
  });

  it('should generate a company-aware policy from a template', async () => {
    const { company } = await createCompanyWithUser({
      email: 'copilot-policy@test.dk',
      companyName: 'Policy Generator ApS',
    });

    await prisma.companyFramework.create({
      data: {
        companyId: company.id,
        framework: 'GDPR',
      },
    });

    await prisma.control.create({
      data: {
        companyId: company.id,
        framework: 'GDPR',
        controlId: 'GDPR-PRIVACY-1',
        title: 'Privacy and personal data governance',
        description: 'Personal data processing must be documented.',
        status: 'IN_PROGRESS',
        riskLevel: 'MEDIUM',
      },
    });

    const { cookies } = await login('copilot-policy@test.dk');

    const res = await request(app)
      .post('/copilot/policies/generate')
      .set('Cookie', cookies)
      .send({
        template: 'privacy',
        audience: 'AUDIT',
        includeCompanyContext: true,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.policy.title).toBe('Privacy and Data Protection Policy');
    expect(res.body.policy.company.name).toBe('Policy Generator ApS');
    expect(res.body.policy.markdown).toContain('Policy Generator ApS');
    expect(res.body.policy.sections.map((section) => section.heading)).toContain('Audit Trail');
    expect(res.body.policy.evidenceChecklist).toContain('Processing activity register');
  });

  it('should reject unauthenticated copilot access', async () => {
    const res = await request(app).get('/copilot/overview');

    expect(res.statusCode).toBe(401);
  });
});
