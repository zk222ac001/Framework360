const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CORS_ORIGIN',
];

function validateEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
    }

    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production.');
    }

    if (process.env.JWT_SECRET === 'dev-secret-change-me') {
      throw new Error('JWT_SECRET must not use the development default in production.');
    }

    if (process.env.CORS_ORIGIN.includes('localhost')) {
      throw new Error('CORS_ORIGIN must not point to localhost in production.');
    }
  }
}

module.exports = { validateEnv };
