const express = require('express');

const { requireAuth, requirePlatformAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requirePlatformAdmin);

const FRAMEWORKS = [
  ['NIS2', 'NIS2', 'EU cybersecurity requirements for essential and important entities.', 'EU law'],
  ['DORA', 'DORA', 'Digital operational resilience requirements for financial entities.', 'EU law'],
  ['ISO27001', 'ISO 27001', 'Information security management system controls and governance.', 'Certification'],
  ['GDPR', 'GDPR', 'EU personal data protection and privacy compliance requirements.', 'EU law'],
  ['SOC2', 'SOC 2', 'Trust services criteria for security, availability and confidentiality.', 'Certification'],
  ['CIS18', 'CIS Controls v8', 'Prioritized cybersecurity safeguards for practical risk reduction.', 'Security controls'],
  ['NIST_CSF', 'NIST CSF', 'Cybersecurity framework for identifying, protecting, detecting, responding and recovering.', 'Security framework'],
];

const DEFAULT_REQUIREMENTS = [
  ['Governance and ownership', 'Assign ownership, define policy expectations, and keep responsibilities visible.'],
  ['Risk assessment and treatment', 'Identify relevant risks, document decisions, and track treatment actions.'],
  ['Evidence and audit trail', 'Maintain evidence that proves the control is implemented and reviewed.'],
  ['Periodic review', 'Review control effectiveness and update documentation on a regular cadence.'],
];

function buildFramework([code, name, description, category], index) {
  const sections = [
    {
      id: index * 100 + 1,
      title: `${name} controls`,
      description: 'Core controls used by the current assessment engine.',
      order: 1,
      weight: 1,
      requirements: DEFAULT_REQUIREMENTS.map(([question, detail], requirementIndex) => ({
        id: index * 1000 + requirementIndex + 1,
        question,
        description: detail,
        reference: `${code}-${requirementIndex + 1}`,
        implementationGuide: detail,
        exampleEvidence: 'Policy, procedure, screenshot, report, or other implementation evidence.',
        riskIfMissing: 'Compliance and audit readiness may be reduced.',
        order: requirementIndex + 1,
        weight: requirementIndex < 2 ? 3 : 2,
        isRequired: true,
        isActive: true,
      })),
    },
  ];

  return {
    id: index + 1,
    code,
    name,
    description,
    category,
    isActive: true,
    sectionCount: sections.length,
    requirementCount: sections.reduce((sum, section) => sum + section.requirements.length, 0),
    sections,
  };
}

function unsupported(_req, res) {
  return res.status(501).json({
    error: 'Framework editing is not available in the current schema',
  });
}

router.get('/frameworks', async (_req, res) => {
  return res.json(FRAMEWORKS.map(buildFramework));
});

router.post('/frameworks', unsupported);
router.patch('/frameworks/:id', unsupported);
router.post('/frameworks/:id/sections', unsupported);
router.patch('/sections/:id', unsupported);
router.post('/sections/:id/requirements', unsupported);
router.patch('/requirements/:id', unsupported);
router.delete('/requirements/:id', unsupported);

module.exports = router;
