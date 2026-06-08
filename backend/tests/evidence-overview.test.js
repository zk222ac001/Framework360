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
  const framework = await prisma.frameworkDefinition.create({
    data: {
      code: frameworkCode,
      name: frameworkCode,
      description: `${frameworkCode} description`,
      category: 'EU Law',
      isActive: true,
    },
  });

  const section = await prisma.frameworkSection.create({
    data: {
      frameworkDefinitionId: framework.id,
      title: 'Governance',
      description: 'Governance section',
      order: 1,
      weight: 1,
    },
  });

  const requirement = await prisma.frameworkRequirement.create({
    data: {
      sectionId: section.id,
      question: 'Do you have a documented policy?',
      description: 'Policy requirement',
      reference: 'A.1',
      order: 1,
      weight: 1,
      isRequired: true,
      isActive: true,
    },
  });

  const assessment = await prisma.companyFrameworkAssessment.create({
    data: {
      companyId,
      frameworkDefinitionId: framework.id,
      status: 'IN_PROGRESS',
      score: 0,
    },
  });

  const answer = await prisma.frameworkRequirementAnswer.create({
    data: {
      assessmentId: assessment.id,
      requirementId: requirement.id,
      status: 'PARTIAL',
      note: 'Partially implemented',
      answeredByUserId: userId,
      answeredAt: new Date(),
    },
  });

  const evidence = await prisma.frameworkEvidence.create({
    data: {
      answerId: answer.id,
      filename: evidenceFilename,
      filePath: `/uploads/${evidenceFilename}`,
      fileType: 'application/pdf',
      size: 12345,
      uploadedByUserId: userId,
      description: 'Uploaded policy evidence',
    },
  });

  return {
    framework,
    section,
    requirement,
    assessment,
    answer,
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
    expect(item.section.title).toBe('Governance');

    expect(item.framework.id).toBe(created.framework.id);
    expect(item.framework.code).toBe('GDPR');

    expect(item.assessment.id).toBe(created.assessment.id);

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