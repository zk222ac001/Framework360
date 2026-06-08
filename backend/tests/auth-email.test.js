const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

async function createUser({
  email = 'email@test.dk',
  role = 'CUSTOMER_ADMIN',
  passwordText = 'password123',
  cvr = null,
} = {}) {
  const password = await bcrypt.hash(passwordText, 10);

  const uniqueCvr = cvr || String(Math.floor(10000000 + Math.random() * 90000000));

  const company = await prisma.company.create({
    data: {
      name: 'Email Test Company ApS',
      cvr: uniqueCvr,
      sector: 'IT',
      country: 'Denmark',
    },
  });

  const user = await prisma.user.create({
    data: {
      firstName: 'Email',
      lastName: 'User',
      email,
      password,
      role,
      isActive: true,
      companyId: company.id,
    },
  });

  const loginRes = await request(app)
    .post('/auth/login')
    .send({
      email,
      password: passwordText,
    });

  expect(loginRes.statusCode).toBe(200);

  return {
    user,
    company,
    cookies: loginRes.headers['set-cookie'],
  };
}
describe('Auth email settings', () => {
  it('should allow authenticated user to update email with correct password', async () => {
    const { user, cookies } = await createUser({
      email: 'oldemail@test.dk',
    });

    const res = await request(app)
      .patch('/auth/me/email')
      .set('Cookie', cookies)
      .send({
        currentPassword: 'password123',
        newEmail: 'newemail@test.dk',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Email updated');
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.email).toBe('newemail@test.dk');
  });

  it('should normalize new email to lowercase', async () => {
    const { cookies } = await createUser({
      email: 'lowercase@test.dk',
    });

    const res = await request(app)
      .patch('/auth/me/email')
      .set('Cookie', cookies)
      .send({
        currentPassword: 'password123',
        newEmail: 'NewEmailUpper@Test.dk',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('newemailupper@test.dk');
  });

  it('should reject email update with wrong current password', async () => {
    const { cookies } = await createUser({
      email: 'wrongpassword@test.dk',
    });

    const res = await request(app)
      .patch('/auth/me/email')
      .set('Cookie', cookies)
      .send({
        currentPassword: 'wrong-password',
        newEmail: 'shouldnotchange@test.dk',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Current password is incorrect');
  });

  it('should reject duplicate email', async () => {
    await createUser({
      email: 'existing@test.dk',
    });

    const { cookies } = await createUser({
      email: 'duplicateuser@test.dk',
    });

    const res = await request(app)
      .patch('/auth/me/email')
      .set('Cookie', cookies)
      .send({
        currentPassword: 'password123',
        newEmail: 'existing@test.dk',
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('Email is already in use');
  });

  it('should reject unauthenticated email update', async () => {
    const res = await request(app)
      .patch('/auth/me/email')
      .send({
        currentPassword: 'password123',
        newEmail: 'noauth@test.dk',
      });

    expect(res.statusCode).toBe(401);
  });

  it('should reject invalid email body', async () => {
    const { cookies } = await createUser({
      email: 'invalidemailbody@test.dk',
    });

    const res = await request(app)
      .patch('/auth/me/email')
      .set('Cookie', cookies)
      .send({
        currentPassword: 'password123',
        newEmail: 'not-an-email',
      });

    expect(res.statusCode).toBe(400);
  });
});