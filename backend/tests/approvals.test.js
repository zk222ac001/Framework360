const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

function generateCvr() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

async function createUserWithCompany({ email = 'approvals@test.dk' } = {}) {
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.create({
    data: {
      name: 'Approvals Test Company ApS',
      cvr: generateCvr(),
      sector: 'IT',
      country: 'Denmark',
    },
  });

  const user = await prisma.user.create({
    data: {
      firstName: 'Approval',
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

describe('Approvals', () => {
  it('should list and update approval tasks using current task relations', async () => {
    const { company, user, cookies } = await createUserWithCompany();

    const control = await prisma.control.create({
      data: {
        companyId: company.id,
        framework: 'ISO27001',
        controlId: 'A.5.1',
        title: 'Information security policy',
      },
    });

    const task = await prisma.task.create({
      data: {
        companyId: company.id,
        controlId: control.id,
        assignedToId: user.id,
        title: 'Review approval evidence',
        status: 'OPEN',
        priority: 'HIGH',
      },
    });

    const listRes = await request(app)
      .get('/approvals')
      .set('Cookie', cookies);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.summary.total).toBe(1);
    expect(listRes.body.approvals[0]).toMatchObject({
      id: task.id,
      title: 'Review approval evidence',
      framework: 'ISO27001',
      requirement: 'Information security policy',
      owner: 'Approval Owner',
      status: 'PENDING',
    });

    const patchRes = await request(app)
      .patch(`/approvals/${task.id}`)
      .set('Cookie', cookies)
      .send({
        decision: 'APPROVE',
      });

    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body.id).toBe(task.id);
    expect(patchRes.body.status).toBe('APPROVED');
    expect(patchRes.body.taskStatus).toBe('DONE');
  });
});
