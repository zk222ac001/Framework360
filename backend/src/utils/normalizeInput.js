function normalizeEmail(email) {
  if (typeof email !== 'string') return email;
  return email.trim().toLowerCase();
}

function normalizeName(value) {
  if (typeof value !== 'string') return value;

  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeCompanyName(value) {
  if (typeof value !== 'string') return value;

  return value
    .trim()
    .split(/\s+/)
    .map((part) => {
      const upper = part.toUpperCase();

      if (['APS', 'A/S', 'IVS', 'P/S'].includes(upper)) {
        return upper;
      }

      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

function normalizeUpperEnum(value) {
  if (typeof value !== 'string') return value;
  return value.trim().toUpperCase();
}

function normalizeNullableString(value) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

module.exports = {
  normalizeEmail,
  normalizeName,
  normalizeCompanyName,
  normalizeUpperEnum,
  normalizeNullableString,
};