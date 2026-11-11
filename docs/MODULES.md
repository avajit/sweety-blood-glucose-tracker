# Modules — Sweety Blood Glucose Tracker

Each module maps to a development phase with a clear scope boundary. Modules are implemented in order because later ones depend on earlier ones.

---

## Module 0 — Root Setup

### Responsibility
Bootstrap the npm workspaces monorepo: root `package.json` with workspaces, ESLint + Prettier config, `.gitignore`, `.nvmrc` (Node 22), `commitlint` / `husky` pre-commit hook, and shared npm scripts (`dev`, `test`, `lint`).

### File List
```
package.json
.nvmrc
.gitignore
.eslintrc.cjs
.prettierrc
commitlint.config.cjs
.husky/pre-commit
packages/
  shared/package.json
  server/package.json
  client/package.json
```

### Database Interaction
None.

### API Contract
None.

### Dependencies on Other Modules
None — this is the foundation.

### Tests and Acceptance Criteria
- `npm run lint` exits 0 from the repo root.
- `npm run test` can be invoked from root (delegates to workspaces).
- All three packages resolve as workspaces (`npm ls --workspaces`).

---

## Module 1 — Shared

### Responsibility
The `@sweety/shared` package provides Zod 3 validation schemas, TypeScript-free JSDoc types, shared constants, and pure utility functions used by both server and client. No runtime dependencies on Node or browser APIs.

### File List
```
packages/shared/
  package.json
  index.js
  schemas/
    auth.schema.js       # register, login Zod schemas
    reading.schema.js    # create, update, list-query Zod schemas
    report.schema.js     # report query Zod schema
  constants/
    messages.js          # ALL user-facing error/success message strings
    slots.js             # Slot enum values array
    roles.js             # Role enum values array
    limits.js            # PAGE_LIMIT_DEFAULT, PAGE_LIMIT_MAX, VALUE_MIN, VALUE_MAX, etc.
  utils/
    date.js              # formatDate, parseDate, todayInTimezone
```

### Database Interaction
None.

### API Contract
Exports consumed by both `@sweety/server` and `@sweety/client`. No HTTP contract of its own.

### Dependencies on Other Modules
Module 0 (workspace setup).

### Tests and Acceptance Criteria
- Zod schemas accept valid payloads and reject invalid ones (see must-have tests in `TESTING.md`).
- 5 validation rules tested: `value` out of range, future `date`, unknown `slot`, missing required fields, `email` normalisation to lowercase.
- `npm test -w @sweety/shared` passes with Vitest.

---

## Module 2 — Database + Seed

### Responsibility
Define the Prisma schema, generate and apply migrations, and write the idempotent seed script.

### File List
```
packages/server/
  prisma/
    schema.prisma
    seed.js
    migrations/
      20240101000000_init/migration.sql
      20240101000001_reading_value_check/migration.sql
```

### Database Interaction
Defines all tables: `User`, `Reading`, `DoctorPatient`. See `DATABASE.md` for the full schema.

### API Contract
None directly. Provides the data layer for all subsequent modules.

### Dependencies on Other Modules
Module 0.

### Tests and Acceptance Criteria
- `prisma migrate dev` applies cleanly to a fresh PostgreSQL database.
- Inserting a `Reading` with `value = 39` or `value = 601` is rejected by the DB CHECK constraint.
- `prisma db seed` creates demo patient, 60 days of readings (one day with < 4 readings), and a linked doctor.
- Seed is idempotent — running it twice does not throw or duplicate rows.
- Seed refuses to run in `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true`.

---

## Module 3 — Common Backend

### Responsibility
Bootstrap the Express 5 application: app factory, global middleware, error handler, and shared utilities used across all feature modules.

### File List
```
packages/server/src/
  app.js                       # Express app factory (exported for testing)
  server.js                    # Entry point: creates app, starts listen
  worker.js                    # Separate entry point for BullMQ worker
  middleware/
    authenticate.js            # Verifies JWT cookie → sets req.user
    validate.js                # Zod parse → req.validated; passes ZodError to next()
    originCheck.js             # CSRF guard (see SECURITY.md)
    errorHandler.js            # Formats all errors as { error: { code, message, details } }
    rateLimiter.js             # express-rate-limit; no-op in test env
  lib/
    prisma.js                  # Singleton Prisma client
    logger.js                  # pino instance with cookie/authorization/password redaction
    httpLogger.js              # pino-http middleware
    AppError.js                # Custom error class with code + statusCode
  config/
    env.js                     # Validates required env vars on startup
```

### Database Interaction
`lib/prisma.js` exports the shared Prisma client singleton.

### API Contract
Provides `GET /api/health`.

### Dependencies on Other Modules
Modules 0, 1, 2.

### Tests and Acceptance Criteria
- `originCheck` unit tests: absent `Origin` → passes; matching `Origin` → passes; mismatched `Origin` → 403.
- `errorHandler` returns `{ error: { code, message, details } }` for `AppError`, `ZodError`, and generic `Error`.
- App starts without Redis (graceful degradation).
- `GET /api/health` returns `{ status: "ok" }`.

---

## Module 4 — Auth

### Responsibility
User registration (always `PATIENT`), login, logout, and `GET /me` endpoints with JWT cookie management.

### File List
```
packages/server/src/modules/auth/
  auth.routes.js
  auth.controller.js
  auth.service.js
  auth.repository.js
packages/client/src/features/auth/
  api.js                   # useRegister, useLogin, useLogout, useMe hooks
  components/
    LoginForm.jsx
    RegisterForm.jsx
  schemas.js               # re-exports @sweety/shared auth schemas
pages/
  LoginPage.jsx
  RegisterPage.jsx
```

### Database Interaction
- `auth.repository.js`: `findByEmail`, `create` on `User` table.
- Password hashed with `bcryptjs` (cost 12) in service before storing.

### API Contract
`POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` — see `API.md`.

### Dependencies on Other Modules
Modules 0–3.

### Tests and Acceptance Criteria
- Registering with `role: "DOCTOR"` in the body still creates a `PATIENT` account.
- Duplicate email returns `409 CONFLICT`.
- Login with wrong password returns `401`.
- JWT cookie is `httpOnly`, `SameSite=Lax`; `Secure` follows `COOKIE_SECURE`.
- `GET /api/auth/me` without cookie returns `401`.
- Integration tests run against `TEST_DATABASE_URL` sequentially.

---

## Module 5 — Readings (incl. Pagination)

### Responsibility
CRUD for blood glucose readings with ownership enforcement, daily-slot limit (4 per day), duplicate-slot guard, future-date rejection, and paginated listing.

### File List
```
packages/server/src/modules/readings/
  reading.routes.js
  reading.controller.js
  reading.service.js
  reading.repository.js
packages/client/src/features/readings/
  api.js                   # useReadings, useCreateReading, useUpdateReading, useDeleteReading
  components/
    ReadingList.jsx
    ReadingForm.jsx         # React Hook Form + Zod (MSW tested in Module 10)
    ReadingCard.jsx
pages/
  DashboardPage.jsx
```

### Database Interaction
- `reading.repository.js`: `create`, `findById`, `findAllByUser` (with date range + pagination via `skip`/`take`), `update`, `delete`.
- Unique constraint `(userId, readingDate, slot)` enforced at DB level.
- Daily count checked in service before insert.

### API Contract
`GET /api/readings`, `POST /api/readings`, `PATCH /api/readings/:id`, `DELETE /api/readings/:id` — see `API.md`.

### Dependencies on Other Modules
Modules 0–4.

### Tests and Acceptance Criteria
- Posting a 5th reading on the same day returns `409 DAILY_LIMIT` (not duplicate-slot).
- Duplicate slot on a day with < 4 readings returns `409 CONFLICT`.
- Future-date reading returns `422 FUTURE_DATE`.
- `DELETE` by non-owner returns `403`.
- Pagination: `total`, `totalPages`, `page`, `limit` are correct on page 2 of a seeded dataset.
- Empty-state: response with no readings returns `{ data: [], total: 0, totalPages: 0, page: 1, limit: 20 }`.

---

## Module 6 — Reports

### Responsibility
Aggregate reading statistics for three report types: `daily`, `month-to-date`, `monthly`. Compute `highest`, `lowest`, `average`, `count` and return raw readings list.

### File List
```
packages/server/src/modules/reports/
  report.routes.js
  report.controller.js
  report.service.js          # Derives date range from type + reference date
  report.repository.js       # Aggregation queries
packages/client/src/features/reports/
  api.js                     # useReport hook
  components/
    ReportSummary.jsx
    GlucoseChart.jsx          # Recharts LineChart / BarChart
pages/
  ReportsPage.jsx
```

### Database Interaction
`report.repository.js` queries `Reading` with `where: { userId, readingDate: { gte, lte } }` and uses Prisma aggregation (`_max`, `_min`, `_avg`, `_count`).

### API Contract
`GET /api/reports/:type?date=YYYY-MM-DD&patientId=` — see `API.md`.

### Dependencies on Other Modules
Modules 0–5.

### Tests and Acceptance Criteria
- `monthly` for a date in February returns the entire January range.
- `month-to-date` for the 1st of a month returns a single-day range.
- `daily` for a future date returns `422 FUTURE_DATE`.
- Edge case: report with no readings returns `{ count: 0, highest: null, lowest: null, average: null, readings: [] }`.
- Doctor can fetch report for a linked patient; doctor cannot fetch for an unlinked patient (403).

---

## Module 7 — Frontend Foundation

### Responsibility
Set up the React + Vite project: routing (React Router 6), global layout, TanStack Query provider, Axios instance, Tailwind CSS + shadcn/ui base components, and authentication context.

### File List
```
packages/client/
  index.html
  vite.config.js             # dev proxy /api → http://localhost:4000
  tailwind.config.js
  postcss.config.js
  src/
    main.jsx
    App.jsx
    lib/
      axios.js               # withCredentials: true
      queryClient.js
    routes/
      index.jsx              # Route tree
      ProtectedRoute.jsx
    components/
      ui/                    # shadcn/ui components (JS, tsx:false)
      Layout.jsx
      Navbar.jsx
      ErrorBoundary.jsx
    hooks/
      useAuth.js
```

### Database Interaction
None directly. Consumes auth endpoints via `useMe`.

### API Contract
Consumes `GET /api/auth/me` to hydrate auth state on page load.

### Dependencies on Other Modules
Modules 0, 1, 7 is first client module.

### Tests and Acceptance Criteria
- `ProtectedRoute` redirects unauthenticated users to `/login`.
- `Navbar` renders correct links for authenticated vs unauthenticated state.
- Vitest + RTL + jsdom: snapshot test of `Layout`.

---

## Module 8 — Frontend Features + Charts

### Responsibility
Build the full user-facing UI: dashboard with reading list and form, reports page with Recharts visualisations, navigation between views.

### File List
```
packages/client/src/
  features/
    readings/
      api.js
      components/
        ReadingList.jsx
        ReadingForm.jsx
        ReadingCard.jsx
        DeleteConfirmDialog.jsx
    reports/
      api.js
      components/
        ReportSummary.jsx
        GlucoseChart.jsx
        DateTypePicker.jsx
  pages/
    DashboardPage.jsx
    ReportsPage.jsx
```

### Database Interaction
Indirectly via API calls to Modules 5 and 6.

### API Contract
Consumes all `/api/readings` and `/api/reports/:type` endpoints.

### Dependencies on Other Modules
Modules 0–7.

### Tests and Acceptance Criteria
- `GlucoseChart` renders without crashing when passed an empty readings array.
- `ReportSummary` displays em-dashes or "—" when `count === 0`.
- `DashboardPage` shows the empty-state message when the readings list is empty.
- TanStack Query `invalidateQueries` is called after a successful mutation.

---

## Module 9 — Docker

### Responsibility
Containerise the full stack: server, client (nginx-served SPA), and PostgreSQL. Provide a `docker-compose.yml` for one-command local startup.

### File List
```
docker-compose.yml
packages/server/Dockerfile
packages/client/Dockerfile
packages/client/nginx.conf    # Serves SPA + proxies /api to server container
.dockerignore
```

### Database Interaction
Docker Compose provisions a `postgres:16` container with `DATABASE_URL` injected.

### API Contract
nginx proxies `/api` → `http://server:4000`. SPA served from `/`.

### Dependencies on Other Modules
Modules 0–8.

### Tests and Acceptance Criteria
- `docker compose up --build` starts without errors.
- `curl http://localhost/api/health` returns `{"status":"ok"}` from inside the compose network.
- SPA is accessible at `http://localhost`.
- Stopping and restarting retains data (Postgres volume).

---

## Module 10 — Frontend Form Tests

### Responsibility
Write comprehensive Vitest + RTL tests for `ReadingForm` using MSW 2 to mock API responses.

### File List
```
packages/client/src/
  mocks/
    handlers.js              # MSW request handlers
    server.js                # MSW server setup for tests
  features/readings/components/
    ReadingForm.test.jsx
```

### Database Interaction
None — MSW intercepts network calls.

### API Contract
Tests mock `POST /api/readings` and `PATCH /api/readings/:id` responses.

### Dependencies on Other Modules
Modules 0–8.

### Tests and Acceptance Criteria
- Submitting the form with an out-of-range value shows an inline validation error without calling the API.
- Submitting a valid form calls `POST /api/readings` and shows a success message.
- MSW returns a `409 DAILY_LIMIT` error → form displays the correct message from `@sweety/shared/constants/messages.js`.
- Form is accessible: all inputs have associated labels.

---

## Module 11 — Redis Cache

### Responsibility
Add an optional Redis cache layer for report results to reduce database load. Falls back to no-op when `REDIS_URL` is not set.

### File List
```
packages/server/src/
  lib/
    redis.js                 # ioredis client; exports null when REDIS_URL unset
  modules/cache/
    cache.service.js         # get/set/del with TTL; no-op when redis is null
  modules/reports/
    report.service.js        # updated: check cache before DB, invalidate on new reading
```

### Database Interaction
Cache sits in front of `report.repository.js`. Cache keys: `report:{userId}:{type}:{date}`. Invalidated whenever a `Reading` is created, updated, or deleted for that user.

### API Contract
No change to API shape; only response time improves.

### Dependencies on Other Modules
Modules 0–8.

### Tests and Acceptance Criteria
- When `REDIS_URL` is not set, the app starts and report endpoints still return correct data.
- When Redis is available, a second identical report request hits cache (verified with a spy on `report.repository.js`).
- Cache is invalidated after `POST /api/readings`.

---

## Module 12 — BullMQ Reminder

### Responsibility
A separate worker process sends daily reminder notifications (console log / email stub) to patients who have not logged all 4 slots for the current day. Uses BullMQ + Redis.

### File List
```
packages/server/src/
  worker.js                       # Entry point; registers recurring job only here
  modules/reminders/
    reminder.job.js               # BullMQ job definition
    reminder.processor.js         # Job handler; queries DB; logs/sends reminder
    reminder.queue.js             # BullMQ Queue instance
```

### Database Interaction
`reminder.processor.js` queries `User` where `role = PATIENT` and counts today's readings; sends reminder if count < 4.

### API Contract
None — worker runs as a background process.

### Dependencies on Other Modules
Modules 0–3, 11 (Redis required).

### Tests and Acceptance Criteria
- `reminder.processor.js` is unit-tested with a mock Prisma client and mock notifier.
- Patients with 4 readings today are not reminded.
- Patients with < 4 readings today receive a reminder.
- Worker process exits cleanly when Redis is unavailable (logs warning, does not crash).

---

## Module 13 — Doctor Role

### Responsibility
Allow doctors (created via seed only — no UI) to list their linked patients and view patient reports.

### File List
```
packages/server/src/modules/doctors/
  doctor.routes.js
  doctor.controller.js
  doctor.service.js
  doctor.repository.js
  patientAccess.policy.js       # Middleware: verifies DoctorPatient link
packages/client/src/features/doctor/
  api.js                        # usePatients hook
  components/
    PatientList.jsx
    PatientReportView.jsx
pages/
  DoctorDashboardPage.jsx
```

### Database Interaction
`doctor.repository.js`: queries `DoctorPatient` join; `patientAccess.policy.js` calls a repository method to verify the link.

### API Contract
`GET /api/doctor/patients`, `GET /api/reports/:type?patientId=` (extended) — see `API.md`.

### Dependencies on Other Modules
Modules 0–8.

### Tests and Acceptance Criteria
- `GET /api/doctor/patients` with a `PATIENT` role cookie returns `403`.
- Doctor requesting a report for an unlinked patient returns `403`.
- Doctor requesting a report for a linked patient returns `200`.
- Registering via `POST /api/auth/register` always produces a `PATIENT`, never a `DOCTOR`.

---

## Module 14 — CI, README, Screenshots

### Responsibility
GitHub Actions CI pipeline, final README, app screenshots, and optional 2–3 minute demo recording.

### File List
```
.github/
  workflows/
    ci.yml                   # lint → test (unit + integration) → build
README.md
docs/screenshots/
  dashboard.png
  reports.png
  login.png
```

### Database Interaction
CI spins up a PostgreSQL service container for integration tests.

### API Contract
None.

### Dependencies on Other Modules
All previous modules.

### Tests and Acceptance Criteria
- CI workflow passes on `main` and on pull requests.
- Integration tests run sequentially against the CI Postgres service using `TEST_DATABASE_URL`.
- `npm run build -w @sweety/client` succeeds.
- README accurately reflects final setup steps.
- Screenshots show a working, seeded application.
