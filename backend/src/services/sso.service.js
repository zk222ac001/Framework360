const prisma = require('../db');
const {
  normalizeEmail,
  normalizeName,
} = require('../utils/normalizeInput');

async function findOrCreateSsoUser({
  email,
  firstName,
  lastName,
  provider,
  providerId,
}) {
  const normalizedEmail = normalizeEmail(email);

  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { company: true },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        authProvider: user.authProvider || provider,
        providerId: user.providerId || providerId,
        lastLogin: new Date(),
      },
      include: { company: true },
    });

    return user;
  }

  user = await prisma.user.create({
    data: {
      firstName: normalizeName(firstName || 'Unknown'),
      lastName: normalizeName(lastName || 'User'),
      email: normalizedEmail,
      password: null,
      authProvider: provider,
      providerId,
      role: 'EVIDENCE_CONTRIBUTOR',
      isActive: true,
      mustChangePassword: false,
      onboardingCompleted: false,
    },
    include: { company: true },
  });

  return user;
}

module.exports = {
  findOrCreateSsoUser,
};
