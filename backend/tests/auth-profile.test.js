const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

async function createUser({
  email = 'profile@test.dk',
  role = 'CUSTOMER_ADMIN',
  firstName = 'OldFirst',
  lastName = 'OldLast',
} = {}) {
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.create({
    data: {
      name: 'Profile Test Company ApS',
      cvr: '87654321',
      sector: 'IT',
      country: 'Denmark',
    },
  });

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
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
      password: 'password123',
    });

  expect(loginRes.statusCode).toBe(200);

  return {
    user,
    company,
    cookies: loginRes.headers['set-cookie'],
  };
}

describe('Auth profile settings', () => {
  it('should allow authenticated user to update firstName and lastName', async () => {
    const { user, cookies } = await createUser();

    const res = await request(app)
      .patch('/auth/me/profile')
      .set('Cookie', cookies)
      .send({
        firstName: 'NewFirst',
        lastName: 'NewLast',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Profile updated');
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.firstName).toBe('NewFirst');
    expect(res.body.user.lastName).toBe('NewLast');
    expect(res.body.user.email).toBe('profile@test.dk');
  });

  it('should allow partial profile update', async () => {
    const { cookies } = await createUser({
      email: 'partialprofile@test.dk',
      firstName: 'OriginalFirst',
      lastName: 'OriginalLast',
    });

    const res = await request(app)
      .patch('/auth/me/profile')
      .set('Cookie', cookies)
      .send({
        firstName: 'OnlyFirstChanged',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.firstName).toBe('OnlyFirstChanged');
    expect(res.body.user.lastName).toBe('OriginalLast');
  });

  it('should reject unauthenticated profile update', async () => {
    const res = await request(app)
      .patch('/auth/me/profile')
      .send({
        firstName: 'NoAuth',
      });

    expect(res.statusCode).toBe(401);
  });

  it('should reject invalid profile update body', async () => {
    const { cookies } = await createUser({
      email: 'invalidprofile@test.dk',
    });

    const res = await request(app)
      .patch('/auth/me/profile')
      .set('Cookie', cookies)
      .send({
        firstName: '',
      });

    expect(res.statusCode).toBe(400);
  });
});