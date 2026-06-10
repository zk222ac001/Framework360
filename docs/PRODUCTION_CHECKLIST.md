# Production Readiness Checklist

## Security

- Replace development secrets.
- Store secrets in environment variables or a secret manager.
- Enable HTTPS.
- Review npm audit findings.
- Restrict CORS to trusted domains.
- Enable secure cookies in production.

## Database

- Migrate from SQLite to PostgreSQL.
- Configure automated backups.
- Test restore procedures.

## Operations

- Enable centralized logging.
- Add uptime monitoring.
- Add alerting.
- Document incident response procedures.

## Testing

- Run automated tests in CI.
- Add authorization tests.
- Add integration tests.

## Deployment

- Use production Docker Compose or Kubernetes.
- Configure deployment pipeline.
- Configure rollback procedure.
