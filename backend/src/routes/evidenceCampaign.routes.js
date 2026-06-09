const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authenticateToken = require("../middleware/authenticateToken");

const prisma = new PrismaClient();
const router = express.Router();

function requireCompany(req, res) {
  if (!req.user?.companyId) {
    res.status(400).json({ message: "User has no company yet" });
    return null;
  }
  return req.user.companyId;
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function mapActionToRequest(action, index) {
  const hasEvidence = Boolean(action.evidence && action.evidence.length > 0);
  return {
    id: `${action.id}-${index}`,
    answerId: action.id,
    title: action.requirement?.question || "Evidence request",
    framework: action.assessment?.frameworkDefinition?.name || "Framework",
    section: action.requirement?.section?.title || "General",
    owner: action.answeredBy ? `${action.answeredBy.firstName} ${action.answeredBy.lastName}`.trim() : "Control owner",
    status: hasEvidence ? "COLLECTED" : "REQUESTED",
    priority: action.status === "NO" ? "HIGH" : action.status === "PARTIAL" ? "MEDIUM" : "LOW",
    dueDate: daysFromNow(index + 7).toISOString(),
    suggestedEvidence: action.requirement?.exampleEvidence || "Policy, procedure, screenshot, system export, report, attestation, or vendor documentation",
  };
}

router.get("/evidence-campaigns", authenticateToken, async (req, res, next) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const answers = await prisma.frameworkRequirementAnswer.findMany({
      where: {
        assessment: { companyId },
        status: { in: ["NO", "PARTIAL", "UNANSWERED"] },
      },
      include: {
        evidence: true,
        answeredBy: true,
        assessment: { include: { frameworkDefinition: true } },
        requirement: { include: { section: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const requests = answers.map(mapActionToRequest);
    const summary = {
      total: requests.length,
      requested: requests.filter((item) => item.status === "REQUESTED").length,
      collected: requests.filter((item) => item.status === "COLLECTED").length,
      overdue: requests.filter((item) => item.status !== "COLLECTED" && new Date(item.dueDate) < new Date()).length,
      high: requests.filter((item) => item.priority === "HIGH").length,
    };

    res.json({
      campaigns: [
        {
          id: "audit-readiness-campaign",
          name: "Audit readiness evidence campaign",
          description: "Collect missing evidence for non-compliant or partially compliant controls.",
          status: summary.requested === 0 ? "COMPLETE" : "ACTIVE",
          dueDate: daysFromNow(14).toISOString(),
          summary,
          requests,
        },
      ],
    });
  } catch (error) {
    next(error);
  }
});

router.post("/evidence-campaigns/remind", authenticateToken, async (req, res, next) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action: "EVIDENCE_CAMPAIGN_REMINDER_SENT",
        entity: "EvidenceCampaign",
        metadata: JSON.stringify({ companyId, requestId: req.body?.requestId || null }),
      },
    });

    res.json({ message: "Reminder recorded" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
