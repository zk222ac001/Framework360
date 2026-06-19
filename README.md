# Framework360

## Overview

Framework360 is a compliance management platform for organizations that need a central overview of frameworks, requirements, gaps, action plans, evidence, vendors, systems, business processes, dependencies, approvals, and audit findings.

The project started as a proof-of-concept/MVP exam project and has since been updated with a production-readiness foundation. It is still important to validate the application in a real staging/production environment before using it for sensitive production data.

## Technology Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- ORM: Prisma
- Database: PostgreSQL
- Container runtime: Docker Compose

## Repository Structure

```text
backend/      Express API, Prisma schema, routes, middleware, tests
frontend/     React frontend application
docker/       Development and production Dockerfiles / web server config
docs/         Deployment, security, and production-readiness documentation
```

## Requirements

For Docker-based usage:

- Docker
- Docker Compose

For local non-Docker development:

- Node.js compatible with the backend and frontend package configuration
- npm

## Development Quick Start

Start the development environment:

```bash
docker compose up --build
```

The development application is available at:

```text
Frontend: http://localhost:25173
Backend API: http://localhost:23000
```

The development backend runs Prisma database synchronization with `prisma db push` when the container starts.

## Creating Demo/Test Data

After the containers have started, open a new terminal and run:

```bash
docker compose exec backend npm run seed:dev
```

To completely reset the development database and recreate all demo data:

```bash
docker compose exec backend npm run db:reset:dev
```

Warning: this deletes all existing data in the development database.

## Development Test Accounts

The following accounts are created by the development seed. `seed:dev` runs the base seed first, then adds the local demo users.

### Base Platform Administrator

```text
Email: admin@framework360.dk
Password: Zk1!Ln2@Zl3#Xq4$
Role: PLATFORM_ADMIN
```

### Development Platform Administrator

```text
Email: dev.admin@eucompliance.test
Password: DevAdmin123
Role: PLATFORM_ADMIN
```

### Customer Administrator

```text
Email: simon@test.dk
Password: Test1234
Role: CUSTOMER_ADMIN
Company: CyberPartners
CVR: 12345678
Sector: IT
Country: DK
```

### Demo User

```text
Email: demo@test.dk
Password: Test1234
Role: CUSTOMER_ADMIN
Company: Demo Company
CVR: 87654321
Sector: IT
Country: DK
```

These credentials are for local development only. Do not use demo credentials in production.

## Production-Style Local Run

Create a production environment file from the template:

```bash
cp .env.production.example .env.production
```

Update `.env.production` with strong values, especially:

```text
JWT_SECRET
CORS_ORIGIN
DATABASE_URL
VITE_API_BASE_URL
PLATFORM_ADMIN_EMAIL
PLATFORM_ADMIN_PASSWORD
```

Start the production-style Compose setup:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up --build
```

The production backend applies Prisma migrations and runs `seed:prod` before starting. The production seed creates the first platform administrator from `PLATFORM_ADMIN_EMAIL` and `PLATFORM_ADMIN_PASSWORD` if that user does not already exist. Existing user passwords are not overwritten.

The production-style frontend is served on:

```text
http://localhost
```

The backend health endpoint is available at:

```text
http://localhost:3000/health
```

## Health and Observability

The backend exposes:

```text
GET /health
```

The health response includes application status, timestamp, uptime, environment, request ID, and database connectivity status.

The backend also includes structured JSON logging and request correlation through the `X-Request-Id` header.

## Audit Logging

Framework360 includes persistent audit logging for important security and administrative events. Platform administrators can access the audit-log API through:

```text
GET /audit-logs
GET /audit-logs/:id
```

Audit logging is intended to support accountability for authentication, company administration, evidence handling, and other sensitive actions.

## Prisma Studio

For local development database inspection:

```bash
docker compose exec backend npx prisma studio --hostname 0.0.0.0
```

Then open:

```text
http://localhost:5555
```

Prisma Studio should not be exposed in production.

## Validation Commands

Backend:

```bash
cd backend
npm install
npm run generate
npm test
```

Frontend:

```bash
cd frontend
npm install
npm run lint
npm run build
```

Docker production-style validation:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up --build
```

## Production Readiness Notes

The repository now includes a production-readiness foundation:

- Production backend Dockerfile
- Production frontend Dockerfile
- Nginx frontend static hosting config
- Hardened production Compose file
- Production environment validation
- Deployment documentation
- Authorization matrix documentation
- Audit-log reporting API
- Structured JSON logging
- Request ID middleware
- Health endpoint with database check
- Safer evidence-upload filenames

Before real production use, still complete and verify:

- PostgreSQL migration and staging validation
- Database backup and restore procedure
- HTTPS/TLS termination
- Secret management
- CI/CD deployment workflow
- Monitoring and alerting
- Security review of all route families
- Load testing and incident response plan

## Troubleshooting Docker

If Docker becomes stuck or stale containers cause issues:

```bash
docker compose down -v
docker compose build --no-cache
docker compose up
```

For production-style containers:

```bash
docker compose -f docker-compose.prod.yml down -v
docker compose --env-file .env.production -f docker-compose.prod.yml up --build
```
