const {
  parseS3Uri,
  safeFileName,
  validateStorageConfig,
} = require('./storage.service');

describe('storage.service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ALLOW_LOCAL_STORAGE_IN_PRODUCTION;
    delete process.env.STORAGE_DRIVER;
    delete process.env.S3_BUCKET;
    delete process.env.S3_REGION;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    delete process.env.S3_ENDPOINT;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('requires object storage in production unless explicitly allowed', () => {
    process.env.STORAGE_DRIVER = 'local';

    expect(() => validateStorageConfig('production')).toThrow(
      'STORAGE_DRIVER must be s3 in production'
    );

    process.env.ALLOW_LOCAL_STORAGE_IN_PRODUCTION = 'true';

    expect(() => validateStorageConfig('production')).not.toThrow();
  });

  it('validates required S3 settings when S3 storage is enabled', () => {
    process.env.STORAGE_DRIVER = 's3';
    process.env.S3_BUCKET = 'framework360-evidence';
    process.env.S3_REGION = 'auto';
    process.env.S3_ACCESS_KEY_ID = 'access-key';
    process.env.S3_SECRET_ACCESS_KEY = 'secret-key';
    process.env.S3_ENDPOINT = 'https://example.r2.cloudflarestorage.com';

    expect(() => validateStorageConfig('production')).not.toThrow();
  });

  it('parses stored S3 object references', () => {
    expect(parseS3Uri('s3://bucket-name/evidence/company/file.pdf')).toEqual({
      bucket: 'bucket-name',
      key: 'evidence/company/file.pdf',
    });
  });

  it('sanitizes uploaded filenames', () => {
    const filename = safeFileName('Board Evidence Q3 2026.pdf');

    expect(filename).toMatch(/Board-Evidence-Q3-2026\.pdf$/);
    expect(filename).not.toContain(' ');
  });
});
