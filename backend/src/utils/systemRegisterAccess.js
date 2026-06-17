function getUserId(req) {
  return req.user.id || req.user.userId;
}

function getCompanyId(req, res) {
  if (!req.user.companyId) {
    res.status(400).json({
      error: 'User is not attached to a company',
    });
    return null;
  }

  return req.user.companyId;
}

function canWrite(user) {
  return user.role === 'CUSTOMER_ADMIN' || user.role === 'PLATFORM_ADMIN';
}

function requireWriteAccess(req, res) {
  if (!canWrite(req.user)) {
    res.status(403).json({
      error: 'You do not have permission to modify this resource',
    });
    return false;
  }

  return true;
}

function parsePositiveId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const id = String(value).trim();
  return id.length ? id : null;
}

function mapDateFields(data, fields) {
  const mapped = { ...data };

  for (const field of fields) {
    if (mapped[field] !== undefined && mapped[field] !== null) {
      mapped[field] = new Date(mapped[field]);
    }
  }

  return mapped;
}

module.exports = {
  getUserId,
  getCompanyId,
  canWrite,
  requireWriteAccess,
  parsePositiveId,
  mapDateFields,
};
