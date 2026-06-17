const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

function generateCvr() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

async function createUserWithCompany({ email = 'findings@test.dk' } = {}) {
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.create({
    data: {
      name: 'Findings Test Company ApS',
      cvr: generateCvr(),
      sector: 'IT',
      country: 'Denmark',
    },
  });

  const user = await prisma.user.create({
    data: {
      firstName: 'Finding',
      lastName: 'Owner',
      email,
      password,
      role: 'CUSTOMER_ADMIN',
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
    company,
    user,
    cookies: loginRes.headers['set-cookie'],
  };
}

describe('Audit findings', () => {
  it('should list tasks as audit findings using current task relations', async () => {
    const { company, user, cookies } = await createUserWithCompany();

    const control = await prisma.control.create({
      data: {
        companyId: company.id,
        framework: 'GDPR',
        controlId: 'GDPR-1',
        title: 'Privacy governance',
      },
    });

    await prisma.task.create({
      data: {
        companyId: company.id,
        controlId: control.id,
        assignedToId: user.id,
        title: 'Document processing activities',
        description: 'Create and review the record of processing activities.',
        status: 'OPEN',
        priority: 'HIGH',
      },
    });

    const res = await request(app)
      .get('/audit-findings')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.summary.total).toBe(1);
    expect(res.body.summary.open).toBe(1);
    expect(res.body.findings[0]).toMatchObject({
      title: 'Document processing activities',
      framework: 'GDPR',
      requirement: 'Privacy governance',
      reference: 'GDPR-1',
      owner: 'Finding Owner',
    });
  });

  it('should create and update an audit finding', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'create-finding@test.dk',
    });

    const createRes = await request(app)
      .post('/audit-findings')
      .set('Cookie', cookies)
      .send({
        title: 'Close evidence gap',
        description: 'Collect missing evidence for the control.',
        priority: 'HIGH',
      });

    expect(createRes.statusCode).toBe(201);
    expect(typeof createRes.body.id).toBe('string');
    expect(createRes.body.status).toBe('OPEN');

    const patchRes = await request(app)
      .patch(`/audit-findings/${createRes.body.id}`)
      .set('Cookie', cookies)
      .send({
        status: 'DONE',
      });

    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body.id).toBe(createRes.body.id);
    expect(patchRes.body.status).toBe('DONE');
  });
});
