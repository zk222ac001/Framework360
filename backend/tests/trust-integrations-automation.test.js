const request = require('supertest');

const {
  app,
  prisma,
  createCompanyWithUser,
  login,
} = require('./testHelpers');

describe('Trust, integrations, questionnaires, and audit automation', () => {
  it('registers supported integrations and runs an evidence collection job', async () => {
    const { company } = await createCompanyWithUser({
      email: 'integrations-automation@test.dk',
      companyName: 'Automation Test ApS',
    });

    await prisma.control.create({
      data: {
        companyId: company.id,
        framework: 'ISO27001',
        controlId: 'ISO27001-CHANGE-1',
        title: 'Security code review and audit evidence',
        description: 'Code changes should be reviewed and logged.',
        status: 'IN_PROGRESS',
        riskLevel: 'HIGH',
      },
    });

    const { cookies } = await login('integrations-automation@test.dk');

    const catalogRes = await request(app)
      .get('/integrations')
      .set('Cookie', cookies);

    expect(catalogRes.statusCode).toBe(200);
    expect(catalogRes.body.providers.map((provider) => provider.id)).toEqual([
      'MICROSOFT365',
      'GOOGLE_WORKSPACE',
      'GITHUB',
      'AWS',
      'AZURE',
      'JIRA',
    ]);

    const saveRes = await request(app)
      .put('/integrations/GITHUB')
      .set('Cookie', cookies)
      .send({
        displayName: 'GitHub automation test',
        authType: 'GitHub App or token',
        config: { organization: 'framework360-test' },
      });

    expect(saveRes.statusCode).toBe(200);
    expect(saveRes.body.connection.status).toBe('CONNECTED');

    const testRes = await request(app)
      .post('/integrations/GITHUB/test')
      .set('Cookie', cookies);

    expect(testRes.statusCode).toBe(200);
    expect(testRes.body.ok).toBe(true);

    const jobRes = await request(app)
      .post('/evidence-automation/jobs')
      .set('Cookie', cookies)
      .send({
        name: 'GitHub control evidence',
        provider: 'GITHUB',
        schedule: 'MANUAL',
        status: 'ACTIVE',
        config: { limit: 2 },
      });

    expect(jobRes.statusCode).toBe(201);
    expect(jobRes.body.job.connection.displayName).toBe('GitHub automation test');

    const runRes = await request(app)
      .post(`/evidence-automation/jobs/${jobRes.body.job.id}/run`)
      .set('Cookie', cookies);

    expect(runRes.statusCode).toBe(200);
    expect(runRes.body.run.status).toBe('SUCCESS');
    expect(runRes.body.run.createdEvidenceCount).toBeGreaterThan(0);
    expect(runRes.body.createdEvidence[0].title).toContain('GitHub');
  });

  it('publishes a Trust Center and generates questionnaire answers from workspace context', async () => {
    const { company } = await createCompanyWithUser({
      email: 'trust-questionnaire@test.dk',
      companyName: 'Trust Center Test ApS',
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
        title: 'MFA and access management',
        description: 'Identity controls are reviewed.',
        status: 'IMPLEMENTED',
        riskLevel: 'MEDIUM',
      },
    });

    await prisma.system.create({
      data: {
        companyId: company.id,
        name: 'Customer Portal',
        type: 'WEBSITE',
        criticality: 'CRITICAL',
        internetExposed: true,
        mfaEnabled: true,
        loggingEnabled: true,
        monitoringEnabled: true,
        backupEnabled: true,
      },
    });

    const { cookies } = await login('trust-questionnaire@test.dk');

    const trustRes = await request(app)
      .get('/trust-center')
      .set('Cookie', cookies);

    expect(trustRes.statusCode).toBe(200);
    expect(trustRes.body.profile.slug).toContain('trust-center-test');

    const slug = `trust-test-${company.id.slice(0, 8).toLowerCase()}`;
    const profileRes = await request(app)
      .put('/trust-center/profile')
      .set('Cookie', cookies)
      .send({
        slug,
        isPublished: true,
        headline: 'Trust Center Test security profile',
        overview: 'Security, privacy, and compliance posture.',
        contactEmail: 'security@example.com',
        publishedSections: {
          frameworks: true,
          documents: true,
          security: true,
          vendors: true,
        },
      });

    expect(profileRes.statusCode).toBe(200);
    expect(profileRes.body.profile.isPublished).toBe(true);

    const docRes = await request(app)
      .post('/trust-center/documents')
      .set('Cookie', cookies)
      .send({
        title: 'Security overview',
        category: 'SECURITY',
        description: 'Public security summary.',
        isPublic: true,
      });

    expect(docRes.statusCode).toBe(201);

    const publicRes = await request(app).get(`/trust-center/public/${slug}`);

    expect(publicRes.statusCode).toBe(200);
    expect(publicRes.body.profile.slug).toBe(slug);
    expect(publicRes.body.documents).toHaveLength(1);

    const questionnaireRes = await request(app)
      .post('/questionnaires')
      .set('Cookie', cookies)
      .send({
        title: 'Customer security questionnaire',
        requester: 'Customer',
        source: 'Portal',
        questions: [
          'Do you enforce MFA?',
          'Which compliance frameworks do you track?',
        ],
      });

    expect(questionnaireRes.statusCode).toBe(201);

    const generatedRes = await request(app)
      .post(`/questionnaires/${questionnaireRes.body.questionnaire.id}/generate`)
      .set('Cookie', cookies);

    expect(generatedRes.statusCode).toBe(200);
    expect(generatedRes.body.questionnaire.answeredQuestions).toBe(2);
    expect(generatedRes.body.questionnaire.questions[0].answer).toContain('Trust Center Test ApS');
  });

  it('returns a read-only auditor overview and manages auditor access grants', async () => {
    const { company } = await createCompanyWithUser({
      email: 'auditor-portal@test.dk',
      companyName: 'Auditor Portal Test ApS',
    });

    const control = await prisma.control.create({
      data: {
        companyId: company.id,
        framework: 'ISO27001',
        controlId: 'ISO27001-AUDIT-1',
        title: 'Audit evidence review',
        status: 'IMPLEMENTED',
        riskLevel: 'LOW',
      },
    });

    await prisma.evidence.create({
      data: {
        companyId: company.id,
        controlId: control.id,
        title: 'Audit evidence packet',
        description: 'Evidence for auditor review.',
        fileType: 'application/json',
        status: 'APPROVED',
      },
    });

    const { cookies } = await login('auditor-portal@test.dk');

    const overviewRes = await request(app)
      .get('/auditor-portal/overview')
      .set('Cookie', cookies);

    expect(overviewRes.statusCode).toBe(200);
    expect(overviewRes.body.company.name).toBe('Auditor Portal Test ApS');
    expect(overviewRes.body.summary.readinessScore).toBe(100);
    expect(overviewRes.body.summary.evidence).toBe(1);

    const grantRes = await request(app)
      .post('/auditor-portal/grants')
      .set('Cookie', cookies)
      .send({
        email: 'external.auditor@example.com',
        name: 'External Auditor',
        status: 'ACTIVE',
        scope: {
          frameworks: true,
          evidence: true,
          findings: true,
          trustCenter: true,
        },
      });

    expect(grantRes.statusCode).toBe(201);
    expect(grantRes.body.grant.status).toBe('ACTIVE');

    const updateRes = await request(app)
      .patch(`/auditor-portal/grants/${grantRes.body.grant.id}`)
      .set('Cookie', cookies)
      .send({ status: 'PAUSED' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.grant.status).toBe('PAUSED');

    const deleteRes = await request(app)
      .delete(`/auditor-portal/grants/${grantRes.body.grant.id}`)
      .set('Cookie', cookies);

    expect(deleteRes.statusCode).toBe(200);
  });
});
