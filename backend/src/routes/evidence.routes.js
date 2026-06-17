const express = require("express");
const fs = require("fs");
const path = require("path");

const prisma = require("../db");
const { requireAuth } = require("../middleware/auth.middleware");
const { uploadEvidence } = require("../middleware/upload.middleware");
const { logAction } = require("../utils/audit");

const router = express.Router();

router.use(requireAuth);

const FRAMEWORK_NAMES = {
  NIS2: "NIS2",
  DORA: "DORA",
  ISO27001: "ISO 27001",
  GDPR: "GDPR",
  SOC2: "SOC 2",
  CIS18: "CIS Controls v8",
  NIST_CSF: "NIST CSF",
};

function getUserId(req) {
  return req.user.userId || req.user.id || null;
}

function getCompanyId(req, res) {
  if (!req.user?.companyId) {
    res.status(400).json({ error: "User is not attached to a company" });
    return null;
  }

  return req.user.companyId;
}

function parseRecordId(value) {
  if (value === undefined || value === null) return null;
  const id = String(value).trim();
  return id.length ? id : null;
}

function safeDownloadFilename(filename, fallbackPath) {
  const fallback = path.basename(fallbackPath || "evidence-file");
  return String(filename || fallback)
    .replace(/[\r\n"]/g, "_")
    .replace(/[\\/]/g, "_");
}

function mapEvidence(item) {
  const control = item.control || null;
  const frameworkCode = control?.framework || null;

  return {
    id: item.id,
    answerId: item.controlId,
    filename: item.title,
    originalName: item.title,
    filePath: item.filePath,
    fileType: item.fileType,
    size: item.fileSize,
    description: item.description,
    createdAt: item.createdAt,
    uploadedBy: item.uploadedBy
      ? {
          id: item.uploadedBy.id,
          firstName: item.uploadedBy.firstName,
          lastName: item.uploadedBy.lastName,
          email: item.uploadedBy.email,
        }
      : null,
    answer: control
      ? {
          id: control.id,
          status: control.answerStatus || control.status,
          note: control.answerNote || null,
          answeredAt: control.updatedAt,
        }
      : null,
    requirement: control
      ? {
          id: control.id,
          question: control.title,
          description: control.description,
          reference: control.controlId,
        }
      : null,
    section: control
      ? {
          id: `${frameworkCode}-controls`,
          title: `${FRAMEWORK_NAMES[frameworkCode] || frameworkCode} controls`,
        }
      : null,
    framework: frameworkCode
      ? {
          id: frameworkCode,
          code: frameworkCode,
          name: FRAMEWORK_NAMES[frameworkCode] || frameworkCode,
          category: "Framework",
        }
      : null,
    assessment: control
      ? {
          id: control.id,
          status: control.status,
          score: control.status === "IMPLEMENTED" || control.status === "NOT_APPLICABLE" ? 100 : 0,
        }
      : null,
  };
}

router.get("/evidence", async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const evidence = await prisma.evidence.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        control: true,
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return res.json({ evidence: evidence.map(mapEvidence) });
  } catch (error) {
    console.error("GET /evidence error:", error);
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

router.post(
  "/answers/:id/evidence",
  uploadEvidence.single("file"),
  async (req, res) => {
    try {
      const companyId = getCompanyId(req, res);
      if (!companyId) return;

      const controlId = parseRecordId(req.params.id);
      const { description } = req.body;

      if (!controlId) {
        return res.status(400).json({ error: "Invalid answer id" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "File is required" });
      }

      const control = await prisma.control.findFirst({
        where: { id: controlId },
      });

      if (!control) {
        return res.status(404).json({ error: "Answer not found" });
      }

      if (control.companyId !== companyId) {
        return res.status(403).json({ error: "No access to this answer" });
      }

      const evidence = await prisma.evidence.create({
        data: {
          companyId,
          controlId,
          uploadedById: getUserId(req),
          title: req.file.originalname,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          description: description || null,
        },
        include: {
          control: true,
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      await logAction({
        userId: getUserId(req),
        action: "EVIDENCE_UPLOADED",
        entity: "Evidence",
        entityId: evidence.id,
        metadata: {
          controlId,
          filename: evidence.title,
        },
      });

      return res.status(201).json(mapEvidence(evidence));
    } catch (error) {
      console.error("POST /answers/:id/evidence error:", error);
      return res.status(500).json({ error: "Internal server error", message: error.message });
    }
  },
);

router.get("/answers/:id/evidence", async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const controlId = parseRecordId(req.params.id);
    if (!controlId) {
      return res.status(400).json({ error: "Invalid answer id" });
    }

    const control = await prisma.control.findFirst({
      where: { id: controlId },
      select: { id: true, companyId: true },
    });

    if (!control) {
      return res.status(404).json({ error: "Answer not found" });
    }

    if (control.companyId !== companyId) {
      return res.status(403).json({ error: "No access to this answer" });
    }

    const evidence = await prisma.evidence.findMany({
      where: { companyId, controlId },
      orderBy: { createdAt: "desc" },
      include: {
        control: true,
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return res.json(evidence.map(mapEvidence));
  } catch (error) {
    console.error("GET /answers/:id/evidence error:", error);
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

router.get("/evidence/:id/file", async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const id = parseRecordId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid evidence id" });
    }

    const evidence = await prisma.evidence.findFirst({
      where: { id, companyId },
    });

    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found" });
    }

    const absolutePath = path.isAbsolute(evidence.filePath || "")
      ? evidence.filePath
      : path.resolve(process.cwd(), evidence.filePath || "");

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const fileName = safeDownloadFilename(evidence.title, absolutePath);
    const isPdf =
      evidence.fileType === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf");

    res.setHeader(
      "Content-Type",
      isPdf ? "application/pdf" : evidence.fileType || "application/octet-stream",
    );
    res.setHeader(
      "Content-Disposition",
      `${isPdf ? "inline" : "attachment"}; filename="${fileName}"`,
    );

    return res.sendFile(absolutePath);
  } catch (error) {
    console.error("GET /evidence/:id/file error:", error);
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

router.delete("/evidence/:id", async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const id = parseRecordId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid evidence id" });
    }

    const evidence = await prisma.evidence.findFirst({
      where: { id, companyId },
    });

    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found" });
    }

    await prisma.evidence.delete({ where: { id } });

    if (evidence.filePath && fs.existsSync(evidence.filePath)) {
      fs.unlinkSync(evidence.filePath);
    }

    await logAction({
      userId: getUserId(req),
      action: "EVIDENCE_DELETED",
      entity: "Evidence",
      entityId: id,
      metadata: {
        filename: evidence.title,
      },
    });

    return res.json({ message: "Evidence deleted" });
  } catch (error) {
    console.error("DELETE /evidence/:id error:", error);
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

module.exports = router;
