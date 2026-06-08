const express = require('express');
const fs = require('fs');
const path = require('path');

const prisma = require('../db');
const { requireAuth, requirePlatformAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requirePlatformAdmin);

const seedDir = path.join(process.cwd(), 'prisma', 'seed-data');

function getSeedFilePath(code) {
  const safeCode = code.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return path.join(seedDir, `${safeCode}.json`);
}

router.get('/seed-files', async (req, res) => {
  try {
    const files = fs
      .readdirSync(seedDir)
      .filter((file) => file.endsWith('.json'));

    return res.json({ files });
  } catch (error) {
    console.error('GET /admin/seed-files error:', error);

    return res.status(500).json({
      error: 'Could not fetch seed files',
      message: error.message,
    });
  }
});

router.get('/seed-files/:code', async (req, res) => {
  try {
    const filePath = getSeedFilePath(req.params.code);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Seed file not found' });
    }

    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    return res.json(json);
  } catch (error) {
    console.error('GET /admin/seed-files/:code error:', error);

    return res.status(500).json({
      error: 'Could not read seed file',
      message: error.message,
    });
  }
});

router.put('/seed-files/:code', async (req, res) => {
  try {
    const filePath = getSeedFilePath(req.params.code);
    const payload = req.body;

    if (!payload.code || !payload.name || !Array.isArray(payload.sections)) {
      return res.status(400).json({
        error: 'Invalid seed structure',
      });
    }

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');

    return res.json({
      message: 'Seed file updated',
      file: path.basename(filePath),
    });
  } catch (error) {
    console.error('PUT /admin/seed-files/:code error:', error);

    return res.status(500).json({
      error: 'Could not update seed file',
      message: error.message,
    });
  }
});

router.post('/seed-files/:code/import', async (req, res) => {
  try {
    const filePath = getSeedFilePath(req.params.code);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Seed file not found' });
    }

    const framework = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = await importFramework(framework);

    return res.json({
      message: 'Framework imported to database',
      result,
    });
  } catch (error) {
    console.error('POST /admin/seed-files/:code/import error:', error);

    return res.status(500).json({
      error: 'Could not import framework',
      message: error.message,
    });
  }
});

async function importFramework(framework) {
  const frameworkDefinition = await prisma.frameworkDefinition.upsert({
    where: { code: framework.code },
    update: {
      name: framework.name,
      description: framework.description || null,
      category: framework.category || null,
      isActive: true,
    },
    create: {
      code: framework.code,
      name: framework.name,
      description: framework.description || null,
      category: framework.category || null,
      isActive: true,
    },
  });

  for (const section of framework.sections) {
    const dbSection = await prisma.frameworkSection.upsert({
      where: {
        frameworkDefinitionId_order: {
          frameworkDefinitionId: frameworkDefinition.id,
          order: section.order,
        },
      },
      update: {
        title: section.title,
        description: section.description || null,
        weight: section.weight || 1,
      },
      create: {
        frameworkDefinitionId: frameworkDefinition.id,
        title: section.title,
        description: section.description || null,
        order: section.order,
        weight: section.weight || 1,
      },
    });

    for (const requirement of section.requirements) {
      await prisma.frameworkRequirement.upsert({
        where: {
          sectionId_order: {
            sectionId: dbSection.id,
            order: requirement.order,
          },
        },
        update: {
          question: requirement.question,
          description: requirement.description || null,
          reference: requirement.reference || null,
          implementationGuide: requirement.implementationGuide || null,
          exampleEvidence: requirement.exampleEvidence || null,
          riskIfMissing: requirement.riskIfMissing || null,
          weight: requirement.weight || 1,
          isRequired:
            typeof requirement.isRequired === 'boolean'
              ? requirement.isRequired
              : true,
          isActive: true,
        },
        create: {
          sectionId: dbSection.id,
          question: requirement.question,
          description: requirement.description || null,
          reference: requirement.reference || null,
          implementationGuide: requirement.implementationGuide || null,
          exampleEvidence: requirement.exampleEvidence || null,
          riskIfMissing: requirement.riskIfMissing || null,
          order: requirement.order,
          weight: requirement.weight || 1,
          isRequired:
            typeof requirement.isRequired === 'boolean'
              ? requirement.isRequired
              : true,
          isActive: true,
        },
      });
    }
  }

  return {
    frameworkId: frameworkDefinition.id,
    code: frameworkDefinition.code,
    sections: framework.sections.length,
    requirements: framework.sections.reduce(
      (sum, section) => sum + section.requirements.length,
      0
    ),
  };
}

module.exports = router;