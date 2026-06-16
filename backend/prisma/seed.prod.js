const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function upsertCompany({ companyName, cvr, sector = "IT", country = "DK" }) {
  if (!companyName || !cvr) return null;

  return prisma.company.upsert({
    where: { cvr },
    update: { name: companyName, sector, country },
    create: { name: companyName, cvr, sector, country },
  });
}

async function createUserIfMissing({
  firstName,
  lastName,
  email,
  password,
  role = "CUSTOMER_ADMIN",
  companyName,
  cvr,
  sector = "IT",
  country = "DK",
}) {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`Seed skipped existing user: ${email}. Existing password was not changed.`);
    return existingUser;
  }

  const company = await upsertCompany({ companyName, cvr, sector, country });
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      mustChangePassword: true,
      onboardingCompleted: true,
      companyId: company?.id,
    },
  });

  console.log(`Seed created user: ${email}`);
  return user;
}

async function main() {
  const adminEmail = process.env.PROD_ADMIN_EMAIL || "admin@eucompliance.dk";
  const adminPassword = process.env.PROD_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("PROD_ADMIN_PASSWORD is required for first production bootstrap. Add it in Render Environment.");
  }

  await createUserIfMissing({
    firstName: "Platform",
    lastName: "Admin",
    email: adminEmail,
    password: adminPassword,
    role: "PLATFORM_ADMIN",
  });

  if (process.env.SEED_DEMO_USER === "true") {
    await createUserIfMissing({
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
  }

  console.log("Prod seed faerdig");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
