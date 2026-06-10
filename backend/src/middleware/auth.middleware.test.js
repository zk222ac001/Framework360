const jwt = require('jsonwebtoken');
const { requireAuth, requireRole, requirePlatformAdmin } = require('./auth.middleware');

describe('auth middleware', () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
    jest.restoreAllMocks();
  });

  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  test('requireAuth rejects missing token', () => {
    const req = { cookies: {}, headers: {} };
    const res = createResponse();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAuth accepts bearer token and sets req.user', () => {
    const token = jwt.sign({ userId: 1, role: 'CUSTOMER_ADMIN' }, process.env.JWT_SECRET);
    const req = { cookies: {}, headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(req.user.userId).toBe(1);
    expect(req.user.role).toBe('CUSTOMER_ADMIN');
    expect(next).toHaveBeenCalled();
  });

  test('requireRole rejects unauthenticated request', () => {
    const req = {};
    const res = createResponse();
    const next = jest.fn();

    requireRole('PLATFORM_ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  test('requireRole rejects missing role permission', () => {
    const req = { user: { role: 'CUSTOMER_ADMIN' } };
    const res = createResponse();
    const next = jest.fn();

    requireRole('PLATFORM_ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    expect(next).not.toHaveBeenCalled();
  });

  test('requireRole allows permitted role', () => {
    const req = { user: { role: 'CUSTOMER_ADMIN' } };
    const res = createResponse();
    const next = jest.fn();

    requireRole('PLATFORM_ADMIN', 'CUSTOMER_ADMIN')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('requirePlatformAdmin allows platform admin role', () => {
    const req = { user: { role: 'PLATFORM_ADMIN' } };
    const res = createResponse();
    const next = jest.fn();

    requirePlatformAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
