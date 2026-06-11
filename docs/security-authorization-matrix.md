# Security Authorization Matrix

This document tracks the expected authorization model for production review.

## Core middleware

- `requireAuth`: validates JWT from secure cookie or Bearer token and attaches `req.user`.
- `requireRole(...roles)`: allows only listed roles.
- `requirePlatformAdmin`: allows only `PLATFORM_ADMIN`.

## Roles

- `PLATFORM_ADMIN`: platform-wide administration.
- `CUSTOMER_ADMIN`: administration within own company only.
- `USER`: normal authenticated company user.
- `DEMO_USER`: demo access with limited privileges.

## Reviewed routes

| Area | Route family | Expected access | Current finding |
| --- | --- | --- | --- |
| Health | `GET /health` | Public | Public health endpoint is acceptable. |
| Admin seed files | `/admin/seed-files*` | Platform admin only | Uses `requireAuth` and `requirePlatformAdmin`. |
| Companies - own company | `GET /companies/me` | Authenticated company user | Uses authenticated user's `companyId`. |
| Companies - own update | `PATCH /companies/me` | Platform admin or customer admin | Checks role and updates only `user.companyId`. |
| Companies - global list/read/create/update/delete | `/companies`, `/companies/:id` | Platform admin only | Performs platform-admin checks before global company operations. |

## Production audit requirements

For each remaining route family, verify:

1. Authentication is required unless the endpoint is intentionally public.
2. Platform-wide reads/writes require `PLATFORM_ADMIN`.
3. Company-scoped reads/writes filter by `req.user.companyId`.
4. Demo users cannot mutate production data unless explicitly intended.
5. Mutating actions emit audit events.
6. Tests cover cross-tenant access attempts.

## Remaining route families to audit

- Auth and SSO
- Dashboard
- Controls
- Frameworks
- Evidence
- Reports
- Tasks
- Vendors
- Systems
- Business processes
- Dependencies
- Audit findings
- Evidence campaigns
- Approvals
- Demo requests
- Onboarding
