const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info('http_request_completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.user?.userId || req.user?.id || null,
      companyId: req.user?.companyId || null,
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });
  });

  next();
}

module.exports = { requestLogger };
