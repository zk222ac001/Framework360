const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const adminEmail =
    process.env.PLATFORM_ADMIN_EMAIL || "admin@framework360.dk";
  const adminPassword =
    process.env.PLATFORM_ADMIN_PASSWORD || "Zk1!Ln2@Zl3#Xq4$";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      authProvider: "LOCAL",
      providerId: null,
      role: "PLATFORM_ADMIN",
      isActive: true,
      mustChangePassword: false,
      onboardingCompleted: true,
    },
    create: {
      firstName: "Platform",
      lastName: "Admin",
      email: adminEmail,
      password: hashedPassword,
      authProvider: "LOCAL",
      providerId: null,
      role: "PLATFORM_ADMIN",
      isActive: true,
      mustChangePassword: false,
      onboardingCompleted: true,
    },
  });

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
