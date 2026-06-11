const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.MAIL_FROM);
}

function createTransporter() {
  if (!isMailConfigured()) return null;

  const auth = process.env.SMTP_USER && process.env.SMTP_PASSWORD
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
    : undefined;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth,
  });
}

function appUrl(path = '/') {
  const baseUrl = process.env.APP_BASE_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function sendMail({ to, subject, text, html }) {
  const transporter = createTransporter();

  if (!transporter) {
    logger.warn('email_skipped_missing_smtp_config', { to, subject });
    return { sent: false, skipped: true, reason: 'SMTP is not configured' };
  }

  const result = await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, text, html });
  logger.info('email_sent', { to, subject, messageId: result.messageId || null });
  return { sent: true, skipped: false, messageId: result.messageId || null };
}

async function sendAccountActivatedEmail({ to, firstName }) {
  const loginUrl = appUrl('/login');
  const name = firstName || 'there';
  const subject = 'Your Framework360 account is ready';
  const text = `Hello ${name},\n\nYour Framework360 account has been activated.\n\nSign in here: ${loginUrl}\n\nRegards,\nFramework360 Team`;
  const html = `<p>Hello ${name},</p><p>Your Framework360 account has been activated.</p><p>Sign in here: <a href="${loginUrl}">${loginUrl}</a></p><p>Regards,<br />Framework360 Team</p>`;

  return sendMail({ to, subject, text, html });
}

module.exports = { isMailConfigured, sendMail, sendAccountActivatedEmail };
