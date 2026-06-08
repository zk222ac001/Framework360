const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

describe('Auth', () => {
  it('should register, login, get current user and logout', async () => {
    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'simon',
        lastName: 'PEDERSEN',
        email: 'SIMON@TEST.DK',
        password: 'password123',
        companyName: 'test aps',
        sector: 'IT',
        country: 'DK',
      });

    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.body.email).toBe('simon@test.dk');
    expect(registerRes.body.firstName).toBe('Simon');
    expect(registerRes.body.lastName).toBe('Pedersen');

    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'simon@test.dk',
        password: 'password123',
      });

    expect(loginRes.statusCode).toBe(200);

    const cookies = loginRes.headers['set-cookie'];

    const meRes = await request(app)
      .get('/auth/me')
      .set('Cookie', cookies);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.user.email).toBe('simon@test.dk');
    expect(meRes.body.user.firstName).toBe('Simon');
    expect(meRes.body.user.lastName).toBe('Pedersen');

    const logoutRes = await request(app)
      .post('/auth/logout')
      .set('Cookie', cookies);

    expect(logoutRes.statusCode).toBe(200);

    const meAfterLogout = await request(app)
      .get('/auth/me')
      .set('Cookie', logoutRes.headers['set-cookie']);

    expect(meAfterLogout.statusCode).toBe(401);
  });

  it('should reject wrong password', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    await prisma.company.create({
      data: {
        name: 'Test ApS',
        sector: 'IT',
        users: {
          create: {
            firstName: 'Test',
            lastName: 'User',
            email: 'wrong@test.dk',
            password: hashedPassword,
            role: 'CUSTOMER_ADMIN',
            isActive: true,
          },
        },
      },
    });

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'wrong@test.dk',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(401);
  });

  it('should register → login → me', async () => {
    await request(app).post('/auth/register').send({
      firstName: 'simon',
      lastName: 'PEDERSEN',
      email: 'SIMON2@TEST.DK',
      password: 'password123',
      companyName: 'test aps',
      sector: 'IT',
      country: 'DK',
    });

    const login = await request(app).post('/auth/login').send({
      email: 'simon2@test.dk',
      password: 'password123',
    });

    expect(login.statusCode).toBe(200);

    const cookies = login.headers['set-cookie'];

    const me = await request(app)
      .get('/auth/me')
      .set('Cookie', cookies);

    expect(me.statusCode).toBe(200);
    expect(me.body.user.email).toBe('simon2@test.dk');
  });
});