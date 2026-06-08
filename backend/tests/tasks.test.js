const request = require('supertest');
const app = require('../src/app');
const bcrypt = require('bcrypt');
const prisma = require('../src/db');

describe('Tasks', () => {
  it('should fetch tasks empty', async () => {
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

    const cookies = login.headers['set-cookie'];

    const res = await request(app)
      .get('/tasks')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});