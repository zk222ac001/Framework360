const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../db");
const {
  requireAuth,
  requirePlatformAdmin,
} = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  createDemoRequestSchema,
  updateDemoRequestStatusSchema,
} = require("../validators/demoRequest.validator");
const { logAction } = require("../utils/audit");
const { companyScopeSchema } = require("../validators/companyScope.validator");
const {
  buildFrameworkRecommendations,
} = require("../utils/frameworkRecommendationEngine");
const { getCompanySystemSignals } = require("../utils/companySystemSignals");
const router = express.Router();

function getUserId(req) {
  return req.user.id || req.user.userId;
}

function requireCompany(req, res) {
  if (!req.user.companyId) {
    res.status(400).json({
      error: "User is not attached to a company",
    });
    return null;
  }

  return req.user.companyId;
}

router.post("/", validate(createDemoRequestSchema), async (req, res) => {
  try {
    const { email, fornavn, efternavn, firmanavn, jobtitel, land } = req.body;

    if (
      !email ||
      typeof email !== "string" ||
      !email.trim() ||
      !fornavn ||
      typeof fornavn !== "string" ||
      !fornavn.trim() ||
      !efternavn ||
      typeof efternavn !== "string" ||
      !efternavn.trim() ||
      !firmanavn ||
      typeof firmanavn !== "string" ||
      !firmanavn.trim()
    ) {
      return res.status(400).json({
        error: "email, fornavn, efternavn og firmanavn er påkrævet",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.demoRequest.findFirst({
      where: {
        email: normalizedEmail,
        status: { in: ["PENDING", "EMAILED"] },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: "Der findes allerede en aktiv demo request for denne email",
      });
    }

    const demoRequest = await prisma.demoRequest.create({
      data: {
        email: normalizedEmail,
        fornavn: fornavn.trim(),
        efternavn: efternavn.trim(),
        firmanavn: firmanavn.trim(),
        jobtitel:
          typeof jobtitel === "string" && jobtitel.trim()
            ? jobtitel.trim()
            : null,
        land: typeof land === "string" && land.trim() ? land.trim() : null,
        status: "PENDING",
      },
    });

    return res.status(201).json(demoRequest);
  } catch (error) {
    console.error("POST /demo-requests fejl:", error);
    return res
      .status(500)
      .json({ error: "Intern serverfejl", message: error.message });
  }
});

router.get("/", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const demoRequests = await prisma.demoRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        virksomhed: true,
        createdUser: true,
      },
    });

    return res.json(demoRequests);
  } catch (error) {
    console.error("GET /demo-requests fejl:", error);
    return res
      .status(500)
      .json({ error: "Intern serverfejl", message: error.message });
  }
});

router.post(
  "/:id/activate",
  requireAuth,
  requirePlatformAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Ugyldigt id" });
      }

      const demoRequest = await prisma.demoRequest.findUnique({
        where: { id },
        include: {
          createdUser: true,
          virksomhed: true,
        },
      });

      if (!demoRequest) {
        return res.status(404).json({ error: "Demo request ikke fundet" });
      }

      if (demoRequest.status === "ACTIVATED" || demoRequest.createdUser) {
        return res
          .status(409)
          .json({ error: "Demo request er allerede aktiveret" });
      }

      const existingUser = await prisma.bruger.findUnique({
        where: { email: demoRequest.email.toLowerCase() },
      });

      if (existingUser) {
        return res.status(409).json({
          error: "Der findes allerede en bruger med denne email",
        });
      }

      const temporaryPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      let virksomhed = demoRequest.virksomhed;

      if (!virksomhed) {
        virksomhed = await prisma.virksomhed.create({
          data: {
            navn: demoRequest.firmanavn,
            land: demoRequest.land || null,
          },
        });
      }

      const user = await prisma.bruger.create({
        data: {
          fornavn: demoRequest.fornavn,
          efternavn: demoRequest.efternavn,
          email: demoRequest.email.toLowerCase(),
          password: hashedPassword,
          rolle: "EVIDENCE_CONTRIBUTOR",
          erAktiv: true,
          mustChangePassword: true,
          virksomhedId: virksomhed.id,
        },
        select: {
          id: true,
          fornavn: true,
          efternavn: true,
          email: true,
          rolle: true,
          erAktiv: true,
          mustChangePassword: true,
          virksomhedId: true,
          createdAt: true,
        },
      });

      await prisma.demoRequest.update({
        where: { id },
        data: {
          status: "ACTIVATED",
          virksomhedId: virksomhed.id,
          createdUserId: user.id,
        },
      });

      await prisma.emailLog.create({
        data: {
          userId: user.id,
          toEmail: user.email,
          type: "DEMO_ACCESS",
          subject: "Din demo er klar",
          sentAt: new Date(),
        },
      });

      await logAction({
        userId: req.user.userId,
        action: "DEMO_ACTIVATED",
        entity: "DemoRequest",
        entityId: id,
        metadata: {
          createdUserId: user.id,
          email: user.email,
        },
      });

      return res.status(201).json({ user, temporaryPassword });
    } catch (error) {
      console.error("POST /demo-requests/:id/activate fejl:", error);
      return res
        .status(500)
        .json({ error: "Intern serverfejl", message: error.message });
    }
  },
);

router.patch(
  "/:id/status",
  requireAuth,
  requirePlatformAdmin,
  validate(updateDemoRequestStatusSchema),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      const allowedStatuses = [
        "PENDING",
        "EMAILED",
        "ACTIVATED",
        "EXPIRED",
        "REJECTED",
      ];

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Ugyldigt id" });
      }

      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Ugyldig status" });
      }

      const updated = await prisma.demoRequest.update({
        where: { id },
        data: { status },
      });

      return res.json(updated);
    } catch (error) {
      console.error("PATCH /demo-requests/:id/status fejl:", error);
      return res
        .status(500)
        .json({ error: "Intern serverfejl", message: error.message });
    }
  },
);

router.get("/scope", requireAuth, async (req, res) => {
  try {
    const companyId = requireCompany(req, res);

    if (!companyId) {
      return;
    }

    const scope = await prisma.companyScope.findUnique({
      where: { companyId },
    });

    return res.json({
      scope,
    });
  } catch (error) {
    console.error("GET /onboarding/scope error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.post(
  "/scope",
  requireAuth,
  validate(companyScopeSchema),
  async (req, res) => {
    try {
      const companyId = requireCompany(req, res);

      if (!companyId) {
        return;
      }

      const scope = await prisma.companyScope.upsert({
        where: { companyId },
        create: {
          companyId,
          ...req.body,
          completedAt: new Date(),
        },
        update: {
          ...req.body,
          completedAt: new Date(),
        },
      });

      return res.status(201).json({
        message: "Company scope saved",
        scope,
      });
    } catch (error) {
      console.error("POST /onboarding/scope error:", error);

      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  },
);

router.patch(
  "/scope",
  requireAuth,
  validate(companyScopeSchema),
  async (req, res) => {
    try {
      const companyId = requireCompany(req, res);

      if (!companyId) {
        return;
      }

      const existingScope = await prisma.companyScope.findUnique({
        where: { companyId },
      });

      if (!existingScope) {
        return res.status(404).json({
          error: "Company scope not found",
        });
      }

      const scope = await prisma.companyScope.update({
        where: { companyId },
        data: {
          ...req.body,
          completedAt: new Date(),
        },
      });

      return res.json({
        message: "Company scope updated",
        scope,
      });
    } catch (error) {
      console.error("PATCH /onboarding/scope error:", error);

      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  },
);

router.post("/frameworks", requireAuth, async (req, res) => {
  try {
    const companyId = requireCompany(req, res);

    if (!companyId) {
      return;
    }

    const userId = getUserId(req);
    const frameworkCodes = req.body.frameworkCodes;

    if (!Array.isArray(frameworkCodes) || frameworkCodes.length === 0) {
      return res.status(400).json({
        error: "Select at least one framework",
      });
    }

    const uniqueFrameworkCodes = [
      ...new Set(
        frameworkCodes
          .filter((code) => typeof code === "string")
          .map((code) => code.trim().toUpperCase())
          .filter(Boolean),
      ),
    ];

    if (uniqueFrameworkCodes.length === 0) {
      return res.status(400).json({
        error: "Select at least one valid framework",
      });
    }

    const frameworkDefinitions = await prisma.frameworkDefinition.findMany({
      where: {
        code: {
          in: uniqueFrameworkCodes,
        },
        isActive: true,
      },
      include: {
        sections: {
          include: {
            requirements: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (frameworkDefinitions.length !== uniqueFrameworkCodes.length) {
      const foundCodes = frameworkDefinitions.map(
        (framework) => framework.code,
      );
      const missingCodes = uniqueFrameworkCodes.filter(
        (code) => !foundCodes.includes(code),
      );

      return res.status(400).json({
        error: "One or more frameworks are invalid",
        invalidFrameworks: missingCodes,
      });
    }

    for (const frameworkDefinition of frameworkDefinitions) {
      const assessment = await prisma.companyFrameworkAssessment.upsert({
        where: {
          companyId_frameworkDefinitionId: {
            companyId,
            frameworkDefinitionId: frameworkDefinition.id,
          },
        },
        update: {},
        create: {
          companyId,
          frameworkDefinitionId: frameworkDefinition.id,
          status: "IN_PROGRESS",
          score: 0,
        },
      });

      await prisma.companyFramework.upsert({
        where: {
          companyId_framework: {
            companyId,
            framework: frameworkDefinition.code,
          },
        },
        update: {},
        create: {
          companyId,
          framework: frameworkDefinition.code,
        },
      });

      const requirements = frameworkDefinition.sections.flatMap(
        (section) => section.requirements,
      );

      if (requirements.length > 0) {
        await prisma.$transaction(
          requirements.map((requirement) =>
            prisma.frameworkRequirementAnswer.upsert({
              where: {
                assessmentId_requirementId: {
                  assessmentId: assessment.id,
                  requirementId: requirement.id,
                },
              },
              update: {},
              create: {
                assessmentId: assessment.id,
                requirementId: requirement.id,
                status: "UNANSWERED",
              },
            }),
          ),
        );
      }

      await logAction({
        userId,
        action: "ONBOARDING_FRAMEWORK_SELECTED",
        entity: "CompanyFrameworkAssessment",
        entityId: assessment.id,
        metadata: {
          framework: frameworkDefinition.code,
        },
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        onboardingCompleted: true,
        companyId: true,
        company: {
          include: {
            frameworks: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Onboarding completed",
      user,
    });
  } catch (error) {
    console.error("POST /onboarding/frameworks error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.get("/recommended-frameworks", requireAuth, async (req, res) => {
  try {
    const companyId = requireCompany(req, res);

    if (!companyId) {
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        scope: true,
      },
    });

    if (!company) {
      return res.status(404).json({
        error: "Company not found",
      });
    }

    const frameworks = await prisma.frameworkDefinition.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    const systemSignals = await getCompanySystemSignals(companyId);

    const recommendations = buildFrameworkRecommendations({
      company,
      scope: company.scope,
      frameworks,
      systemSignals,
    });

    return res.json(recommendations);
  } catch (error) {
    console.error("GET /onboarding/recommended-frameworks error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
