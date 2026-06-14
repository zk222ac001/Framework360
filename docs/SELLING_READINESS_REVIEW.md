# Framework360 Selling Readiness Review

## Current status

Framework360 has a strong foundation for a compliance-management product. It includes a frontend, backend, database layer, Docker deployment assets, production checklist, backup and restore scripts, and documentation for authentication, onboarding, compliance workflow, framework gaps, audit, risk, database design, and developer usage.

This document is a product-readiness guide. It is not a legal certificate, security certification, or guarantee that the product is ready for regulated production data.

## Commercial readiness verdict

Recommended status: Beta or pilot-ready foundation.

Recommended restriction: Do not sell as a fully production-ready enterprise compliance platform until the launch gate below is complete.

## Target customers

Framework360 is best positioned for:

- Small and medium organizations preparing for compliance work.
- IT and security teams tracking frameworks, evidence, gaps, vendors, systems, dependencies, and audit findings.
- Consultants managing structured compliance work for clients.

## Must-have items before paid launch

### Product experience

- Public landing page with problem statement, benefits, screenshots, pricing, and demo request.
- First-login onboarding flow.
- Customer support contact.
- Known limitations and release notes.
- Demo environment for sales calls.

### Core functionality

- Controlled customer/company creation.
- Role-based access control.
- Tenant/customer data separation.
- Framework, requirement, gap, action, evidence, vendor, system, approval, and audit workflows tested end to end.
- Exportable reports for management and audit use.
- Audit history for sensitive operations.

### Security

- Production secrets stored outside the repository.
- Strict production CORS.
- HTTPS for all production traffic.
- Strong session or token secret.
- Secure password hashing.
- Rate limiting on authentication and sensitive endpoints.
- Authorization tests for every customer-scoped route.
- Security headers through backend or reverse proxy.
- File upload validation for evidence attachments if uploads are supported.

### Legal and privacy

- Terms of Service.
- Privacy Policy.
- Data Processing Agreement template for business customers.
- Data retention and deletion policy.
- Cookie policy if cookies or analytics are used.
- License agreement if distributed as self-hosted software.

### Operations

- Staging environment.
- Production database with backups.
- Tested restore procedure.
- Centralized logging.
- Uptime monitoring.
- Incident response process.
- Release and rollback process.

## Missing functionality to prioritize

Priority 1:

- Password reset and account activation flow.
- Tenant isolation tests.
- Billing/subscription or license-key enforcement.
- Executive PDF or CSV report exports.
- Customer onboarding wizard.

Priority 2:

- Notifications for assigned actions and approvals.
- Due-date reminders.
- Evidence expiry reminders.
- Framework import templates.
- API documentation.

Priority 3:

- Marketing website polish.
- Help center articles.
- Demo data reset workflow.
- Advanced analytics for product usage.

## Launch gate

A paid launch should not happen until all of these are true:

- Staging deployment works with production-like configuration.
- Backend tests pass.
- Frontend lint and build pass.
- One complete customer journey is tested from login to report/export.
- Authorization tests prove one customer cannot access another customer's data.
- Backup and restore have been tested.
- Production secrets are stored outside the repository.
- HTTPS and strict CORS are configured.
- Terms, privacy policy, and support process are ready.
- Rollback plan exists.

## Recommended launch path

1. Complete the Priority 1 items.
2. Deploy to staging.
3. Run the launch gate checklist.
4. Invite one to three pilot customers.
5. Collect feedback and fix blockers.
6. Start paid beta with clear limitations.
7. Move to full launch only after monitoring, support, legal, and security controls are stable.
