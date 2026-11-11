# Security — Sweety Blood Glucose Tracker

---

## 1. CSRF Protection — `originCheck` Middleware

**Rule:** `originCheck` runs on **every** `POST`, `PATCH`, `PUT`, and `DELETE` request.

Logic:

```
if (Origin header is present) AND (Origin !== CLIENT_ORIGIN exactly)
  → respond 403 { error: { code: "FORBIDDEN", message: "Origin not allowed" } }
else
  → call next()   // absent Origin or exact match → allowed
```

- "Exactly" means byte-for-byte equality, including scheme and port (`http://localhost:5173` ≠ `http://localhost`).
- `CLIENT_ORIGIN` is a required environment variable (validated at startup by `config/env.js`).
- `GET` and `HEAD` requests skip `originCheck` (they are safe methods).
- Postman/curl requests (which typically omit `Origin`) are allowed by design; this check targets cross-origin browser requests.

---

## 2. Patient-Only Registration

**Rule:** The `register` route, schema, and service **never** read or accept a `role` field from the request.

- The Zod schema for `POST /api/auth/register` does **not** include a `role` field. Any extra field is stripped by `.strict()` or `.strip()`.
- `auth.service.js` hardcodes `role: 'PATIENT'` when calling `auth.repository.create(...)`.
- Doctor accounts exist **only** via `prisma/seed.js`. There is no API endpoint to create a doctor.

---

## 3. Seed Guard

**Rule:** `prisma/seed.js` refuses to execute in production unless explicitly overridden.

```js
// packages/server/prisma/seed.js (top of file)
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  console.error(
    'Seed refused: NODE_ENV is "production". ' +
    'Set ALLOW_DEMO_SEED=true to override for demos only.'
  );
  process.exit(1);
}
```

This prevents demo data (including the demo patient and known credentials) from being accidentally inserted into a production database.

---

## 4. Secure Cookie Configuration

**Rule:** The `Secure` cookie flag is controlled by the `COOKIE_SECURE` environment variable, **not** by `NODE_ENV`.

```js
// packages/server/src/modules/auth/auth.controller.js
res.cookie('token', jwt, {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',   // ← NOT NODE_ENV
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

- In local development over HTTP: set `COOKIE_SECURE=false`.
- In Docker / production over HTTPS: set `COOKIE_SECURE=true`.
- Do not couple security flags to `NODE_ENV`; a staging environment over HTTPS should also use `COOKIE_SECURE=true`.

---

## 5. Password Hashing

- Library: `bcryptjs` (pure JS, no native bindings needed).
- **Cost factor: 12.**
- Hashing happens exclusively in `auth.service.js`. Repositories store and retrieve `passwordHash` only — they never hash or compare.

```js
// auth.service.js
const passwordHash = await bcrypt.hash(password, 12);
```

---

## 6. JWT

- Signed with `HS256` (symmetric).
- `JWT_SECRET` **must be at least 32 characters**. Startup fails (`config/env.js`) if the secret is shorter.
- Token expires in 7 days (`expiresIn: '7d'`).
- Token is stored exclusively in an `httpOnly` cookie — never in `localStorage` or a JSON response body.
- `userId` is embedded as the JWT `sub` claim. `authenticate` middleware verifies the token and sets `req.user = { id, role }`.

---

## 7. HTTP Security Headers

`helmet` is applied as the first middleware in `app.js`:

```js
app.use(helmet());
```

This sets `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` (in production), and other security headers automatically.

---

## 8. Request Size Limit

JSON body parsing is capped at **10 kb**:

```js
app.use(express.json({ limit: '10kb' }));
```

---

## 9. Structured Logging — Sensitive Field Redaction

`pino` is configured to redact sensitive fields so they never appear in logs:

```js
// lib/logger.js
import pino from 'pino';

export const logger = pino({
  redact: [
    'req.headers.cookie',
    'req.headers.authorization',
    'req.body.password',
    'req.body.passwordHash',
  ],
  // …
});
```

`pino-http` uses this logger instance for HTTP request/response logging.

---

## 10. Rate Limiting

`express-rate-limit` is applied globally:

```js
// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 200,
  skip: () => process.env.NODE_ENV === 'test',   // disabled in test env
});
```

Stricter limits may be applied specifically to `POST /api/auth/login` and `POST /api/auth/register`.

---

## 11. Ownership Enforcement

- Readings endpoints verify that `reading.userId === req.user.id` before allowing `PATCH` or `DELETE`. A `403 FORBIDDEN` is returned (not `404`) to avoid leaking existence.
- Reports endpoints for a `DOCTOR` user verify that a `DoctorPatient` row exists for `(doctorId: req.user.id, patientId: query.patientId)` via `patientAccess.policy.js` before the controller runs.

---

## 12. Input Validation

All inputs are validated with Zod schemas from `@sweety/shared` via the `validate` middleware before reaching a controller. `ZodError`s are caught by the global `errorHandler` and returned as `400 VALIDATION_ERROR` with field-level `details`.

The database-level CHECK constraint (`value BETWEEN 40 AND 600`) serves as a secondary defence in depth.
