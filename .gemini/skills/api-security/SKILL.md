---
name: api-security
description: Mandatory authentication, authorization, CSRF, rate-limiting, and data protection rules.
---

# API Security Rules

## Four Non-Negotiable Security Rules
1. **`userId` always from `req.user`**: Never read `userId` from request body, query string, or path params.
2. **Exact Origin Check (CSRF)**: `originCheck.middleware.js` applies to all `POST`, `PATCH`, `PUT`, `DELETE`. If `Origin` is present and does not exactly match `CLIENT_ORIGIN` (case-sensitive exact string equality, no regex/wildcards), return 403 FORBIDDEN. If `Origin` is absent (non-browser client / Supertest), allow.
3. **Patient-Only Registration**: Public registration `POST /api/auth/register` schema and service never read `role` from input. Service hardcodes `PATIENT`. Doctor accounts are seed-only.
4. **Cookie Security**: JWT stored in `httpOnly`, `SameSite=Lax`, `path=/` cookie. The `Secure` flag follows `COOKIE_SECURE` boolean (NOT `NODE_ENV`).

## Additional Security Standards
- Password hashing: `bcryptjs` with cost 12.
- `JWT_SECRET` must be at least 32 characters; validate at boot in `config/env.js`.
- HTTP security headers: `helmet` applied at root of Express app.
- JSON body payload limit: 10kb.
- Pino logging: always redact `authorization`, `cookie`, and password fields. Never log tokens or secrets.
- Rate limiting: strict limiter on auth endpoints, standard limiter on `/api`; skip in test mode (`NODE_ENV=test`).
