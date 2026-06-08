const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createUser({
  firstName,
  lastName,
  email,
  password,
  role = "USER",
  companyName,
  cvr,
  sector = "IT",
  country = "DK",
}) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const company =
    companyName && cvr
      ? await prisma.company.upsert({
          where: { cvr },
          update: {
            name: companyName,
            sector,
            country,
          },
          create: {
            name: companyName,
            cvr,
            sector,
            country,
          },
        })
      : null;

  await prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      password: hashedPassword,
      role,
      isActive: true,
      mustChangePassword: false,
      onboardingCompleted: true,
      companyId: company?.id,
    },
    create: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      mustChangePassword: false,
      onboardingCompleted: true,
      companyId: company?.id,
    },
  });
}

async function main() {
  await createUser({
    firstName: "Platform",
    lastName: "Admin",
    email: "admin@eucompliance.dk",
    password: process.env.PROD_ADMIN_PASSWORD || "ChangeThisStrongPassword123!",
    role: "PLATFORM_ADMIN",
  });

  await createUser({
    firstName: "Maria",
    lastName: "Nielsen",
    email: "maria.nielsen@northwind-demo.dk",
    password: process.env.PROD_DEMO_PASSWORD || "ChangeThisDemoPassword123!",
    role: "CUSTOMER_ADMIN",
    companyName: "Northwind Compliance ApS",
    cvr: "11223344",
    sector: "IT",
    country: "DK",
  });

  console.log("Prod seed færdig");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
