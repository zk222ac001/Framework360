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
  it('should start framework and create assessment', async () => {
    const cookies = await createUserAndLogin();

    await prisma.frameworkDefinition.create({
      data: {
        code: 'GDPR',
        name: 'GDPR',
        isActive: true,
        sections: {
          create: [
            {
              title: 'Section 1',
              order: 1,
              requirements: {
                create: [
                  {
                    question: 'Test question',
                    order: 1,
                    weight: 1,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    const res = await request(app)
      .post('/frameworks/GDPR/start')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(201);
    expect(res.body.assessmentId).toBeDefined();
  });
});