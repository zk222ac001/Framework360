const prisma = require('../db');
const { sendMail, appUrl } = require('./mail.service');
const { SUBSCRIPTION_STATUSES } = require('./subscription.service');

const REMINDER_DAYS = [7, 3, 1];

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function buildReminderType(daysRemaining, renewalDate) {
  return `SUBSCRIPTION_TRIAL_REMINDER_${daysRemaining}_DAYS_${renewalDate.toISOString().slice(0, 10)}`;
}

async function sendTrialReminderForCompany(company, daysRemaining) {
  const renewalDate = new Date(company.subscriptionRenewal);
  const emailType = buildReminderType(daysRemaining, renewalDate);
  const admins = company.users.filter((user) => user.isActive && user.email);
  const results = [];

  for (const admin of admins) {
    const existingLog = await prisma.emailLog.findFirst({
      where: {
        toEmail: admin.email,
        type: emailType,
      },
      select: { id: true },
    });

    if (existingLog) {
      results.push({ toEmail: admin.email, skipped: true, reason: 'Already sent' });
      continue;
    }

    const loginUrl = appUrl('/login');
    const subject = `Framework360 trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;
    const text = `Hello ${admin.firstName || 'there'},\n\nYour Framework360 trial for ${company.name} expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} on ${renewalDate.toISOString().slice(0, 10)}.\n\nTo continue using Framework360, contact your Framework360 administrator or sign in here: ${loginUrl}\n\nRegards,\nFramework360 Team`;
    const html = `<p>Hello ${admin.firstName || 'there'},</p><p>Your Framework360 trial for <strong>${company.name}</strong> expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} on ${renewalDate.toISOString().slice(0, 10)}.</p><p>To continue using Framework360, contact your Framework360 administrator or <a href="${loginUrl}">sign in here</a>.</p><p>Regards,<br />Framework360 Team</p>`;

    const emailResult = await sendMail({ to: admin.email, subject, text, html });

    await prisma.emailLog.create({
      data: {
        userId: admin.id,
        toEmail: admin.email,
        type: emailType,
        subject,
        sentAt: new Date(),
      },
    });

    results.push({ toEmail: admin.email, ...emailResult });
  }

  return results;
}

async function sendTrialExpiryReminders(now = new Date()) {
  const today = startOfUtcDay(now);
  const summary = [];

  for (const daysRemaining of REMINDER_DAYS) {
    const start = addDays(today, daysRemaining);
    const end = addDays(start, 1);

    const companies = await prisma.company.findMany({
      where: {
        subscriptionStatus: SUBSCRIPTION_STATUSES.TRIAL,
        subscriptionRenewal: {
          gte: start,
          lt: end,
        },
      },
      include: {
        users: {
          where: {
            role: 'CUSTOMER_ADMIN',
          },
          select: {
            id: true,
            firstName: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    for (const company of companies) {
      const emailResults = await sendTrialReminderForCompany(company, daysRemaining);
      summary.push({
        companyId: company.id,
        companyName: company.name,
        daysRemaining,
        emailResults,
      });
    }
  }

  return {
    checkedDays: REMINDER_DAYS,
    reminders: summary,
  };
}

module.exports = {
  REMINDER_DAYS,
  sendTrialExpiryReminders,
};
