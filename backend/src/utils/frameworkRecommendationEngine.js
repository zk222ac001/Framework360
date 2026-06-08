function createRecommendation({
  framework,
  sectorCategory = 'OTHER',
  requiredByLaw = false,
  recommended = false,
  confidence = 'LOW',
  reason = 'This framework may be relevant depending on your company scope.',
}) {
  return {
    id: framework.id,
    code: framework.code,
    name: framework.name,
    description: framework.description,
    category: framework.category,
    sectorCategory,
    requiredByLaw,
    recommended,
    confidence,
    reason,
  };
}

function getSectorCode(company) {
  return company?.sector || null;
}

function getFrameworkByCode(frameworks, code) {
  return frameworks.find((framework) => framework.code === code);
}

function addRecommendation(map, recommendation) {
  const existing = map.get(recommendation.code);

  if (!existing) {
    map.set(recommendation.code, recommendation);
    return;
  }

  const priority = {
    OTHER: 1,
    RECOMMENDED: 2,
    REQUIRED: 3,
  };

  const confidencePriority = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
  };

  const shouldUpgradeCategory =
    priority[recommendation.sectorCategory] > priority[existing.sectorCategory];

  const shouldUpgradeConfidence =
    confidencePriority[recommendation.confidence] > confidencePriority[existing.confidence];

  map.set(recommendation.code, {
    ...existing,
    ...recommendation,
    sectorCategory: shouldUpgradeCategory
      ? recommendation.sectorCategory
      : existing.sectorCategory,
    confidence: shouldUpgradeConfidence
      ? recommendation.confidence
      : existing.confidence,
    requiredByLaw: existing.requiredByLaw || recommendation.requiredByLaw,
    recommended: existing.recommended || recommendation.recommended,
    reason: recommendation.reason || existing.reason,
  });
}

function recommendFramework(map, frameworks, code, options) {
  const framework = getFrameworkByCode(frameworks, code);

  if (!framework) {
    return;
  }

  addRecommendation(
    map,
    createRecommendation({
      framework,
      ...options,
    })
  );
}

function getSectorBasedRecommendations({ company, frameworks, recommendations }) {
  const sector = getSectorCode(company);

  if (!sector) {
    return;
  }

  const financeSectors = ['FINANCE', 'BANKING', 'INSURANCE'];
  const healthcareSectors = ['HEALTHCARE', 'PHARMA'];
  const itSectors = ['IT', 'CLOUD', 'DIGITAL_INFRASTRUCTURE', 'TELECOM'];
  const retailSectors = ['RETAIL', 'ECOMMERCE'];
  const criticalSectors = ['UTILITIES', 'WATER', 'TRANSPORT', 'LOGISTICS', 'PUBLIC', 'GOVERNMENT', 'MUNICIPAL'];

  if (financeSectors.includes(sector)) {
    recommendFramework(recommendations, frameworks, 'DORA', {
      sectorCategory: 'REQUIRED',
      requiredByLaw: true,
      recommended: true,
      confidence: 'HIGH',
      reason: 'DORA is highly relevant for financial entities and may apply depending on your exact legal scope.',
    });

    recommendFramework(recommendations, frameworks, 'GDPR', {
      sectorCategory: 'REQUIRED',
      requiredByLaw: true,
      recommended: true,
      confidence: 'HIGH',
      reason: 'GDPR is highly relevant because financial companies commonly process personal data.',
    });

    recommendFramework(recommendations, frameworks, 'ISO27001', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'ISO 27001 is commonly recommended for companies with high information security and governance needs.',
    });
  }

  if (healthcareSectors.includes(sector)) {
    recommendFramework(recommendations, frameworks, 'GDPR', {
      sectorCategory: 'REQUIRED',
      requiredByLaw: true,
      recommended: true,
      confidence: 'HIGH',
      reason: 'GDPR is highly relevant because healthcare and pharma companies often process personal and sensitive data.',
    });

    recommendFramework(recommendations, frameworks, 'ISO27001', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'ISO 27001 is commonly recommended for protecting sensitive information and critical systems.',
    });

    recommendFramework(recommendations, frameworks, 'NIS2', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'NIS2 may be relevant depending on your exact sector, size, and role in critical services.',
    });
  }

  if (itSectors.includes(sector)) {
    recommendFramework(recommendations, frameworks, 'GDPR', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'GDPR is relevant if your company processes personal data for customers, users, or employees.',
    });

    recommendFramework(recommendations, frameworks, 'NIS2', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'NIS2 may be relevant for digital infrastructure, cloud, telecom, and certain IT service providers.',
    });

    recommendFramework(recommendations, frameworks, 'ISO27001', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'ISO 27001 is commonly requested by customers and partners for IT and cloud service providers.',
    });

    recommendFramework(recommendations, frameworks, 'SOC2', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'SOC 2 can be relevant for SaaS and service providers selling to security-conscious customers.',
    });
  }

  if (retailSectors.includes(sector)) {
    recommendFramework(recommendations, frameworks, 'GDPR', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'GDPR is relevant if your company processes customer, employee, or marketing data.',
    });

    recommendFramework(recommendations, frameworks, 'D_MAERKET', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'D-mærket can be relevant for companies that want to demonstrate responsible digital practices.',
    });
  }

  if (criticalSectors.includes(sector)) {
    recommendFramework(recommendations, frameworks, 'NIS2', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'NIS2 may be relevant for companies connected to essential or important services.',
    });

    recommendFramework(recommendations, frameworks, 'ISO27001', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'ISO 27001 is commonly recommended for companies with operational or critical service dependencies.',
    });
  }
}

function getScopeBasedRecommendations({ scope, frameworks, recommendations }) {
  if (!scope) {
    return;
  }

  if (scope.processesPersonalData) {
    recommendFramework(recommendations, frameworks, 'GDPR', {
      sectorCategory: 'REQUIRED',
      requiredByLaw: true,
      recommended: true,
      confidence: 'HIGH',
      reason: 'Based on your scope answers, GDPR appears highly relevant because you process personal data.',
    });
  }

  if (scope.handlesSensitiveData) {
    recommendFramework(recommendations, frameworks, 'GDPR', {
      sectorCategory: 'REQUIRED',
      requiredByLaw: true,
      recommended: true,
      confidence: 'HIGH',
      reason: 'GDPR appears highly relevant because you handle sensitive data. DPIA or stronger controls may be relevant later.',
    });

    recommendFramework(recommendations, frameworks, 'ISO27001', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'ISO 27001 is commonly recommended when companies handle sensitive information.',
    });
  }

  if (scope.acceptsCardPayments) {
    recommendFramework(recommendations, frameworks, 'PCI_DSS', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'PCI DSS is relevant when card payment data or payment processing is in scope.',
    });
  }

  if (scope.usesAiSystems) {
    recommendFramework(recommendations, frameworks, 'AI_ACT', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'The EU AI Act may be relevant depending on how AI systems are used and classified.',
    });
  }

  if (scope.servesFinancialCustomers) {
    recommendFramework(recommendations, frameworks, 'DORA', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'DORA may be relevant if you provide ICT or digital services to financial customers.',
    });
  }

  if (scope.isDigitalServiceProvider) {
    recommendFramework(recommendations, frameworks, 'NIS2', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'NIS2 may be relevant for certain digital service providers depending on size and exact scope.',
    });

    recommendFramework(recommendations, frameworks, 'ISO27001', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'ISO 27001 is commonly recommended for digital service providers.',
    });
  }

  if (scope.operatesCriticalInfrastructure) {
    recommendFramework(recommendations, frameworks, 'NIS2', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'NIS2 may be relevant because you indicated critical infrastructure or essential service operations.',
    });

    recommendFramework(recommendations, frameworks, 'CER', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'CER may be relevant for certain critical entities depending on exact legal classification.',
    });
  }

  if (scope.usesCloudProviders) {
    recommendFramework(recommendations, frameworks, 'ISO27001', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'ISO 27001 is commonly recommended when cloud providers and shared responsibility are important.',
    });
  }

  if (scope.hasCriticalSuppliers) {
    recommendFramework(recommendations, frameworks, 'NIS2', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'NIS2 includes supply chain security expectations for relevant companies.',
    });

    recommendFramework(recommendations, frameworks, 'DORA', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'LOW',
      reason: 'DORA supplier-risk concepts may be relevant if your company is in or serves the financial sector.',
    });
  }
}

function getSystemSignalBasedRecommendations({ systemSignals, frameworks, recommendations }) {
  if (!systemSignals) {
    return;
  }

  if (systemSignals.hasPersonalDataSystems) {
    recommendFramework(recommendations, frameworks, 'GDPR', {
      sectorCategory: 'REQUIRED',
      requiredByLaw: true,
      recommended: true,
      confidence: 'HIGH',
      reason: 'GDPR appears highly relevant because registered systems contain personal data.',
    });
  }

  if (systemSignals.hasSensitiveDataSystems) {
    recommendFramework(recommendations, frameworks, 'GDPR', {
      sectorCategory: 'REQUIRED',
      requiredByLaw: true,
      recommended: true,
      confidence: 'HIGH',
      reason: 'GDPR appears highly relevant because registered systems contain sensitive data.',
    });

    recommendFramework(recommendations, frameworks, 'ISO27001', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'ISO 27001 is strongly recommended because registered systems contain sensitive information.',
    });
  }

  if (systemSignals.hasCriticalSystems || systemSignals.hasInternetExposedCriticalSystems) {
    recommendFramework(recommendations, frameworks, 'ISO27001', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'ISO 27001 is strongly recommended because the company has critical or internet-exposed systems.',
    });

    recommendFramework(recommendations, frameworks, 'NIS2', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: systemSignals.hasInternetExposedCriticalSystems ? 'HIGH' : 'MEDIUM',
      reason: 'NIS2 may be relevant because registered systems include critical or internet-exposed services.',
    });
  }

  if (systemSignals.hasPaymentSystems) {
    recommendFramework(recommendations, frameworks, 'PCI_DSS', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'PCI DSS is relevant because registered systems include payment-related systems.',
    });
  }

  if (systemSignals.hasAiSystems) {
    recommendFramework(recommendations, frameworks, 'AI_ACT', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'The EU AI Act may be relevant because registered systems include AI-related systems.',
    });
  }

  if (systemSignals.hasCriticalVendors) {
    recommendFramework(recommendations, frameworks, 'NIS2', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'NIS2 may be relevant because the company has critical vendors and supply-chain dependencies.',
    });

    recommendFramework(recommendations, frameworks, 'ISO27001', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'ISO 27001 is recommended because supplier and third-party risk management appears important.',
    });
  }

  if (systemSignals.hasCriticalDependencies) {
    recommendFramework(recommendations, frameworks, 'ISO22301', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'ISO 22301 may be relevant because the company has critical dependencies that affect continuity.',
    });

    recommendFramework(recommendations, frameworks, 'ISO27001', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'HIGH',
      reason: 'ISO 27001 is recommended because critical dependencies increase security and governance requirements.',
    });
  }

  if (systemSignals.hasPublicWebSystems || systemSignals.hasSaasSystems) {
    recommendFramework(recommendations, frameworks, 'SOC2', {
      sectorCategory: 'RECOMMENDED',
      requiredByLaw: false,
      recommended: true,
      confidence: 'MEDIUM',
      reason: 'SOC 2 may be relevant because registered systems include SaaS, public web, or customer-facing services.',
    });
  }
}

function addDefaultRecommendations({ company, scope, frameworks, recommendations, systemSignals }) {
  if (scope?.processesPersonalData || systemSignals?.hasPersonalDataSystems) {
    return;
  }

  if (!company?.sector) {
    return;
  }

  recommendFramework(recommendations, frameworks, 'ISO27001', {
    sectorCategory: 'RECOMMENDED',
    requiredByLaw: false,
    recommended: true,
    confidence: 'LOW',
    reason: 'ISO 27001 is a generally useful information security framework for many companies.',
  });

  recommendFramework(recommendations, frameworks, 'D_MAERKET', {
    sectorCategory: 'RECOMMENDED',
    requiredByLaw: false,
    recommended: true,
    confidence: 'LOW',
    reason: 'D-mærket can be useful for demonstrating responsible digital practices.',
  });
}

function buildFrameworkRecommendations({ company, scope, frameworks, systemSignals = null }) {
  const recommendations = new Map();

  getSectorBasedRecommendations({ company, frameworks, recommendations });
  getScopeBasedRecommendations({ scope, frameworks, recommendations });
  getSystemSignalBasedRecommendations({ systemSignals, frameworks, recommendations });
  addDefaultRecommendations({ company, scope, frameworks, recommendations, systemSignals });

  const recommendedCodes = new Set(recommendations.keys());

  const other = frameworks
    .filter((framework) => !recommendedCodes.has(framework.code))
    .map((framework) =>
      createRecommendation({
        framework,
        sectorCategory: 'OTHER',
        requiredByLaw: false,
        recommended: false,
        confidence: 'LOW',
        reason: 'This framework is available, but it does not appear to be a primary match based on the current sector, scope answers, and registered systems.',
      })
    );

  const allRecommendations = Array.from(recommendations.values());

  return {
    sector: company?.sector || null,
    scopeCompleted: Boolean(scope?.completedAt),
    systemSignalsUsed: Boolean(systemSignals),
    systemSignals: systemSignals || null,
    required: allRecommendations.filter((item) => item.sectorCategory === 'REQUIRED'),
    recommended: allRecommendations.filter((item) => item.sectorCategory === 'RECOMMENDED'),
    other,
  };
}

module.exports = {
  buildFrameworkRecommendations,
};