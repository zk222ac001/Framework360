# Framework360 Go-Live Runbook

This runbook explains the practical steps required to take Framework360 from local development to a private beta deployment.

## Current recommended launch stage

Framework360 should first go live as a **private beta**, not a public self-service SaaS.

Private beta means:

- One real hosted environment
- One production database
- A real domain
- A small number of invited users
- Manual monitoring by the founder/team
- No public paid launch until core checks pass

## Recommended beginner-friendly architecture

| Layer | Recommendation |
| --- | --- |
| Frontend | Vercel |
| Backend API | Render, Railway, Fly.io, or DigitalOcean App Platform |
| Database | Managed PostgreSQL |
| DNS | Cloudflare |
| Email | Resend, SendGrid, Mailgun, or SMTP provider |
| File uploads | Local disk for private beta only; S3-compatible storage before public launch |

Recommended first setup:

- `https://framework360.example.com` for the frontend
- `https://api.framework360.example.com` for the backend
- Managed PostgreSQL for production data

## Pre-launch code checks

Run these before deployment.

### Backend

```bash
cd backend
npm install
npm run generate
npm test
```

### Frontend

```bash
cd frontend
npm install
npm run lint
npm run build
```

## Prisma migration requirement

Recent product models were added for commercial readiness, including commercial profiles, policies, trust center, access reviews, and notifications.

Create a migration locally:

```bash
cd backend
npx prisma migrate dev --name commercial_readiness_models
```

Deploy migrations and bootstrap the first platform administrator in production with:

```bash
npx prisma migrate deploy && npm run seed:prod
```

Do not use `prisma db push` as the normal production deployment process.
`seed:prod` reads `PLATFORM_ADMIN_EMAIL` and `PLATFORM_ADMIN_PASSWORD`. It creates the admin user only if missing and does not overwrite existing user passwords.

## Production environment variables

Set these in the backend hosting provider.

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGIN=https://framework360.example.com
APP_BASE_URL=https://framework360.example.com
PLATFORM_ADMIN_EMAIL=admin@example.com
PLATFORM_ADMIN_PASSWORD=replace-with-a-strong-initial-password
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=smtp-user
SMTP_PASS=smtp-password
SMTP_FROM=Framework360 <no-reply@example.com>
```

Generate a strong JWT secret:

```bash
openssl rand -hex 64
```

Never commit real environment files or secrets to GitHub.

## Backend deployment checklist

1. Create a managed PostgreSQL database.
2. Create a backend web service from the GitHub repository.
3. Set the service root to `backend` if the provider supports monorepo roots.
4. Set the build command:

```bash
npm install && npm run generate
```

5. Set the start command:

```bash
npm start
```

6. Add all production environment variables.
7. Run the production migration and bootstrap command:

```bash
npx prisma migrate deploy && npm run seed:prod
```

8. Confirm the health endpoint returns `status: ok`:

```text
https://api.framework360.example.com/health
```

## Frontend deployment checklist

1. Create a Vercel project from the GitHub repository.
2. Set the project root to `frontend`.
3. Set build command:

```bash
npm run build
```

4. Set output directory:

```text
dist
```

5. Configure the frontend API base URL environment variable according to the frontend implementation, for example:

```env
VITE_API_BASE_URL=https://api.framework360.example.com
```

6. Deploy and confirm the frontend can log in and call the backend API.

## DNS checklist

Use Cloudflare or another DNS provider.

| DNS record | Target |
| --- | --- |
| `framework360.example.com` | Vercel frontend |
| `api.framework360.example.com` | Backend hosting provider |

Both domains must use HTTPS.

## Private beta verification checklist

Before inviting users, verify:

- Backend `/health` works.
- Frontend loads over HTTPS.
- Login works.
- Logout works.
- Password reset does not expose reset tokens in production.
- Demo activation does not expose temporary passwords in production.
- CORS only allows the production frontend domain.
- A user can only access their own company data.
- Evidence upload and download work.
- Missing evidence files do not leak server paths.
- Admin account can access platform-admin screens.
- Regular customer user cannot access platform-admin routes.
- Database backups are enabled.
- Application logs are available.
- SMTP/email sending is configured.

## Private beta launch process

1. Deploy backend and frontend.
2. Confirm the seeded production admin account can log in.
3. Create one test company.
4. Run a full smoke test.
5. Invite one trusted pilot user.
6. Monitor logs daily.
7. Collect feedback for two to four weeks.
8. Fix critical bugs.
9. Only then prepare a paid beta.

## Do not publicly launch until these are done

- Automated authorization and tenant-isolation tests
- PostgreSQL production deployment
- Backups enabled and tested
- Legal pages prepared: Terms, Privacy Policy, DPA
- Email delivery working
- Monitoring configured
- Billing or manual paid-access process defined
- Security review completed

## Recommended private beta wording

Use this wording publicly and with early testers:

> Framework360 is currently available as a private beta for selected organizations and consultants working with European compliance, NIS2, GDPR, DORA, AI Act, vendor risk, systems, and operational resilience.

Avoid claiming full certification, legal compliance, or audit approval until verified by qualified professionals.
