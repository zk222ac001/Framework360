const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'evidence');
let s3Client;
let s3Sdk;

function getS3Sdk() {
  if (!s3Sdk) {
    s3Sdk = require('@aws-sdk/client-s3');
  }
  return s3Sdk;
}

function boolFromEnv(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function getStorageDriver() {
  return String(process.env.STORAGE_DRIVER || 'local').trim().toLowerCase();
}

function safeFileName(originalName) {
  const extension = path.extname(originalName || '').toLowerCase();
  const baseName = path
    .basename(originalName || 'evidence', extension)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'evidence';

  return `${Date.now()}-${crypto.randomUUID()}-${baseName}${extension}`;
}

function ensureLocalUploadDir() {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
}

function getS3Bucket() {
  return String(process.env.S3_BUCKET || '').trim();
}

function getS3Client() {
  if (s3Client) return s3Client;

  const { S3Client } = getS3Sdk();
  const endpoint = String(process.env.S3_ENDPOINT || '').trim() || undefined;
  const forcePathStyle = boolFromEnv(process.env.S3_FORCE_PATH_STYLE, Boolean(endpoint));

  s3Client = new S3Client({
    region: String(process.env.S3_REGION || '').trim(),
    endpoint,
    forcePathStyle,
    credentials: {
      accessKeyId: String(process.env.S3_ACCESS_KEY_ID || '').trim(),
      secretAccessKey: String(process.env.S3_SECRET_ACCESS_KEY || '').trim(),
    },
  });

  return s3Client;
}

function buildS3Key({ companyId, originalName }) {
  const prefix = String(process.env.S3_KEY_PREFIX || 'evidence')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/');
  const safeCompanyId = String(companyId || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '-');

  return `${prefix}/${safeCompanyId}/${safeFileName(originalName)}`;
}

function buildS3Uri(bucket, key) {
  return `s3://${bucket}/${key}`;
}

function parseS3Uri(filePath) {
  const value = String(filePath || '');
  if (!value.startsWith('s3://')) return null;

  const withoutScheme = value.slice('s3://'.length);
  const slashIndex = withoutScheme.indexOf('/');
  if (slashIndex === -1) return null;

  return {
    bucket: withoutScheme.slice(0, slashIndex),
    key: withoutScheme.slice(slashIndex + 1),
  };
}

async function uploadToLocal({ file }) {
  ensureLocalUploadDir();

  const filename = safeFileName(file.originalname);
  const filePath = path.join(LOCAL_UPLOAD_DIR, filename);

  await fs.promises.writeFile(filePath, file.buffer);

  return {
    filePath,
    fileType: file.mimetype,
    fileSize: file.size,
  };
}

async function uploadToS3({ file, companyId }) {
  const { PutObjectCommand } = getS3Sdk();
  const bucket = getS3Bucket();
  const key = buildS3Key({ companyId, originalName: file.originalname });

  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ContentLength: file.size,
    Metadata: {
      originalName: Buffer.from(file.originalname || 'evidence').toString('base64'),
    },
  }));

  return {
    filePath: buildS3Uri(bucket, key),
    fileType: file.mimetype,
    fileSize: file.size,
  };
}

async function storeEvidenceFile({ file, companyId }) {
  if (!file?.buffer) {
    throw new Error('Uploaded file buffer is missing');
  }

  if (getStorageDriver() === 's3') {
    return uploadToS3({ file, companyId });
  }

  return uploadToLocal({ file });
}

async function bodyToBuffer(body) {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body.transformToByteArray === 'function') {
    return Buffer.from(await body.transformToByteArray());
  }

  const chunks = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function loadEvidenceFile(filePath) {
  const s3 = parseS3Uri(filePath);
  if (s3) {
    const { GetObjectCommand } = getS3Sdk();
    try {
      const result = await getS3Client().send(new GetObjectCommand({
        Bucket: s3.bucket,
        Key: s3.key,
      }));

      return {
        kind: 'buffer',
        body: await bodyToBuffer(result.Body),
        contentType: result.ContentType || null,
        contentLength: result.ContentLength || null,
      };
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  const absolutePath = path.isAbsolute(filePath || '')
    ? filePath
    : path.resolve(process.cwd(), filePath || '');

  if (!fs.existsSync(absolutePath)) return null;

  return {
    kind: 'local',
    absolutePath,
  };
}

async function deleteEvidenceFile(filePath) {
  const s3 = parseS3Uri(filePath);
  if (s3) {
    const { DeleteObjectCommand } = getS3Sdk();
    await getS3Client().send(new DeleteObjectCommand({
      Bucket: s3.bucket,
      Key: s3.key,
    }));
    return;
  }

  if (filePath && fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
}

function validateStorageConfig(nodeEnv = process.env.NODE_ENV || 'development') {
  const driver = getStorageDriver();
  const allowedDrivers = ['local', 's3'];

  if (!allowedDrivers.includes(driver)) {
    throw new Error(`STORAGE_DRIVER must be one of: ${allowedDrivers.join(', ')}`);
  }

  if (
    nodeEnv === 'production' &&
    driver !== 's3' &&
    process.env.ALLOW_LOCAL_STORAGE_IN_PRODUCTION !== 'true'
  ) {
    throw new Error(
      'STORAGE_DRIVER must be s3 in production. Set ALLOW_LOCAL_STORAGE_IN_PRODUCTION=true only for private beta/local demos.'
    );
  }

  if (driver !== 's3') return;

  const required = [
    'S3_BUCKET',
    'S3_REGION',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
  ];
  const missing = required.filter((key) => !String(process.env[key] || '').trim());

  if (missing.length > 0) {
    throw new Error(`Missing required S3 storage environment variables: ${missing.join(', ')}`);
  }

  const endpoint = String(process.env.S3_ENDPOINT || '').trim();
  if (
    nodeEnv === 'production' &&
    endpoint &&
    !endpoint.startsWith('https://') &&
    process.env.ALLOW_INSECURE_S3_ENDPOINT !== 'true'
  ) {
    throw new Error('S3_ENDPOINT must use https:// in production.');
  }
}

module.exports = {
  deleteEvidenceFile,
  getStorageDriver,
  loadEvidenceFile,
  parseS3Uri,
  safeFileName,
  storeEvidenceFile,
  validateStorageConfig,
};
