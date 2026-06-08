const {
  normalizeEmail,
  normalizeName,
  normalizeCompanyName,
  normalizeUpperEnum,
  normalizeNullableString,
} = require('../src/utils/normalizeInput');

describe('Input normalization', () => {
  it('normalizes email', () => {
    expect(normalizeEmail('  TEST@MAIL.DK ')).toBe('test@mail.dk');
  });

  it('normalizes first and last names', () => {
    expect(normalizeName('simon')).toBe('Simon');
    expect(normalizeName('PEDERSEN')).toBe('Pedersen');
    expect(normalizeName('simon ali')).toBe('Simon Ali');
  });

  it('normalizes company names', () => {
    expect(normalizeCompanyName(' test aps ')).toBe('Test APS');
    expect(normalizeCompanyName('nordic security a/s')).toBe('Nordic Security A/S');
  });

  it('normalizes enum values', () => {
    expect(normalizeUpperEnum(' it ')).toBe('IT');
  });

  it('normalizes nullable strings', () => {
    expect(normalizeNullableString('')).toBe(null);
    expect(normalizeNullableString('   ')).toBe(null);
    expect(normalizeNullableString('DK')).toBe('DK');
  });
});