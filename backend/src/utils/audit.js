const prisma = require('../db');

async function logAction({ userId, action, entity, entityId, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

module.exports = { logAction };