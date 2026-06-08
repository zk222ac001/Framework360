const request = require('supertest');
const fs = require('fs');
const path = require('path');

const {
  app,
  prisma,
  createCompanyWithUser,
  login,
  createFrameworkWithAssessment,
} = require('./testHelpers');

describe('Evidence', () => {
  const testFilePath = path.join(__dirname, 'test-evidence.txt');

  beforeAll(() => {
    fs.writeFileSync(testFilePath, 'test evidence file');
  });

  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('should upload, list and delete evidence', async () => {
    const { company, user } = await createCompanyWithUser({
      email: 'evidence@test.dk',
    });

    const { answer } = await createFrameworkWithAssessment({
      companyId: company.id,
      code: 'ISO22301',
    });

    const { cookies } = await login(user.email);

    const uploadRes = await request(app)
      .post(`/answers/${answer.id}/evidence`)
      .set('Cookie', cookies)
      .field('description', 'Test evidence')
      .attach('file', testFilePath);

    expect(uploadRes.statusCode).toBe(201);
    expect(uploadRes.body.id).toBeDefined();

    const evidenceId = uploadRes.body.id;

    const listRes = await request(app)
      .get(`/answers/${answer.id}/evidence`)
      .set('Cookie', cookies);

    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);

    const deleteRes = await request(app)
      .delete(`/evidence/${evidenceId}`)
      .set('Cookie', cookies);

    expect(deleteRes.statusCode).toBe(200);
  });

  it('should prevent another company from listing evidence', async () => {
    const owner = await createCompanyWithUser({
      email: 'owner@test.dk',
      companyName: 'Owner ApS',
    });

    const attacker = await createCompanyWithUser({
      email: 'attacker@test.dk',
      companyName: 'Attacker ApS',
    });

    const { answer } = await createFrameworkWithAssessment({
      companyId: owner.company.id,
      code: 'ISO42001',
    });

    const { cookies } = await login(attacker.user.email);

    const res = await request(app)
      .get(`/answers/${answer.id}/evidence`)
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(403);
  });
});