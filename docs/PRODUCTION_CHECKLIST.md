# Production Readiness Checklist

## Security

- Replace development secrets.
- Store secrets in environment variables or a secret manager.
- Enable HTTPS.
- Review npm audit findings.
- Restrict CORS to trusted domains.
- Enable secure cookies in production.
- Verify that development/demo credentials are disabled in production.
- Verify that platform administrator actions are audit logged.
- Add rate limiting for authentication and other sensitive endpoints.
- Add security headers through the backend or reverse proxy.
- Validate uploaded files before accepting evidence attachments.

## Database

- Migrate from SQLite to PostgreSQL.
- Configure automated backups.
- Test restore procedures.
- Document backup retention.
- Confirm database credentials are not committed to the repository.
- Confirm production migrations are repeatable and reversible where possible.

## Operations

- Enable centralized logging.
- Add uptime monitoring.
- Add alerting.
- Document incident response procedures.
- Define ownership for production support.
- Define release, rollback, and emergency patch procedures.
- Maintain a separate staging environment for every production release.

## Testing

- Run automated tests in CI.
- Add authorization tests.
- Add integration tests.
- Add tenant/customer isolation tests.
- Add smoke tests for deployment validation.
- Run frontend lint and production build before release.
- Run backend tests before release.
- Test one full customer journey end to end.

## Deployment

- Use production Docker Compose or Kubernetes.
- Configure deployment pipeline.
- Configure rollback procedure.
- Confirm production environment variables are configured.
- Confirm frontend and backend URLs match production CORS settings.
- Confirm the health endpoint is monitored.

## Commercial Launch

- Define pricing model.
- Define trial or demo process.
- Add billing/subscription or license-key enforcement before paid launch.
- Prepare support email/contact channel.
- Prepare onboarding guide for first customers.
- Prepare refund/cancellation policy.
- Prepare release notes and known limitations.

## Legal And Privacy

- Add Terms of Service.
- Add Privacy Policy.
- Add Data Processing Agreement template for business customers.
- Define data retention and deletion policy.
- Review cookie and tracking usage.
- Review whether customer evidence may contain confidential or regulated data.

## Customer Data Protection

- Verify tenant/company isolation.
- Add authorization tests for every customer-scoped API.
- Verify platform admin access is audited.
- Verify evidence/document access is restricted to the owning customer.
- Confirm backups are encrypted or stored securely.
- Confirm deleted customer data can be removed according to policy.

## Go-To-Market

- Prepare landing page.
- Add screenshots or demo video.
- Create sales/demo environment.
- Create pilot-customer feedback form.
- Create first-customer onboarding checklist.
- Prepare support and escalation workflow.
