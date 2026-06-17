const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/db');

function generateCvr() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

async function createUserWithCompany({
  email = 'evidence-overview@test.dk',
  companyName = 'Evidence Overview Company ApS',
  sector = 'IT',
} = {}) {
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.create({
    data: {
      name: companyName,
      cvr: generateCvr(),
      sector,
      country: 'Denmark',
    },
  });

  const user = await prisma.user.create({
    data: {
      firstName: 'Evidence',
      lastName: 'User',
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
    user,
    company,
    cookies: loginRes.headers['set-cookie'],
  };
}

async function createAssessmentWithEvidence({
  companyId,
  userId,
  frameworkCode = 'GDPR',
  evidenceFilename = 'policy.pdf',
} = {}) {
  const assessment = await prisma.companyFramework.create({
    data: {
      companyId,
      framework: frameworkCode,
      enabled: true,
    },
  });

  const requirement = await prisma.control.create({
    data: {
      companyId,
      framework: frameworkCode,
      controlId: `${frameworkCode}-A-1`,
      title: 'Do you have a documented policy?',
      description: 'Policy requirement',
      answerStatus: 'PARTIAL',
      answerNote: 'Partially implemented',
      status: 'IN_PROGRESS',
    },
  });

  const evidence = await prisma.evidence.create({
    data: {
      companyId,
      controlId: requirement.id,
      title: evidenceFilename,
      filePath: `/uploads/${evidenceFilename}`,
      fileType: 'application/pdf',
      fileSize: 12345,
      uploadedById: userId,
      description: 'Uploaded policy evidence',
    },
  });

  return {
    framework: {
      id: frameworkCode,
      code: frameworkCode,
    },
    section: {
      id: `${frameworkCode}-controls`,
      title: `${frameworkCode} controls`,
    },
    requirement,
    assessment,
    answer: {
      id: requirement.id,
      status: 'PARTIAL',
    },
    evidence,
  };
}

describe('Evidence overview', () => {
  it('should return all evidence for authenticated users company', async () => {
    const { user, company, cookies } = await createUserWithCompany();

    const created = await createAssessmentWithEvidence({
      companyId: company.id,
      userId: user.id,
      evidenceFilename: 'gdpr-policy.pdf',
    });

    const res = await request(app)
      .get('/evidence')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.evidence)).toBe(true);
    expect(res.body.evidence).toHaveLength(1);

    const item = res.body.evidence[0];

    expect(item.id).toBe(created.evidence.id);
    expect(item.filename).toBe('gdpr-policy.pdf');
    expect(item.fileType).toBe('application/pdf');
    expect(item.size).toBe(12345);
    expect(item.description).toBe('Uploaded policy evidence');

    expect(item.answer.id).toBe(created.answer.id);
    expect(item.answer.status).toBe('PARTIAL');

    expect(item.requirement.id).toBe(created.requirement.id);
    expect(item.requirement.question).toBe('Do you have a documented policy?');

    expect(item.section.id).toBe(created.section.id);
    expect(item.section.title).toBe(created.section.title);

    expect(item.framework.id).toBe(created.framework.id);
    expect(item.framework.code).toBe('GDPR');

    expect(item.assessment.id).toBe(created.requirement.id);

    expect(item.uploadedBy.id).toBe(user.id);
    expect(item.uploadedBy.email).toBe('evidence-overview@test.dk');
  });

  it('should not return evidence from another company', async () => {
    const first = await createUserWithCompany({
      email: 'first-company@test.dk',
      companyName: 'First Company ApS',
    });

    const second = await createUserWithCompany({
      email: 'second-company@test.dk',
      companyName: 'Second Company ApS',
    });

    await createAssessmentWithEvidence({
      companyId: first.company.id,
      userId: first.user.id,
      frameworkCode: 'GDPR',
      evidenceFilename: 'first-company.pdf',
    });

    await createAssessmentWithEvidence({
      companyId: second.company.id,
      userId: second.user.id,
      frameworkCode: 'ISO27001',
      evidenceFilename: 'second-company.pdf',
    });

    const res = await request(app)
      .get('/evidence')
      .set('Cookie', first.cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.evidence).toHaveLength(1);
    expect(res.body.evidence[0].filename).toBe('first-company.pdf');
    expect(res.body.evidence[0].filename).not.toBe('second-company.pdf');
  });

  it('should return empty array when company has no evidence', async () => {
    const { cookies } = await createUserWithCompany({
      email: 'no-evidence@test.dk',
    });

    const res = await request(app)
      .get('/evidence')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.evidence).toEqual([]);
  });

  it('should reject unauthenticated evidence overview access', async () => {
    const res = await request(app).get('/evidence');

    expect(res.statusCode).toBe(401);
  });
});
