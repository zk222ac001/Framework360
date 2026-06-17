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
  updateDemoRequestSchema,
  updateDemoRequestStatusSchema,
} = require("../validators/demoRequest.validator");
const { logAction } = require("../utils/audit");
const {
  normalizeEmail,
  normalizeName,
  normalizeCompanyName,
  normalizeNullableString,
} = require("../utils/normalizeInput");
const { isCompanyEmail } = require("../utils/companyEmail");

const router = express.Router();

function generateTemporaryPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";
  const all = `${upper}${lower}${digits}${symbols}`;
  const required = [upper, lower, digits, symbols].map((chars) => chars[Math.floor(Math.random() * chars.length)]);

  while (required.length < 14) {
    required.push(all[Math.floor(Math.random() * all.length)]);
  }

  return required.sort(() => Math.random() - 0.5).join("");
}

function parseDemoRequestId(value) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

router.post("/", validate(createDemoRequestSchema), async (req, res) => {
  try {
    const { email, firstName, lastName, companyName, jobTitle, country } =
      req.body;

    const normalizedEmail = normalizeEmail(email);
    const normalizedFirstName = normalizeName(firstName);
    const normalizedLastName = normalizeName(lastName);
    const normalizedCompanyName = normalizeCompanyName(companyName);
    const normalizedJobTitle = normalizeNullableString(jobTitle);
    const normalizedCountry = normalizeNullableString(country);

    if (!isCompanyEmail(normalizedEmail)) {
      return res.status(400).json({
        error: "Please use your company email address",
      });
    }

    const [registeredUser, existing] = await Promise.all([
      prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      }),
      prisma.demoRequest.findFirst({
        where: {
          email: normalizedEmail,
          status: { in: ["PENDING", "EMAILED"] },
        },
      }),
    ]);

    if (registeredUser) {
      return res.status(409).json({
        error: "This email is already registered in the system",
      });
    }

    if (existing) {
      return res.status(409).json({
        error: "An active demo request already exists for this email",
      });
    }

    const demoRequest = await prisma.demoRequest.create({
      data: {
        email: normalizedEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        companyName: normalizedCompanyName,
        jobTitle: normalizedJobTitle,
        country: normalizedCountry,
        status: "PENDING",
      },
    });

    return res.status(201).json(demoRequest);
  } catch (error) {
    console.error("POST /demo-requests error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
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
    console.error("GET /demo-requests error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.patch(
  "/:id",
  requireAuth,
  requirePlatformAdmin,
  validate(updateDemoRequestSchema),
  async (req, res) => {
    try {
      const id = parseDemoRequestId(req.params.id);

      if (!id) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const { email, firstName, lastName, companyName, jobTitle, country } =
        req.body;

      const normalizedEmail = normalizeEmail(email);
      const normalizedFirstName = normalizeName(firstName);
      const normalizedLastName = normalizeName(lastName);
      const normalizedCompanyName = normalizeCompanyName(companyName);
      const normalizedJobTitle = normalizeNullableString(jobTitle);
      const normalizedCountry = normalizeNullableString(country);

      if (!isCompanyEmail(normalizedEmail)) {
        return res.status(400).json({
          error: "Please use your company email address",
        });
      }

      const current = await prisma.demoRequest.findUnique({
        where: { id },
        include: {
          company: true,
          createdUser: true,
        },
      });

      if (!current) {
        return res.status(404).json({ error: "Demo request not found" });
      }

      const [registeredUser, existingActiveRequest] = await Promise.all([
        prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        }),
        prisma.demoRequest.findFirst({
          where: {
            id: { not: id },
            email: normalizedEmail,
            status: { in: ["PENDING", "EMAILED"] },
          },
          select: { id: true },
        }),
      ]);

      if (registeredUser && registeredUser.id !== current.createdUserId) {
        return res.status(409).json({
          error: "This email is already registered in the system",
        });
      }

      if (existingActiveRequest) {
        return res.status(409).json({
          error: "An active demo request already exists for this email",
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const demoRequest = await tx.demoRequest.update({
          where: { id },
          data: {
            email: normalizedEmail,
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            companyName: normalizedCompanyName,
            jobTitle: normalizedJobTitle,
            country: normalizedCountry,
          },
        });

        if (current.createdUserId) {
          await tx.user.update({
            where: { id: current.createdUserId },
            data: {
              email: normalizedEmail,
              firstName: normalizedFirstName,
              lastName: normalizedLastName,
            },
          });
        }

        if (current.companyId) {
          await tx.company.update({
            where: { id: current.companyId },
            data: {
              name: normalizedCompanyName,
              country: normalizedCountry,
            },
          });
        }

        return demoRequest;
      });

      return res.json(updated);
    } catch (error) {
      console.error("PATCH /demo-requests/:id error:", error);

      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  },
);

router.delete(
  "/:id",
  requireAuth,
  requirePlatformAdmin,
  async (req, res) => {
    try {
      const id = parseDemoRequestId(req.params.id);

      if (!id) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const demoRequest = await prisma.demoRequest.findUnique({
        where: { id },
        select: {
          id: true,
          createdUserId: true,
        },
      });

      if (!demoRequest) {
        return res.status(404).json({ error: "Demo request not found" });
      }

      await prisma.$transaction(async (tx) => {
        await tx.demoRequest.delete({ where: { id } });

        if (demoRequest.createdUserId) {
          await tx.user.delete({ where: { id: demoRequest.createdUserId } });
        }
      });

      return res.json({
        deleted: true,
        deletedUser: Boolean(demoRequest.createdUserId),
      });
    } catch (error) {
      console.error("DELETE /demo-requests/:id error:", error);

      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  },
);

router.post(
  "/:id/activate",
  requireAuth,
  requirePlatformAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const demoRequest = await prisma.demoRequest.findUnique({
        where: { id },
        include: {
          createdUser: true,
          company: true,
        },
      });

      if (!demoRequest) {
        return res.status(404).json({ error: "Demo request not found" });
      }

      if (demoRequest.status === "ACTIVATED" || demoRequest.createdUser) {
        return res.json({
          user: demoRequest.createdUser,
          alreadyActivated: true,
          message: "Demo request is already activated. For security, the original temporary password cannot be shown again. Ask the user to use Forgot password if needed.",
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: demoRequest.email.toLowerCase() },
      });

      if (existingUser) {
        const updatedRequest = await prisma.demoRequest.update({
          where: { id },
          data: {
            status: "ACTIVATED",
            companyId: existingUser.companyId || demoRequest.companyId,
            createdUserId: existingUser.id,
          },
          include: {
            createdUser: true,
          },
        });

        return res.json({
          user: updatedRequest.createdUser,
          alreadyActivated: true,
          message: "A user with this email already exists. The demo request has been marked as activated. Use Forgot password if the user needs a new password.",
        });
      }

      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      let company = demoRequest.company;

      if (!company) {
        company = await prisma.company.create({
          data: {
            name: demoRequest.companyName,
            country: demoRequest.country || null,
          },
        });
      }

      const user = await prisma.user.create({
        data: {
          firstName: demoRequest.firstName,
          lastName: demoRequest.lastName,
          email: demoRequest.email.toLowerCase(),
          password: hashedPassword,
          authProvider: "LOCAL",
          providerId: null,
          role: "CUSTOMER_ADMIN",
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
          type: "DEMO_ACCESS_MANUAL_PASSWORD",
          subject: "Demo access credentials generated for manual delivery",
          sentAt: new Date(),
        },
      });

      await logAction({
        userId: req.user.userId,
        action: "USER_CREATED",
        entity: "DemoRequest",
        entityId: id,
        metadata: {
          createdUserId: user.id,
          email: user.email,
          deliveryMode: "MANUAL_PASSWORD_SHOWN_TO_PLATFORM_ADMIN_ONCE",
        },
      });

      return res.status(201).json({
        user,
        temporaryPassword,
        message: "Demo request activated. Copy this temporary password now; it will not be shown again. Tell the user to change it immediately after login or use Forgot password.",
      });
    } catch (error) {
      console.error("POST /demo-requests/:id/activate error:", error);

      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
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
        return res.status(400).json({ error: "Invalid id" });
      }

      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updated = await prisma.demoRequest.update({
        where: { id },
        data: { status },
      });

      return res.json(updated);
    } catch (error) {
      console.error("PATCH /demo-requests/:id/status error:", error);

      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  },
);

module.exports = router;
