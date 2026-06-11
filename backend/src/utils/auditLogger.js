function auditLog(event) {
  const payload = {
    timestamp: new Date().toISOString(),
    type: event.type,
    actorUserId: event.actorUserId || null,
    companyId: event.companyId || null,
    targetType: event.targetType || null,
    targetId: event.targetId || null,
    action: event.action,
    metadata: event.metadata || {},
  };

  console.info(JSON.stringify({ level: 'audit', ...payload }));
}

module.exports = { auditLog };
