const prisma = require('../db');

function textIncludesAny(value, words) {
  if (!value) return false;

  const normalized = value.toLowerCase();

  return words.some((word) => normalized.includes(word));
}

async function getCompanySystemSignals(companyId) {
  const [systems, vendors, dependencies, businessProcesses] = await Promise.all([
    prisma.systemAsset.findMany({
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

  const hasPersonalDataSystems = systems.some((system) => system.containsPersonalData);
  const hasSensitiveDataSystems = systems.some((system) => system.containsSensitiveData);

  const hasCriticalSystems = systems.some((system) => system.criticality === 'CRITICAL');

  const hasInternetExposedSystems = systems.some((system) => system.internetExposed);

  const hasInternetExposedCriticalSystems = systems.some(
    (system) => system.internetExposed && system.criticality === 'CRITICAL'
  );

  const hasPaymentSystems = systems.some((system) =>
    system.type === 'PAYMENT_SYSTEM' ||
    textIncludesAny(system.name, paymentWords) ||
    textIncludesAny(system.description, paymentWords)
  );

  const hasAiSystems = systems.some((system) =>
    textIncludesAny(system.name, aiWords) ||
    textIncludesAny(system.description, aiWords)
  );

  const hasPublicWebSystems = systems.some((system) =>
    system.internetExposed || publicWebTypes.includes(system.type)
  );

  const hasSaasSystems = systems.some((system) => saasTypes.includes(system.type));

  const hasCriticalVendors = vendors.some(
    (vendor) => vendor.criticality === 'CRITICAL' || vendor.isCriticalSupplier
  );

  const hasCriticalDependencies = dependencies.some((dependency) => dependency.isCritical);

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