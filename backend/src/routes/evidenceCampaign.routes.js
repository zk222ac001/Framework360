const express = require("express");

const prisma = require("../db");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

const FRAMEWORK_NAMES = {
  NIS2: "NIS2",
  DORA: "DORA",
  ISO27001: "ISO 27001",
  GDPR: "GDPR",
  SOC2: "SOC 2",
  CIS18: "CIS Controls v8",
  NIST_CSF: "NIST CSF",
};

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

function mapControlToRequest(control, index) {
  const hasEvidence = Boolean(control.evidence && control.evidence.length > 0);
  const isOpen = control.status !== "IMPLEMENTED" && control.status !== "NOT_APPLICABLE";

  return {
    id: `${control.id}-${index}`,
    answerId: control.id,
    title: control.title || "Evidence request",
    framework: FRAMEWORK_NAMES[control.framework] || control.framework || "Framework",
    section: "Controls",
    owner: control.owner || "Control owner",
    status: hasEvidence && !isOpen ? "COLLECTED" : hasEvidence ? "REQUESTED" : "REQUESTED",
    priority: control.status === "NOT_STARTED" || control.riskLevel === "HIGH" || control.riskLevel === "CRITICAL"
      ? "HIGH"
      : control.status === "IN_PROGRESS"
        ? "MEDIUM"
        : "LOW",
    dueDate: daysFromNow(index + 7).toISOString(),
    suggestedEvidence: "Policy, procedure, screenshot, system export, report, attestation, or vendor documentation",
  };
}

router.get("/evidence-campaigns", requireAuth, async (req, res, next) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const controls = await prisma.control.findMany({
      where: {
        companyId,
        OR: [
          { status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
          { evidence: { none: {} } },
        ],
      },
      include: {
        evidence: true,
      },
      orderBy: [
        { riskLevel: "desc" },
        { updatedAt: "desc" },
      ],
      take: 50,
    });

    const requests = controls.map(mapControlToRequest);
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

router.post("/evidence-campaigns/remind", requireAuth, async (req, res, next) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId || req.user?.id || null,
        action: "EVIDENCE_CAMPAIGN_REMINDER_SENT",
        entity: "EvidenceCampaign",
        metadata: { companyId, requestId: req.body?.requestId || null },
      },
    });

    res.json({ message: "Reminder recorded" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
