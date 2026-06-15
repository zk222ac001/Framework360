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
const { sendAccountActivatedEmail } = require("../services/mail.service");
const {
  normalizeEmail,
  normalizeName,
  normalizeCompanyName,
  normalizeNullableString,
} = require("../utils/normalizeInput");

const router = express.Router();

function shouldExposeDevTemporaryPassword() {
  return process.env.NODE_ENV !== "production" && process.env.EXPOSE_DEV_TEMPORARY_PASSWORD === "true";
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

    const existing = await prisma.demoRequest.findFirst({
      where: {
        email: normalizedEmail,
        status: { in: ["PENDING", "EMAILED"] },
      },
    });

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
          activationEmail: { sent: false, skipped: true },
          alreadyActivated: true,
          message: "Demo request is already activated",
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
          activationEmail: { sent: false, skipped: true },
          alreadyActivated: true,
          message: "A user with this email already exists. The demo request has been marked as activated.",
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

      let activationEmail = { sent: false, skipped: true };
      try {
        activationEmail = await sendAccountActivatedEmail({
          to: user.email,
          firstName: user.firstName,
        });
      } catch (emailError) {
        activationEmail = { sent: false, skipped: false };
      }

      await prisma.emailLog.create({
        data: {
          userId: user.id,
          toEmail: user.email,
          type: "DEMO_ACCESS",
          subject: "Your Framework360 account is ready",
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
          activationEmail,
        },
      });

      const response = { user, activationEmail };
      if (shouldExposeDevTemporaryPassword()) {
        response.temporaryPassword = temporaryPassword;
      }

      return res.status(201).json(response);
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
