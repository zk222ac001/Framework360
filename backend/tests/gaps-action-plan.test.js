const request = require('supertest');
const {
  app,
  prisma,
  createCompanyWithUser,
  login,
  createFrameworkWithAssessment,
} = require('./testHelpers');

describe('Gaps and action plan', () => {
  it('NO answer should appear as gap and action', async () => {
    const { company, user } = await createCompanyWithUser({
      email: 'gap@test.dk',
    });

    const { assessment, requirement } = await createFrameworkWithAssessment({
      companyId: company.id,
      code: 'NIS2',
      requirementWeight: 3,
    });

    await prisma.frameworkRequirementAnswer.updateMany({
      where: {
        assessmentId: assessment.id,
        requirementId: requirement.id,
      },
      data: {
        status: 'NO',
      },
    });

    const { cookies } = await login(user.email);

    const gapsRes = await request(app)
      .get(`/frameworks/assessments/${assessment.id}/gaps`)
      .set('Cookie', cookies);

    expect(gapsRes.statusCode).toBe(200);
    expect(gapsRes.body.totalGaps).toBe(1);
    expect(gapsRes.body.gaps[0].status).toBe('NO');

    const actionRes = await request(app)
      .get(`/frameworks/assessments/${assessment.id}/action-plan`)
      .set('Cookie', cookies);

    expect(actionRes.statusCode).toBe(200);
    expect(actionRes.body.totalActions).toBe(1);
    expect(actionRes.body.highPriority.length).toBe(1);
  });

  it('YES answer should not appear as gap or action', async () => {
    const { company, user } = await createCompanyWithUser({
      email: 'nogap@test.dk',
    });

    const { assessment, requirement } = await createFrameworkWithAssessment({
      companyId: company.id,
      code: 'DORA',
    });

    await prisma.frameworkRequirementAnswer.updateMany({
      where: {
        assessmentId: assessment.id,
        requirementId: requirement.id,
      },
      data: {
        status: 'YES',
      },
    });

    const { cookies } = await login(user.email);

    const gapsRes = await request(app)
      .get(`/frameworks/assessments/${assessment.id}/gaps`)
      .set('Cookie', cookies);

    expect(gapsRes.statusCode).toBe(200);
    expect(gapsRes.body.totalGaps).toBe(0);

    const actionRes = await request(app)
      .get(`/frameworks/assessments/${assessment.id}/action-plan`)
      .set('Cookie', cookies);

    expect(actionRes.statusCode).toBe(200);
    expect(actionRes.body.totalActions).toBe(0);
  });
});