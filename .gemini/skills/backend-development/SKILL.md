---
name: backend-development
description: Express 5 routing, controllers, services, middleware, error handling, and runtime rules.
---

# Backend Development Rules

## Express 5 Specifics
- Express 5 automatically catches and forwards rejected async promises to error middleware. Do NOT use `asyncHandler`.
- `req.query` is read-only in Express 5. Never assign or mutate it.
- `validate` middleware parses input with Zod schemas and saves the result to `req.validated`.

## Error Handling & Response Format
- All errors are formatted by `errorHandler.middleware.js` as `{ error: { code, message, details } }`.
- Throw domain-specific `AppError` subclasses from `common/errors/httpErrors.js`.
- Log unhandled errors via `pino`; client receives generic 500 `{ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }`.

## Redis & BullMQ
- Redis is OPTIONAL. If `REDIS_URL` is empty, skip cache and background scheduler gracefully.
- Cache fails open: if Redis errors during request, fetch data directly from PostgreSQL.
- Only the standalone worker (`src/worker.js`) registers repeatable BullMQ jobs.
- Cache keys use `cache:` prefix; BullMQ queues use `bull:` prefix (`common/constants/redisPrefixes.js`).
