# Deployment Guide

This guide describes how to run Framework360 in a production-style environment and what must be verified before using the system with real organizational data.

## Current Production-Readiness Status

The repository includes a production-readiness foundation:

- Production backend Dockerfile
- Production frontend Dockerfile
- Nginx static frontend serving
- Hardened `docker-compose.prod.yml`
- `.env.production.example` template
- Backend production environment validation
- Startup validation
- Health endpoint with database connectivity check
- Structured request logging
- Audit-log reporting API

The application should still be validated in a staging environment before real production use.

## Required Environment Variables

Create a `.env.production` file in the repository root:

```bash
cp .env.production.example .env.production
```

Required production variables:

```text
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/framework360
JWT_SECRET=replace_with_long_random_secret
CORS_ORIGIN=https://your-domain.example
APP_BASE_URL=https://your-domain.example
VITE_API_BASE_URL=https://api.your-domain.example
PLATFORM_ADMIN_EMAIL=admin@example.com
PLATFORM_ADMIN_PASSWORD=replace_with_strong_password
STORAGE_DRIVER=s3
S3_BUCKET=framework360-evidence
S3_REGION=auto
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=replace_me
S3_SECRET_ACCESS_KEY=replace_me
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_replace_me
MAIL_FROM=Framework360 <no-reply@your-domain.example>
```

Production rules:

- `JWT_SECRET` must be long, random, and private.
- `CORS_ORIGIN` must point to the real frontend domain, not localhost.
- `VITE_API_BASE_URL` is baked into the frontend image at build time.
- `STORAGE_DRIVER=s3` is required for production evidence uploads unless `ALLOW_LOCAL_STORAGE_IN_PRODUCTION=true` is set for a private beta/demo.
- `MAIL_FROM` must use a verified sending domain when using Resend or another email provider.
- Do not commit `.env.production`.
- Do not use demo credentials in production.

## Local Production-Style Run

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up --build
```

Default local endpoints:

```text
Frontend: http://localhost
Backend API: http://localhost:3000
Health: http://localhost:3000/health
```

## Database

Framework360 uses PostgreSQL through Prisma. Production deployment should use:

```text
DATABASE_URL=postgresql://...
```

Before switching to PostgreSQL, validate Prisma migrations in staging.

## Evidence File Storage

Production evidence uploads should use S3-compatible object storage, not local server disk.
Supported providers include Cloudflare R2, AWS S3, Supabase Storage S3 compatibility, and other managed S3-compatible storage.

Configure:

```text
STORAGE_DRIVER=s3
S3_BUCKET=...
S3_REGION=...
S3_ENDPOINT=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=true
S3_KEY_PREFIX=evidence
```

For Cloudflare R2, use `S3_REGION=auto`, the R2 S3 endpoint, and `S3_FORCE_PATH_STYLE=true`.
Local disk storage is acceptable only for local development or an explicitly controlled private beta.

## Database Migration And Bootstrap Command

The production backend command runs:

```bash
npx prisma migrate deploy && npm run seed:prod
```

This applies existing Prisma migrations without using destructive development synchronization.
The production seed creates the initial platform administrator from `PLATFORM_ADMIN_EMAIL` and `PLATFORM_ADMIN_PASSWORD` when that user does not already exist. Existing user passwords are not overwritten.

Do not use `prisma db push` as the production migration strategy.

## Reverse Proxy and TLS

Production deployments should place the application behind a reverse proxy or platform ingress that provides:

- HTTPS/TLS termination
- HTTP-to-HTTPS redirect
- Request size limits
- Access logging
- Optional Web Application Firewall rules

## Health Check

The backend exposes:

```text
GET /health
```

The health response includes:

- Application status
- Timestamp
- Uptime
- Environment
- Request ID
- Database connectivity status

A healthy response should return HTTP 200. A database failure should return HTTP 503.

## Deployment Checklist

Before production release:

- Configure `.env.production` with real secrets.
- Use PostgreSQL.
- Configure S3-compatible evidence storage.
- Configure transactional email with a verified sender domain.
- Run `npm test` for backend.
- Run frontend lint and build.
- Run production Docker Compose build.
- Confirm `/health` returns HTTP 200.
- Confirm login, logout, evidence upload, evidence download, company administration, and audit-log access.
- Configure backup and restore.
- Configure monitoring and alerting.
- Configure HTTPS.
- Confirm CORS only allows the production frontend origin.
- Review admin accounts and remove demo data.

## Rollback Plan

A production deployment should always have a rollback plan:

1. Keep the previous container image available.
2. Keep database backups before migration.
3. Test restore procedure in staging.
4. Roll back application first if code fails.
5. Restore database only when required and after confirming data impact.

## Post-Deployment Verification

After deployment:

```bash
curl https://your-domain.example/health
```

Then verify:

- Platform admin can log in.
- Customer admin cannot access another company's data.
- Evidence uploads and downloads work.
- Uploaded evidence remains available after backend redeploy/restart.
- Audit logs are created for sensitive actions.
- Structured logs are visible in the hosting platform.
- Alerts are active.
