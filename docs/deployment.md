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
```

Production rules:

- `JWT_SECRET` must be long, random, and private.
- `CORS_ORIGIN` must point to the real frontend domain, not localhost.
- `VITE_API_BASE_URL` is baked into the frontend image at build time.
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

## Database Migration Command

The production backend command runs:

```bash
npx prisma migrate deploy
```

This applies existing Prisma migrations without using destructive development synchronization.

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
- Audit logs are created for sensitive actions.
- Structured logs are visible in the hosting platform.
- Alerts are active.
