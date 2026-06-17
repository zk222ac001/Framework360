const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/db');
const bcrypt = require('bcrypt');

async function createUserAndLogin() {
  const password = await bcrypt.hash('password123', 10);

  await prisma.company.create({
    data: {
      name: 'Test ApS',
      sector: 'IT',
      users: {
        create: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.dk',
          password,
          role: 'CUSTOMER_ADMIN',
          isActive: true,
        },
      },
    },
  });

  const login = await request(app).post('/auth/login').send({
    email: 'test@test.dk',
    password: 'password123',
  });

  return login.headers['set-cookie'];
}

describe('Framework flow', () => {
  it('should return available frameworks', async () => {
    const cookies = await createUserAndLogin();

    const res = await request(app)
      .get('/frameworks')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'GDPR',
          name: 'GDPR',
        }),
      ]),
    );
  });

  it('should start framework and create current-schema controls', async () => {
    const cookies = await createUserAndLogin();

    const res = await request(app)
      .post('/frameworks/GDPR/start')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(201);
    expect(res.body.assessmentId).toBeDefined();
    expect(res.body.framework).toBe('GDPR');

    const assessment = await request(app)
      .get('/frameworks/GDPR/assessment')
      .set('Cookie', cookies);

    expect(assessment.statusCode).toBe(200);
    expect(assessment.body.framework.code).toBe('GDPR');
    expect(assessment.body.sections[0].requirements.length).toBeGreaterThan(0);
  });
});
