const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function loadFrameworkFile(filename) {
  const filePath = path.join(__dirname, "seed-data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadAllFrameworkFiles() {
  const seedDir = path.join(__dirname, "seed-data");

  if (!fs.existsSync(seedDir)) {
    return [];
  }

  return fs
    .readdirSync(seedDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => loadFrameworkFile(file));
}

async function main() {
  const adminEmail =
    process.env.PLATFORM_ADMIN_EMAIL || "admin@eucompliance.dk";
  const adminPassword =
    process.env.PLATFORM_ADMIN_PASSWORD || "AdminPassword123";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "PLATFORM_ADMIN",
      isActive: true,
    },
    create: {
      firstName: "Platform",
      lastName: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "PLATFORM_ADMIN",
      isActive: true,
      mustChangePassword: false,
      onboardingCompleted: true,
    },
  });

  const frameworks = loadAllFrameworkFiles();

  for (const frameworkData of frameworks) {
    await seedFramework(frameworkData);
  }

  console.log("Seed færdig");
}

async function seedFramework(frameworkData) {
  const framework = await prisma.frameworkDefinition.upsert({
    where: { code: frameworkData.code },
    update: {
      name: frameworkData.name,
      description: frameworkData.description,
      category: frameworkData.category,
      isActive: true,
    },
    create: {
      code: frameworkData.code,
      name: frameworkData.name,
      description: frameworkData.description,
      category: frameworkData.category,
      isActive: true,
    },
  });

  for (const sectionData of frameworkData.sections) {
    const section = await prisma.frameworkSection.upsert({
      where: {
        frameworkDefinitionId_order: {
          frameworkDefinitionId: framework.id,
          order: sectionData.order,
        },
      },
      update: {
        title: sectionData.title,
        description: sectionData.description,
        weight: sectionData.weight,
      },
      create: {
        frameworkDefinitionId: framework.id,
        title: sectionData.title,
        description: sectionData.description,
        order: sectionData.order,
        weight: sectionData.weight,
      },
    });

    for (const requirementData of sectionData.requirements) {
      await prisma.frameworkRequirement.upsert({
        where: {
          sectionId_order: {
            sectionId: section.id,
            order: requirementData.order,
          },
        },
        update: {
          question: requirementData.question,
          description: requirementData.description,
          reference: requirementData.reference,
          weight: requirementData.weight,
          isActive: true,
        },
        create: {
          sectionId: section.id,
          question: requirementData.question,
          description: requirementData.description,
          reference: requirementData.reference,
          order: requirementData.order,
          weight: requirementData.weight,
          isActive: true,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
