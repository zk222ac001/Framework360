const prisma = require('../src/db');

async function safeDelete(model) {
  if (model?.deleteMany) {
    await model.deleteMany().catch(() => {});
  }
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await safeDelete(prisma.frameworkEvidence);
  await safeDelete(prisma.frameworkRequirementAnswer);
  await safeDelete(prisma.task);
  await safeDelete(prisma.companyFrameworkAssessment);
  await safeDelete(prisma.companyFramework);
  await safeDelete(prisma.frameworkRequirement);
  await safeDelete(prisma.frameworkSection);
  await safeDelete(prisma.frameworkDefinition);
  await safeDelete(prisma.auditLog);
  await safeDelete(prisma.invitation);
  await safeDelete(prisma.emailLog);
  await safeDelete(prisma.demoRequest);
  await safeDelete(prisma.user);
  await safeDelete(prisma.company);
});