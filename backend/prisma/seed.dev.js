const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createUser({
  firstName,
  lastName,
  email,
  password,
  role = "CUSTOMER_ADMIN",
  companyName,
  cvr,
  sector = "IT",
  country = "Denmark",
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
    firstName: "Dev",
    lastName: "Admin",
    email: "dev.admin@eucompliance.test",
    password: "DevAdmin123",
    role: "PLATFORM_ADMIN",
  });

  await createUser({
    firstName: "Simon",
    lastName: "Test",
    email: "simon@test.dk",
    password: "Test1234",
    role: "CUSTOMER_ADMIN",
    companyName: "CyberPartners",
    cvr: "12345678",
    sector: "IT",
    country: "DK",
  });

  await createUser({
    firstName: "Demo",
    lastName: "User",
    email: "demo@test.dk",
    password: "Test1234",
    role: "CUSTOMER_ADMIN",
    companyName: "Demo Company",
    cvr: "87654321",
    sector: "IT",
    country: "DK",
  });

  console.log("Dev seed færdig");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
