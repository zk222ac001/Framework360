const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({
  sendMail: mockSendMail,
}));

jest.mock('nodemailer', () => ({
  createTransport: mockCreateTransport,
}));

const { isMailConfigured, sendMail } = require('./mail.service');

describe('mail.service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: 'message-1' });
    process.env = { ...originalEnv };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    delete process.env.SMTP_PASS;
    delete process.env.MAIL_FROM;
    delete process.env.SMTP_FROM;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('accepts the current MAIL_FROM and SMTP_PASSWORD names', async () => {
    process.env.SMTP_HOST = 'smtp.resend.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'resend';
    process.env.SMTP_PASSWORD = 're_test';
    process.env.MAIL_FROM = 'Framework360 <no-reply@example.com>';

    expect(isMailConfigured()).toBe(true);

    await sendMail({
      to: 'customer@example.com',
      subject: 'Welcome',
      text: 'Hello',
    });

    expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({
      auth: { user: 'resend', pass: 're_test' },
    }));
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'Framework360 <no-reply@example.com>',
    }));
  });

  it('accepts legacy SMTP_FROM and SMTP_PASS aliases', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'password';
    process.env.SMTP_FROM = 'Framework360 <legacy@example.com>';

    expect(isMailConfigured()).toBe(true);

    await sendMail({
      to: 'customer@example.com',
      subject: 'Welcome',
      text: 'Hello',
    });

    expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({
      auth: { user: 'user', pass: 'password' },
    }));
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'Framework360 <legacy@example.com>',
    }));
  });
});
