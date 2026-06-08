const express = require('express');

const prisma = require('../db');
const { requireAuth, requirePlatformAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { logAction } = require('../utils/audit');
const {
  createFrameworkSchema,
  updateFrameworkSchema,
  createSectionSchema,
  updateSectionSchema,
  createRequirementSchema,
  updateRequirementSchema,
} = require('../validators/adminFramework.validator');

const router = express.Router();

router.use(requireAuth);
router.use(requirePlatformAdmin);

router.get('/frameworks', async (req, res) => {
  try {
    const frameworks = await prisma.frameworkDefinition.findMany({
      orderBy: { id: 'asc' },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            requirements: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    return res.json(frameworks);
  } catch (error) {
    console.error('GET /admin/frameworks error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.post('/frameworks', validate(createFrameworkSchema), async (req, res) => {
  try {
    const { code, name, description, category, isActive } = req.body;

    const framework = await prisma.frameworkDefinition.create({
      data: {
        code,
        name,
        description: description || null,
        category: category || null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
    });

    await logAction({
      userId: req.user.userId,
      action: 'ADMIN_FRAMEWORK_CREATED',
      entity: 'FrameworkDefinition',
      entityId: framework.id,
      metadata: { code },
    });

    return res.status(201).json(framework);
  } catch (error) {
    console.error('POST /admin/frameworks error:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Framework code already exists' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.patch('/frameworks/:id', validate(updateFrameworkSchema), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid framework id' });
    }

    const framework = await prisma.frameworkDefinition.update({
      where: { id },
      data: req.body,
    });

    await logAction({
      userId: req.user.userId,
      action: 'ADMIN_FRAMEWORK_UPDATED',
      entity: 'FrameworkDefinition',
      entityId: framework.id,
      metadata: req.body,
    });

    return res.json(framework);
  } catch (error) {
    console.error('PATCH /admin/frameworks/:id error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Framework not found' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.post(
  '/frameworks/:id/sections',
  validate(createSectionSchema),
  async (req, res) => {
    try {
      const frameworkDefinitionId = Number(req.params.id);

      if (!Number.isInteger(frameworkDefinitionId) || frameworkDefinitionId <= 0) {
        return res.status(400).json({ error: 'Invalid framework id' });
      }

      const section = await prisma.frameworkSection.create({
        data: {
          frameworkDefinitionId,
          title: req.body.title,
          description: req.body.description || null,
          order: req.body.order,
          weight: req.body.weight || 1,
        },
      });

      await logAction({
        userId: req.user.userId,
        action: 'ADMIN_FRAMEWORK_SECTION_CREATED',
        entity: 'FrameworkSection',
        entityId: section.id,
        metadata: {
          frameworkDefinitionId,
          title: section.title,
        },
      });

      return res.status(201).json(section);
    } catch (error) {
      console.error('POST /admin/frameworks/:id/sections error:', error);

      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'A section with this order already exists in this framework',
        });
      }

      if (error.code === 'P2003') {
        return res.status(404).json({ error: 'Framework not found' });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
);

router.patch('/sections/:id', validate(updateSectionSchema), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid section id' });
    }

    const section = await prisma.frameworkSection.update({
      where: { id },
      data: req.body,
    });

    await logAction({
      userId: req.user.userId,
      action: 'ADMIN_FRAMEWORK_SECTION_UPDATED',
      entity: 'FrameworkSection',
      entityId: section.id,
      metadata: req.body,
    });

    return res.json(section);
  } catch (error) {
    console.error('PATCH /admin/sections/:id error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Section not found' });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'A section with this order already exists in this framework',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.post(
  '/sections/:id/requirements',
  validate(createRequirementSchema),
  async (req, res) => {
    try {
      const sectionId = Number(req.params.id);

      if (!Number.isInteger(sectionId) || sectionId <= 0) {
        return res.status(400).json({ error: 'Invalid section id' });
      }

      const requirement = await prisma.frameworkRequirement.create({
        data: {
          sectionId,
          question: req.body.question,
          description: req.body.description || null,
          reference: req.body.reference || null,
          implementationGuide: req.body.implementationGuide || null,
          exampleEvidence: req.body.exampleEvidence || null,
          riskIfMissing: req.body.riskIfMissing || null,
          order: req.body.order,
          weight: req.body.weight || 1,
          isRequired:
            typeof req.body.isRequired === 'boolean' ? req.body.isRequired : true,
          isActive: true,
        },
      });

      await logAction({
        userId: req.user.userId,
        action: 'ADMIN_FRAMEWORK_REQUIREMENT_CREATED',
        entity: 'FrameworkRequirement',
        entityId: requirement.id,
        metadata: {
          sectionId,
          question: requirement.question,
        },
      });

      return res.status(201).json(requirement);
    } catch (error) {
      console.error('POST /admin/sections/:id/requirements error:', error);

      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'A requirement with this order already exists in this section',
        });
      }

      if (error.code === 'P2003') {
        return res.status(404).json({ error: 'Section not found' });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
);

router.patch(
  '/requirements/:id',
  validate(updateRequirementSchema),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid requirement id' });
      }

      const requirement = await prisma.frameworkRequirement.update({
        where: { id },
        data: req.body,
      });

      await logAction({
        userId: req.user.userId,
        action: 'ADMIN_FRAMEWORK_REQUIREMENT_UPDATED',
        entity: 'FrameworkRequirement',
        entityId: requirement.id,
        metadata: req.body,
      });

      return res.json(requirement);
    } catch (error) {
      console.error('PATCH /admin/requirements/:id error:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Requirement not found' });
      }

      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'A requirement with this order already exists in this section',
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
);

router.delete('/requirements/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid requirement id' });
    }

    const requirement = await prisma.frameworkRequirement.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    await logAction({
      userId: req.user.userId,
      action: 'ADMIN_FRAMEWORK_REQUIREMENT_SOFT_DELETED',
      entity: 'FrameworkRequirement',
      entityId: requirement.id,
      metadata: {
        question: requirement.question,
      },
    });

    return res.json({
      message: 'Requirement soft deleted',
      requirement,
    });
  } catch (error) {
    console.error('DELETE /admin/requirements/:id error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;