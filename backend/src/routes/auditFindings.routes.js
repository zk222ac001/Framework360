const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

function requireCompany(req, res) {
  if (!req.user?.companyId) {
    res.status(400).json({ message: "User has no company yet" });
    return null;
  }
  return req.user.companyId;
}

function mapTaskToFinding(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    owner: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim() : "Unassigned",
    framework: task.assessment?.frameworkDefinition?.name || null,
    requirement: task.requirement?.question || null,
    reference: task.requirement?.reference || null,
  };
}

router.get("/audit-findings", requireAuth, async (req, res, next) => {
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
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    const findings = tasks.map(mapTaskToFinding);
    const summary = {
      total: findings.length,
      open: findings.filter((item) => item.status === "OPEN").length,
      inProgress: findings.filter((item) => item.status === "IN_PROGRESS").length,
      done: findings.filter((item) => item.status === "DONE").length,
      high: findings.filter((item) => item.priority === "HIGH").length,
    };

    res.json({ summary, findings });
  } catch (error) {
    next(error);
  }
});

router.post("/audit-findings", requireAuth, async (req, res, next) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const { title, description, priority = "MEDIUM", dueDate } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await prisma.task.create({
      data: {
        companyId,
        title: String(title).trim(),
        description: description ? String(description) : null,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "OPEN",
      },
      include: { assignedTo: true, requirement: true, assessment: { include: { frameworkDefinition: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId || null,
        action: "AUDIT_FINDING_CREATED",
        entity: "Task",
        entityId: task.id,
        metadata: JSON.stringify({ title: task.title, priority: task.priority }),
      },
    });

    res.status(201).json(mapTaskToFinding(task));
  } catch (error) {
    next(error);
  }
});

router.patch("/audit-findings/:id", requireAuth, async (req, res, next) => {
  try {
    const companyId = requireCompany(req, res);
    if (!companyId) return;

    const id = Number(req.params.id);
    const existing = await prisma.task.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Finding not found" });

    const { title, description, priority, status, dueDate } = req.body;
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(description !== undefined ? { description: description ? String(description) : null } : {}),
        ...(priority ? { priority } : {}),
        ...(status ? { status } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      },
      include: { assignedTo: true, requirement: true, assessment: { include: { frameworkDefinition: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId || null,
        action: "AUDIT_FINDING_UPDATED",
        entity: "Task",
        entityId: task.id,
        metadata: JSON.stringify({ status: task.status, priority: task.priority }),
      },
    });

    res.json(mapTaskToFinding(task));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
