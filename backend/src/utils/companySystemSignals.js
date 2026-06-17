const prisma = require('../db');

function textIncludesAny(value, words) {
  if (!value) return false;

  const normalized = value.toLowerCase();

  return words.some((word) => normalized.includes(word));
}

async function getCompanySystemSignals(companyId) {
  const [systems, vendors, dependencies, businessProcesses] = await Promise.all([
    prisma.system.findMany({
      where: { companyId },
    }),
    prisma.vendor.findMany({
      where: { companyId },
    }),
    prisma.dependency.findMany({
      where: { companyId },
    }),
    prisma.businessProcess.findMany({
      where: { companyId },
    }),
  ]);

  const paymentWords = ['payment', 'card', 'checkout', 'stripe', 'adyen', 'nets', 'pay'];
  const aiWords = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'gpt'];
  const publicWebTypes = ['WEBSITE', 'API'];
  const saasTypes = ['SAAS', 'CLOUD_SERVICE'];

  const hasPersonalDataSystems = systems.some(
    (system) =>
      system.containsPersonalData ||
      textIncludesAny(system.name, ['personal data', 'customer', 'employee', 'user']) ||
      textIncludesAny(system.description, ['personal data', 'customer', 'employee', 'user'])
  );

  const hasSensitiveDataSystems = systems.some(
    (system) =>
      system.containsSensitiveData ||
      textIncludesAny(system.name, ['sensitive', 'health', 'financial', 'payroll']) ||
      textIncludesAny(system.description, ['sensitive', 'health', 'financial', 'payroll'])
  );

  const hasCriticalSystems = systems.some(
    (system) =>
      system.criticality === 'CRITICAL' ||
      textIncludesAny(system.name, ['critical', 'production', 'core']) ||
      textIncludesAny(system.description, ['critical', 'production', 'core'])
  );

  const hasInternetExposedSystems = systems.some(
    (system) =>
      system.internetExposed ||
      textIncludesAny(system.name, ['website', 'api', 'portal', 'public']) ||
      textIncludesAny(system.description, ['website', 'api', 'portal', 'public'])
  );

  const hasInternetExposedCriticalSystems =
    hasInternetExposedSystems && hasCriticalSystems;

  const hasPaymentSystems = systems.some((system) =>
    textIncludesAny(system.name, paymentWords) ||
    textIncludesAny(system.description, paymentWords)
  );

  const hasAiSystems = systems.some((system) =>
    textIncludesAny(system.name, aiWords) ||
    textIncludesAny(system.description, aiWords)
  );

  const hasPublicWebSystems = systems.some((system) =>
    system.internetExposed ||
    publicWebTypes.some((type) => textIncludesAny(system.name, [type.toLowerCase()])) ||
    publicWebTypes.some((type) => textIncludesAny(system.description, [type.toLowerCase()])) ||
    textIncludesAny(system.name, ['website', 'api', 'public']) ||
    textIncludesAny(system.description, ['website', 'api', 'public'])
  );

  const hasSaasSystems = systems.some((system) =>
    saasTypes.some((type) => textIncludesAny(system.name, [type.toLowerCase().replace('_', ' ')])) ||
    saasTypes.some((type) => textIncludesAny(system.description, [type.toLowerCase().replace('_', ' ')])) ||
    textIncludesAny(system.name, ['saas', 'cloud']) ||
    textIncludesAny(system.description, ['saas', 'cloud'])
  );

  const hasCriticalVendors = vendors.some(
    (vendor) =>
      vendor.riskLevel === 'CRITICAL' ||
      vendor.criticality === 'CRITICAL' ||
      vendor.isCriticalSupplier
  );

  const hasCriticalDependencies = dependencies.some(
    (dependency) =>
      dependency.riskLevel === 'CRITICAL' ||
      dependency.isCritical
  );

  const hasCriticalBusinessProcesses = businessProcesses.some(
    (process) => process.criticality === 'CRITICAL'
  );

  return {
    counts: {
      systems: systems.length,
      vendors: vendors.length,
      dependencies: dependencies.length,
      businessProcesses: businessProcesses.length,
    },

    hasPersonalDataSystems,
    hasSensitiveDataSystems,
    hasCriticalSystems,
    hasInternetExposedSystems,
    hasInternetExposedCriticalSystems,
    hasPaymentSystems,
    hasAiSystems,
    hasPublicWebSystems,
    hasSaasSystems,
    hasCriticalVendors,
    hasCriticalDependencies,
    hasCriticalBusinessProcesses,
  };
}

module.exports = {
  getCompanySystemSignals,
};
