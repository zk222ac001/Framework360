# Deployment Guide

## Production Checklist

- Configure .env.production
- Use PostgreSQL in production
- Use strong JWT secrets
- Run prisma migrate deploy
- Enable HTTPS through reverse proxy
- Configure backups
- Monitor health endpoint

## Health Endpoint

GET /health
