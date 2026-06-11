function serializeError(error) {
  if (!error) return null;

  return {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  };
}

function log(level, message, fields = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'framework360-backend',
    environment: process.env.NODE_ENV || 'development',
    ...fields,
  };

  if (entry.error instanceof Error) {
    entry.error = serializeError(entry.error);
  }

  const line = JSON.stringify(entry);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.info(line);
}

module.exports = {
  info: (message, fields) => log('info', message, fields),
  warn: (message, fields) => log('warn', message, fields),
  error: (message, fields) => log('error', message, fields),
};
