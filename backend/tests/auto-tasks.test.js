const request = require('supertest');
const {
  app,
  prisma,
  createCompanyWithUser,
  login,
  createFrameworkWithAssessment,
} = require('./testHelpers');

describe('Auto tasks', () => {
  it('NO answer should create HIGH task', async () => {
    const { company, user } = await createCompanyWithUser({
      email: 'task-no@test.dk',
    });

    const { assessment, requirement } = await createFrameworkWithAssessment({
      companyId: company.id,
      code: 'ISO27001',
      requirementWeight: 3,
    });

    const { cookies } = await login(user.email);

    const res = await request(app)
      .patch(`/frameworks/assessments/${assessment.id}/answers`)
      .set('Cookie', cookies)
      .send({
        answers: [
          {
            requirementId: requirement.id,
            status: 'NO',
            note: 'Missing',
          },
        ],
      });

    expect(res.statusCode).toBe(200);

    const tasks = await prisma.task.findMany({
      where: {
        controlId: requirement.id,
      },
    });

    expect(tasks.length).toBe(1);
    expect(tasks[0].priority).toBe('HIGH');
    expect(tasks[0].status).toBe('OPEN');
  });

  it('PARTIAL answer should create task', async () => {
    const { company, user } = await createCompanyWithUser({
      email: 'task-partial@test.dk',
    });

    const { assessment, requirement } = await createFrameworkWithAssessment({
      companyId: company.id,
      code: 'SOC2',
      requirementWeight: 2,
    });

    const { cookies } = await login(user.email);

    const res = await request(app)
      .patch(`/frameworks/assessments/${assessment.id}/answers`)
      .set('Cookie', cookies)
      .send({
        answers: [
          {
            requirementId: requirement.id,
            status: 'PARTIAL',
            note: 'Partly implemented',
          },
        ],
      });

    expect(res.statusCode).toBe(200);

    const task = await prisma.task.findFirst({
      where: {
        controlId: requirement.id,
      },
    });

    expect(task).toBeTruthy();
    expect(['MEDIUM', 'HIGH']).toContain(task.priority);
  });

  it('YES should mark existing task as DONE', async () => {
    const { company, user } = await createCompanyWithUser({
      email: 'task-done@test.dk',
    });

    const { assessment, requirement } = await createFrameworkWithAssessment({
      companyId: company.id,
      code: 'PCI_DSS',
      requirementWeight: 3,
    });

    await prisma.task.create({
      data: {
        companyId: company.id,
        controlId: requirement.id,
        title: requirement.question,
        description: 'Fix it',
        priority: 'HIGH',
        status: 'OPEN',
      },
    });

    const { cookies } = await login(user.email);

    const res = await request(app)
      .patch(`/frameworks/assessments/${assessment.id}/answers`)
      .set('Cookie', cookies)
      .send({
        answers: [
          {
            requirementId: requirement.id,
            status: 'YES',
          },
        ],
      });

    expect(res.statusCode).toBe(200);

    const task = await prisma.task.findFirst({
      where: {
        controlId: requirement.id,
      },
    });

    expect(task.status).toBe('DONE');
  });
});
