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

function approvalStateFromTask(task) {
  if (task.status === "DONE") return "APPROVED";
  if (task.status === "IN_PROGRESS") return "IN_REVIEW";
  return "PENDING";
}

function mapTaskToApproval(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: approvalStateFromTask(task),
    taskStatus: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    owner: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim() : "Unassigned",
    reviewer: "Compliance reviewer",
    framework: task.assessment?.frameworkDefinition?.name || null,
    requirement: task.requirement?.question || null,
  };
}

router.get("/approvals", authenticateToken, async (req, res, next) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const tasks = await prisma.task.findMany({
      where: { companyId },
      include: {
        assignedTo: true,
        requirement: true,
        assessment: { include: { frameworkDefinition: true } },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    });

    const approvals = tasks.map(mapTaskToApproval);
    res.json({
      summary: {
        total: approvals.length,
        pending: approvals.filter((item) => item.status === "PENDING").length,
        inReview: approvals.filter((item) => item.status === "IN_REVIEW").length,
        approved: approvals.filter((item) => item.status === "APPROVED").length,
        high: approvals.filter((item) => item.priority === "HIGH").length,
      },
      approvals,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/approvals/:id", authenticateToken, async (req, res, next) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const id = Number(req.params.id);
    const existing = await prisma.task.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Approval item not found" });

    const { decision, note } = req.body;
    const taskStatus = decision === "APPROVE" ? "DONE" : decision === "REQUEST_CHANGES" ? "OPEN" : "IN_PROGRESS";

    const task = await prisma.task.update({
      where: { id },
      data: { status: taskStatus },
      include: {
        assignedTo: true,
        requirement: true,
        assessment: { include: { frameworkDefinition: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action: `APPROVAL_${decision || "REVIEW"}`,
        entity: "Task",
        entityId: task.id,
        metadata: JSON.stringify({ note: note || null, taskStatus }),
      },
    });

    res.json(mapTaskToApproval(task));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
