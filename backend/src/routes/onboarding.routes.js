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
const { createTrialSubscriptionData } = require("../services/subscription.service");
const { companyScopeSchema } = require("../validators/companyScope.validator");
const {
  buildFrameworkRecommendations,
} = require("../utils/frameworkRecommendationEngine");
const { getCompanySystemSignals } = require("../utils/companySystemSignals");
const router = express.Router();

const AVAILABLE_ONBOARDING_FRAMEWORKS = [
  {
    id: "NIS2",
    code: "NIS2",
    name: "NIS2",
    description:
      "EU cybersecurity requirements for essential and important entities.",
    category: "Cybersecurity",
  },
  {
    id: "DORA",
    code: "DORA",
    name: "DORA",
    description:
      "Digital operational resilience requirements for financial entities.",
    category: "Financial services",
  },
  {
    id: "ISO27001",
    code: "ISO27001",
    name: "ISO 27001",
    description:
      "Information security management system controls and governance.",
    category: "Information security",
  },
  {
    id: "GDPR",
    code: "GDPR",
    name: "GDPR",
    description:
      "EU personal data protection and privacy compliance requirements.",
    category: "Privacy",
  },
  {
    id: "SOC2",
    code: "SOC2",
    name: "SOC 2",
    description:
      "Trust services criteria for security, availability and confidentiality.",
    category: "Assurance",
  },
  {
    id: "CIS18",
    code: "CIS18",
    name: "CIS Controls v8",
    description:
      "Prioritized cybersecurity safeguards for practical risk reduction.",
    category: "Cybersecurity",
  },
  {
    id: "NIST_CSF",
    code: "NIST_CSF",
    name: "NIST CSF",
    description:
      "Cybersecurity framework for identifying, protecting, detecting, responding and recovering.",
    category: "Cybersecurity",
  },
  {
    id: "PCI_DSS",
    code: "PCI_DSS",
    name: "PCI DSS",
    description: "Payment card data security standard for cardholder data environments.",
    category: "Payments",
  },
  {
    id: "AI_ACT",
    code: "AI_ACT",
    name: "EU AI Act",
    description: "EU requirements for responsible AI governance and risk management.",
    category: "EU law",
  },
  {
    id: "CER",
    code: "CER",
    name: "CER",
    description: "EU critical entities resilience requirements.",
    category: "EU law",
  },
  {
    id: "ISO22301",
    code: "ISO22301",
    name: "ISO 22301",
    description: "Business continuity management system standard.",
    category: "Certification",
  },
  {
    id: "ISO42001",
    code: "ISO42001",
    name: "ISO 42001",
    description: "AI management system standard.",
    category: "Certification",
  },
];

const availableOnboardingFrameworkCodes = new Set(
  AVAILABLE_ONBOARDING_FRAMEWORKS.map((framework) => framework.code),
);

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
    const { email, firstName, lastName, companyName, jobTitle, country } = req.body;

    if (
      !email ||
      typeof email !== "string" ||
      !email.trim() ||
      !firstName ||
      typeof firstName !== "string" ||
      !firstName.trim() ||
      !lastName ||
      typeof lastName !== "string" ||
      !lastName.trim() ||
      !companyName ||
      typeof companyName !== "string" ||
      !companyName.trim()
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName.trim(),
        jobTitle:
          typeof jobTitle === "string" && jobTitle.trim()
            ? jobTitle.trim()
            : null,
        country: typeof country === "string" && country.trim() ? country.trim() : null,
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
        company: true,
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
          company: true,
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

      const existingUser = await prisma.user.findUnique({
        where: { email: demoRequest.email.toLowerCase() },
      });

      if (existingUser) {
        return res.status(409).json({
          error: "Der findes allerede en bruger med denne email",
        });
      }

      const temporaryPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      let company = demoRequest.company;

      if (!company) {
        company = await prisma.company.create({
          data: {
            name: demoRequest.companyName,
            country: demoRequest.country || null,
            ...createTrialSubscriptionData(),
          },
        });
      }

      const user = await prisma.user.create({
        data: {
          firstName: demoRequest.firstName,
          lastName: demoRequest.lastName,
          email: demoRequest.email.toLowerCase(),
          password: hashedPassword,
          role: "EVIDENCE_CONTRIBUTOR",
          isActive: true,
          mustChangePassword: true,
          companyId: company.id,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          companyId: true,
          createdAt: true,
        },
      });

      await prisma.demoRequest.update({
        where: { id },
        data: {
          status: "ACTIVATED",
          companyId: company.id,
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

    const invalidFrameworks = uniqueFrameworkCodes.filter(
      (code) => !availableOnboardingFrameworkCodes.has(code),
    );

    if (invalidFrameworks.length > 0) {
      return res.status(400).json({
        error: "One or more frameworks are invalid",
        invalidFrameworks,
      });
    }

    await prisma.$transaction(
      uniqueFrameworkCodes.map((framework) =>
        prisma.companyFramework.upsert({
          where: {
            companyId_framework: {
              companyId,
              framework,
            },
          },
          update: {
            enabled: true,
          },
          create: {
            companyId,
            framework,
            enabled: true,
          },
        }),
      ),
    );

    const user = await prisma.user.update({
      where: { id: getUserId(req) },
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

    const systemSignals = await getCompanySystemSignals(companyId);

    const recommendations = buildFrameworkRecommendations({
      company,
      scope: company.scope,
      frameworks: AVAILABLE_ONBOARDING_FRAMEWORKS,
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
