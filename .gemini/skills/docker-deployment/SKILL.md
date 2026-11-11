---
name: docker-deployment
description: Multi-stage Docker builds, Compose orchestration, nginx reverse-proxy, and production runtime.
---

# Docker & Deployment Rules

## Architecture in Production
- Reverse proxy: `nginx` container serves compiled SPA static assets and proxies `/api` requests to Express backend.
- Same-origin advantage: Nginx proxying `/api` keeps cookie same-origin, eliminating browser CORS/third-party cookie issues.
- Build context: Root of the repository so packages can reference workspace dependencies cleanly.

## Services in Docker Compose
- `postgres`: PostgreSQL 16 with initialization script mounting `docker/postgres/init/01-create-test-db.sql`.
- `redis`: Redis alpine container for caching and BullMQ (optional).
- `server`: Express API container running `npm run start --workspace=server`. Includes Prisma CLI for `prisma migrate deploy`.
- `worker`: Reuses backend image with override command `npm run start:worker --workspace=server`.
- `client`: Nginx container serving Vite production build and forwarding `/api`.

## Production Seeding
- Compose sets `ALLOW_DEMO_SEED=true` ONLY when running demo environment containers.
- Standard production environments default to `ALLOW_DEMO_SEED=false` to prevent accidental seed execution.
