const express = require("express");
const fs = require("fs");
const path = require("path");

const prisma = require("../db");
const { requireAuth } = require("../middleware/auth.middleware");
const { uploadEvidence } = require("../middleware/upload.middleware");
const { logAction } = require("../utils/audit");

const router = express.Router();

router.use(requireAuth);

function safeDownloadFilename(filename, fallbackPath) {
  const fallback = path.basename(fallbackPath || "evidence-file");
  return String(filename || fallback)
    .replace(/[\r\n"]/g, "_")
    .replace(/[\\/]/g, "_");
}

router.get("/evidence", async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        error: "User is not attached to a company",
      });
    }

    const evidence = await prisma.frameworkEvidence.findMany({
      where: {
        answer: {
          assessment: {
            companyId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        answer: {
          select: {
            id: true,
            status: true,
            note: true,
            answeredAt: true,
            requirement: {
              select: {
                id: true,
                question: true,
                description: true,
                reference: true,
                section: {
                  select: {
                    id: true,
                    title: true,
                    frameworkDefinition: {
                      select: {
                        id: true,
                        code: true,
                        name: true,
                        category: true,
                      },
                    },
                  },
                },
              },
            },
            assessment: {
              select: {
                id: true,
                status: true,
                score: true,
                companyId: true,
              },
            },
          },
        },
      },
    });

    const result = evidence.map((item) => ({
      id: item.id,
      answerId: item.answerId,
      filename: item.filename,
      filePath: item.filePath,
      fileType: item.fileType,
      size: item.size,
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

      answer: item.answer
        ? {
            id: item.answer.id,
            status: item.answer.status,
            note: item.answer.note,
            answeredAt: item.answer.answeredAt,
          }
        : null,

      requirement: item.answer?.requirement
        ? {
            id: item.answer.requirement.id,
            question: item.answer.requirement.question,
            description: item.answer.requirement.description,
            reference: item.answer.requirement.reference,
          }
        : null,

      section: item.answer?.requirement?.section
        ? {
            id: item.answer.requirement.section.id,
            title: item.answer.requirement.section.title,
          }
        : null,

      framework: item.answer?.requirement?.section?.frameworkDefinition
        ? {
            id: item.answer.requirement.section.frameworkDefinition.id,
            code: item.answer.requirement.section.frameworkDefinition.code,
            name: item.answer.requirement.section.frameworkDefinition.name,
            category: item.answer.requirement.section.frameworkDefinition.category,
          }
        : null,

      assessment: item.answer?.assessment
        ? {
            id: item.answer.assessment.id,
            status: item.answer.assessment.status,
            score: item.answer.assessment.score,
          }
        : null,
    }));

    return res.json({
      evidence: result,
    });
  } catch (error) {
    console.error("GET /evidence error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.post(
  "/answers/:id/evidence",
  uploadEvidence.single("file"),
  async (req, res) => {
    try {
      const answerId = Number(req.params.id);
      const { description } = req.body;

      if (!Number.isInteger(answerId) || answerId <= 0) {
        return res.status(400).json({ error: "Invalid answer id" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "File is required" });
      }

      const answer = await prisma.frameworkRequirementAnswer.findUnique({
        where: { id: answerId },
        include: {
          assessment: true,
        },
      });

      if (!answer) {
        return res.status(404).json({ error: "Answer not found" });
      }

      if (answer.assessment.companyId !== req.user.companyId) {
        return res.status(403).json({ error: "No access to this answer" });
      }

      const evidence = await prisma.frameworkEvidence.create({
        data: {
          answerId,
          filename: req.file.originalname,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          size: req.file.size,
          uploadedByUserId: req.user.userId,
          description: description || null,
        },
      });

      await logAction({
        userId: req.user.userId,
        action: "EVIDENCE_UPLOADED",
        entity: "FrameworkEvidence",
        entityId: evidence.id,
        metadata: {
          answerId,
          filename: evidence.filename,
        },
      });

      return res.status(201).json(evidence);
    } catch (error) {
      console.error("POST /answers/:id/evidence error:", error);

      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  },
);

router.get("/answers/:id/evidence", async (req, res) => {
  try {
    const answerId = Number(req.params.id);

    if (!Number.isInteger(answerId) || answerId <= 0) {
      return res.status(400).json({ error: "Invalid answer id" });
    }

    const answer = await prisma.frameworkRequirementAnswer.findUnique({
      where: { id: answerId },
      include: {
        assessment: true,
      },
    });

    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    if (answer.assessment.companyId !== req.user.companyId) {
      return res.status(403).json({ error: "No access to this answer" });
    }

    const evidence = await prisma.frameworkEvidence.findMany({
      where: { answerId },
      orderBy: { createdAt: "desc" },
      include: {
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

    return res.json(evidence);
  } catch (error) {
    console.error("GET /answers/:id/evidence error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.get("/evidence/:id/file", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid evidence id" });
    }

    const evidence = await prisma.frameworkEvidence.findUnique({
      where: { id },
      include: {
        answer: {
          include: {
            assessment: true,
          },
        },
      },
    });

    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found" });
    }

    if (evidence.answer.assessment.companyId !== req.user.companyId) {
      return res.status(403).json({ error: "No access to this evidence" });
    }

    const absolutePath = path.isAbsolute(evidence.filePath)
      ? evidence.filePath
      : path.resolve(process.cwd(), evidence.filePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        error: "File not found",
      });
    }

    const fileName = safeDownloadFilename(evidence.filename, absolutePath);
    const isPdf =
      evidence.fileType === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf");

    res.setHeader(
      "Content-Type",
      isPdf
        ? "application/pdf"
        : evidence.fileType || "application/octet-stream",
    );

    res.setHeader(
      "Content-Disposition",
      `${isPdf ? "inline" : "attachment"}; filename="${fileName}"`,
    );

    return res.sendFile(absolutePath);
  } catch (error) {
    console.error("GET /evidence/:id/file error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.delete("/evidence/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid evidence id" });
    }

    const evidence = await prisma.frameworkEvidence.findUnique({
      where: { id },
      include: {
        answer: {
          include: {
            assessment: true,
          },
        },
      },
    });

    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found" });
    }

    if (evidence.answer.assessment.companyId !== req.user.companyId) {
      return res.status(403).json({ error: "No access to this evidence" });
    }

    await prisma.frameworkEvidence.delete({
      where: { id },
    });

    if (fs.existsSync(evidence.filePath)) {
      fs.unlinkSync(evidence.filePath);
    }

    await logAction({
      userId: req.user.userId,
      action: "EVIDENCE_DELETED",
      entity: "FrameworkEvidence",
      entityId: id,
      metadata: {
        filename: evidence.filename,
      },
    });

    return res.json({
      message: "Evidence deleted",
    });
  } catch (error) {
    console.error("DELETE /evidence/:id error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
