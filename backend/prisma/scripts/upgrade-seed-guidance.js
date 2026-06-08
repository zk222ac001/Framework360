const fs = require('fs');
const path = require('path');

const seedDir = path.join(__dirname, '..', 'seed-data');

function buildImplementationGuide(requirement, frameworkCode) {
  return `Document and implement a control for: "${requirement.question}". Review current practice, assign an owner, define the process, and keep evidence updated for ${frameworkCode}.`;
}

function buildExampleEvidence(requirement) {
  const ref = requirement.reference || 'the requirement';

  return `Policy, procedure, screenshot, system export, contract, log, or documentation proving compliance with ${ref}.`;
}

function buildRiskIfMissing() {
  return `Missing this control increases compliance risk, reduces audit readiness, and may lead to security or regulatory issues.`;
}

function upgradeFramework(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const framework = JSON.parse(raw);

  framework.sections = framework.sections.map((section) => ({
    ...section,
    requirements: section.requirements.map((requirement) => ({
      ...requirement,
      implementationGuide:
        requirement.implementationGuide ||
        buildImplementationGuide(requirement, framework.code),
      exampleEvidence:
        requirement.exampleEvidence ||
        buildExampleEvidence(requirement),
      riskIfMissing:
        requirement.riskIfMissing ||
        buildRiskIfMissing(),
    })),
  }));

  fs.writeFileSync(filePath, JSON.stringify(framework, null, 2), 'utf8');

  console.log(`Updated: ${path.basename(filePath)}`);
}

function main() {
  if (!fs.existsSync(seedDir)) {
    console.error('❌ seed-data folder not found:', seedDir);
    return;
  }

  const files = fs
    .readdirSync(seedDir)
    .filter((file) => file.endsWith('.json'));

  for (const file of files) {
    upgradeFramework(path.join(seedDir, file));
  }

  console.log('✅ Seed data upgraded successfully');
}

main();