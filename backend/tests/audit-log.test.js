const request = require('supertest');

const {
  app,
  prisma,
  createCompanyWithUser,
  login,
} = require('./testHelpers');

describe('Audit logs', () => {
  it('should filter and fetch audit logs by string ids', async () => {
    const actor = await createCompanyWithUser({
      email: 'audit-actor@test.dk',
      companyName: 'Audit Actor ApS',
    });
    const admin = await createCompanyWithUser({
      email: 'audit-platform-admin@test.dk',
      role: 'PLATFORM_ADMIN',
      companyName: 'Audit Admin ApS',
    });

    const auditLog = await prisma.auditLog.create({
      data: {
        userId: actor.user.id,
        action: 'USER_UPDATED',
        entity: 'Company',
        entityId: actor.company.id,
        metadata: {
          source: 'test',
        },
      },
    });

    const { cookies } = await login(admin.user.email);

    const listRes = await request(app)
      .get(`/audit-logs?userId=${actor.user.id}&entityId=${actor.company.id}`)
      .set('Cookie', cookies);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.pagination.total).toBe(1);
    expect(listRes.body.auditLogs[0].id).toBe(auditLog.id);

    const detailRes = await request(app)
      .get(`/audit-logs/${auditLog.id}`)
      .set('Cookie', cookies);

    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.body.id).toBe(auditLog.id);
  });
});
