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
  await safeDelete(prisma.approvalRequest);
  await safeDelete(prisma.comment);
  await safeDelete(prisma.campaignAssignment);
  await safeDelete(prisma.evidenceCampaign);
  await safeDelete(prisma.evidence);
  await safeDelete(prisma.task);
  await safeDelete(prisma.auditFinding);
  await safeDelete(prisma.control);
  await safeDelete(prisma.companyFramework);
  await safeDelete(prisma.companyScope);
  await safeDelete(prisma.dependency);
  await safeDelete(prisma.system);
  await safeDelete(prisma.vendor);
  await safeDelete(prisma.businessProcess);
  await safeDelete(prisma.ssoDomain);
  await safeDelete(prisma.report);
  await safeDelete(prisma.auditLog);
  await safeDelete(prisma.invitation);
  await safeDelete(prisma.emailLog);
  await safeDelete(prisma.demoRequest);
  await safeDelete(prisma.user);
  await safeDelete(prisma.company);
});
