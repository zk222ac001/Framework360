const request = require('supertest');
const {
  app,
  prisma,
  createCompanyWithUser,
  login,
  createFrameworkWithAssessment,
} = require('./testHelpers');

describe('Authorization', () => {
  it('should prevent user from accessing another company assessment report', async () => {
    const companyA = await createCompanyWithUser({
      email: 'a@test.dk',
      companyName: 'Company A',
    });

    const companyB = await createCompanyWithUser({
      email: 'b@test.dk',
      companyName: 'Company B',
    });

    const { assessment } = await createFrameworkWithAssessment({
      companyId: companyB.company.id,
      code: 'GDPR',
    });

    const { cookies } = await login(companyA.user.email);

    const res = await request(app)
      .get(`/frameworks/assessments/${assessment.id}/report`)
      .set('Cookie', cookies);

    expect([403, 404]).toContain(res.statusCode);
  });

  it('should prevent normal user from accessing admin routes', async () => {
    const normal = await createCompanyWithUser({
      email: 'normal@test.dk',
      role: 'CUSTOMER_ADMIN',
    });

    const { cookies } = await login(normal.user.email);

    const res = await request(app)
      .get('/admin/frameworks')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(403);
  });

  it('should allow platform admin to access admin routes', async () => {
    const admin = await createCompanyWithUser({
      email: 'admin@test.dk',
      role: 'PLATFORM_ADMIN',
    });

    const { cookies } = await login(admin.user.email);

    const res = await request(app)
      .get('/admin/frameworks')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
  });
});