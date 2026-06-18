const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');
const { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } = require('../src/services/subscription.service');

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
    expect(registerRes.body.company.subscriptionPlan).toBe(SUBSCRIPTION_PLANS.TRIAL);
    expect(registerRes.body.company.subscriptionStatus).toBe(SUBSCRIPTION_STATUSES.TRIAL);
    expect(new Date(registerRes.body.company.subscriptionRenewal).getTime()).toBeGreaterThan(Date.now());

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

  it('should reset a password with a valid reset token', async () => {
    process.env.EXPOSE_DEV_RESET_TOKEN = 'true';

    await request(app).post('/auth/register').send({
      firstName: 'Reset',
      lastName: 'Tester',
      email: 'reset@test.dk',
      password: 'oldpass123',
      companyName: 'Reset Test ApS',
      sector: 'IT',
      country: 'DK',
    });

    const forgotRes = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'reset@test.dk' });

    expect(forgotRes.statusCode).toBe(200);
    expect(forgotRes.body.message).toBe('If an account exists, password reset instructions have been prepared.');
    expect(forgotRes.body.resetToken).toBeTruthy();

    const resetRes = await request(app)
      .post('/auth/reset-password')
      .send({
        token: forgotRes.body.resetToken,
        newPassword: 'newpass123',
      });

    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.body.message).toBe('Password reset successful');

    const oldLoginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'reset@test.dk', password: 'oldpass123' });

    expect(oldLoginRes.statusCode).toBe(401);

    const newLoginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'reset@test.dk', password: 'newpass123' });

    expect(newLoginRes.statusCode).toBe(200);

    const reusedTokenRes = await request(app)
      .post('/auth/reset-password')
      .send({
        token: forgotRes.body.resetToken,
        newPassword: 'anotherpass123',
      });

    expect(reusedTokenRes.statusCode).toBe(400);
    expect(reusedTokenRes.body.error).toBe('Invalid or expired reset token');
  });

  it('should generate a reset token for a normal local user role', async () => {
    process.env.EXPOSE_DEV_RESET_TOKEN = 'true';

    const hashedPassword = await bcrypt.hash('normalpass123', 10);

    await prisma.user.create({
      data: {
        firstName: 'Normal',
        lastName: 'User',
        email: 'normal@test.dk',
        password: hashedPassword,
        role: 'EVIDENCE_CONTRIBUTOR',
        authProvider: 'LOCAL',
        isActive: true,
      },
    });

    const forgotRes = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'normal@test.dk' });

    expect(forgotRes.statusCode).toBe(200);
    expect(forgotRes.body.resetToken).toBeTruthy();
  });

  it('should generate a reset token for a passwordless local user', async () => {
    process.env.EXPOSE_DEV_RESET_TOKEN = 'true';

    await prisma.user.create({
      data: {
        firstName: 'Invited',
        lastName: 'User',
        email: 'invited@test.dk',
        password: null,
        role: 'EVIDENCE_CONTRIBUTOR',
        authProvider: 'LOCAL',
        isActive: true,
      },
    });

    const forgotRes = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'invited@test.dk' });

    expect(forgotRes.statusCode).toBe(200);
    expect(forgotRes.body.resetToken).toBeTruthy();

    const resetRes = await request(app)
      .post('/auth/reset-password')
      .send({
        token: forgotRes.body.resetToken,
        newPassword: 'invitedpass123',
      });

    expect(resetRes.statusCode).toBe(200);

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'invited@test.dk', password: 'invitedpass123' });

    expect(loginRes.statusCode).toBe(200);
  });

  it('should not generate a reset token for an SSO-only user', async () => {
    process.env.EXPOSE_DEV_RESET_TOKEN = 'true';

    await prisma.user.create({
      data: {
        firstName: 'Sso',
        lastName: 'User',
        email: 'sso@test.dk',
        password: null,
        role: 'EVIDENCE_CONTRIBUTOR',
        authProvider: 'GOOGLE',
        providerId: 'google-user-id',
        isActive: true,
      },
    });

    const forgotRes = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'sso@test.dk' });

    expect(forgotRes.statusCode).toBe(200);
    expect(forgotRes.body.resetToken).toBeUndefined();
  });
});
