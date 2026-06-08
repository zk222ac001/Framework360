const prisma = require('../src/db');

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // clean DB før hver test
  await prisma.auditLog.deleteMany();
  await prisma.frameworkRequirementAnswer.deleteMany();
  await prisma.companyFrameworkAssessment.deleteMany();
  await prisma.virksomhedFramework.deleteMany();
  await prisma.frameworkRequirement.deleteMany();
  await prisma.frameworkSection.deleteMany();
  await prisma.frameworkDefinition.deleteMany();
  await prisma.task?.deleteMany?.(); // hvis eksisterer
  await prisma.bruger.deleteMany();
  await prisma.virksomhed.deleteMany();
});