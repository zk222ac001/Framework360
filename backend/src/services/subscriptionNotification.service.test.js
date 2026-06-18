jest.mock('../db', () => ({
  company: {
    findMany: jest.fn(),
  },
  emailLog: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('./mail.service', () => ({
  sendMail: jest.fn(),
  appUrl: jest.fn((path = '/') => `https://framework360.test${path}`),
}));

const prisma = require('../db');
const { sendMail } = require('./mail.service');
const { SUBSCRIPTION_STATUSES } = require('./subscription.service');
const { sendTrialExpiryReminders } = require('./subscriptionNotification.service');

describe('subscriptionNotification.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendMail.mockResolvedValue({ sent: true, skipped: false, messageId: 'message-1' });
    prisma.emailLog.findFirst.mockResolvedValue(null);
    prisma.emailLog.create.mockResolvedValue({ id: 'email-log-1' });
  });

  it('checks 7, 3, and 1 day reminder windows', async () => {
    prisma.company.findMany.mockResolvedValue([]);

    const result = await sendTrialExpiryReminders(new Date('2026-06-18T12:00:00.000Z'));

    expect(result.checkedDays).toEqual([7, 3, 1]);
    expect(result.reminders).toEqual([]);
    expect(prisma.company.findMany).toHaveBeenCalledTimes(3);
    expect(prisma.company.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          subscriptionStatus: SUBSCRIPTION_STATUSES.TRIAL,
          subscriptionRenewal: {
            gte: new Date('2026-06-25T00:00:00.000Z'),
            lt: new Date('2026-06-26T00:00:00.000Z'),
          },
        }),
      }),
    );
  });

  it('sends a reminder email to active customer admins and records EmailLog', async () => {
    prisma.company.findMany
      .mockResolvedValueOnce([
        {
          id: 'company-1',
          name: 'Acme Compliance',
          subscriptionRenewal: new Date('2026-06-25T10:00:00.000Z'),
          users: [
            { id: 'user-1', firstName: 'Anna', email: 'anna@example.com', isActive: true },
          ],
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await sendTrialExpiryReminders(new Date('2026-06-18T12:00:00.000Z'));

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'anna@example.com',
      subject: 'Framework360 trial expires in 7 days',
    }));
    expect(prisma.emailLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        toEmail: 'anna@example.com',
        type: 'SUBSCRIPTION_TRIAL_REMINDER_7_DAYS_2026-06-25',
      }),
    });
    expect(result.reminders).toHaveLength(1);
    expect(result.reminders[0].companyId).toBe('company-1');
  });

  it('does not send duplicate reminders when an EmailLog already exists', async () => {
    prisma.company.findMany
      .mockResolvedValueOnce([
        {
          id: 'company-1',
          name: 'Acme Compliance',
          subscriptionRenewal: new Date('2026-06-25T10:00:00.000Z'),
          users: [
            { id: 'user-1', firstName: 'Anna', email: 'anna@example.com', isActive: true },
          ],
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prisma.emailLog.findFirst.mockResolvedValue({ id: 'existing-log' });

    const result = await sendTrialExpiryReminders(new Date('2026-06-18T12:00:00.000Z'));

    expect(sendMail).not.toHaveBeenCalled();
    expect(prisma.emailLog.create).not.toHaveBeenCalled();
    expect(result.reminders[0].emailResults[0]).toEqual({
      toEmail: 'anna@example.com',
      skipped: true,
      reason: 'Already sent',
    });
  });
});
