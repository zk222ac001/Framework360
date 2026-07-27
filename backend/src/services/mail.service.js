const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && getMailFrom());
}

function getSmtpPassword() {
  return process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
}

function getMailFrom() {
  return process.env.MAIL_FROM || process.env.SMTP_FROM;
}

function createTransporter() {
  if (!isMailConfigured()) return null;

  const smtpPassword = getSmtpPassword();
  const auth = process.env.SMTP_USER && smtpPassword
    ? { user: process.env.SMTP_USER, pass: smtpPassword }
    : undefined;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth,
  });
}

function appUrl(path = '/') {
  const baseUrl = process.env.APP_BASE_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function sendMail({ to, subject, text, html }) {
  const transporter = createTransporter();

  if (!transporter) {
    logger.warn('email_skipped_missing_smtp_config', { to, subject });
    return { sent: false, skipped: true, reason: 'SMTP is not configured' };
  }

  const result = await transporter.sendMail({ from: getMailFrom(), to, subject, text, html });
  logger.info('email_sent', { to, subject, messageId: result.messageId || null });
  return { sent: true, skipped: false, messageId: result.messageId || null };
}

async function sendAccountActivatedEmail({ to, firstName, setupUrl }) {
  const loginUrl = appUrl('/login');
  const actionUrl = setupUrl || loginUrl;
  const name = firstName || 'there';
  const subject = 'Your Framework360 account is ready';
  const text = `Hello ${name},\n\nYour Framework360 account has been activated.\n\nSet your password and sign in here: ${actionUrl}\n\nThis link expires in 1 hour.\n\nRegards,\nFramework360 Team`;
  const html = `<p>Hello ${name},</p><p>Your Framework360 account has been activated.</p><p><a href="${actionUrl}">Set your password and sign in</a></p><p>This link expires in 1 hour.</p><p>Regards,<br />Framework360 Team</p>`;

  return sendMail({ to, subject, text, html });
}

module.exports = { isMailConfigured, sendMail, sendAccountActivatedEmail, appUrl };
