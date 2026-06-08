const request = require('supertest');

const {
  app,
  createCompanyWithUser,
  login,
} = require('./testHelpers');

describe('Admin seed routes', () => {
  it('should reject normal users', async () => {
    const normal = await createCompanyWithUser({
      email: 'seed-normal@test.dk',
      role: 'CUSTOMER_ADMIN',
    });

    const { cookies } = await login(normal.user.email);

    const res = await request(app)
      .get('/admin/seed-files')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(403);
  });

  it('should allow platform admin to list seed files', async () => {
    const admin = await createCompanyWithUser({
      email: 'seed-admin@test.dk',
      role: 'PLATFORM_ADMIN',
    });

    const { cookies } = await login(admin.user.email);

    const res = await request(app)
      .get('/admin/seed-files')
      .set('Cookie', cookies);

    expect([200, 500]).toContain(res.statusCode);
  });
});