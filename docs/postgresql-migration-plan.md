# PostgreSQL Migration Plan

## Goal
Move production deployments from SQLite to PostgreSQL.

## Why
- Better concurrency
- Backups and recovery
- Managed database support
- Production-grade reliability

## Recommended process
1. Create PostgreSQL staging database.
2. Deploy application using PostgreSQL datasource.
3. Run `prisma migrate deploy`.
4. Seed staging data.
5. Execute integration tests.
6. Verify tenant isolation and audit logging.
7. Perform production cutover.

## Rollback
- Keep SQLite backup.
- Keep database snapshot before cutover.
- Roll back application deployment if validation fails.

## Notes
Current schema appears broadly compatible with PostgreSQL, but migration validation must occur in staging before changing the primary Prisma datasource.
