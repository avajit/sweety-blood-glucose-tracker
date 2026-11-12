# Implementation Plan — Sweety Blood Glucose Tracker

Time-boxed execution checklist for the Sweety blood-glucose tracker assignment (deadline: Friday 13 Nov 2026).

> **Strategy:**
> - **Tier 1 = required**, merged and tested by Thursday night.
> - **Tiers 2–4 = bonus**; drop anything unmerged and untested at Friday 2 PM and list it under README Notes.

---

## Tier 1 — Core MVP (Required by Thursday Night)

All Tier 1 modules must be complete, tested against PostgreSQL, and merged before moving to bonus tiers.

- [x] **[Module 0: Root Setup & Scaffolding](MODULES.md#module-0--root-setup--tooling)** (30m)
  - Monorepo workspaces (`@sweety/client`, `@sweety/server`, `@sweety/shared`), ESLint flat config, Prettier, Husky hooks, Commitlint, CI workflow.
- [x] **[Module 1: Shared Package](MODULES.md#module-1--shared-package-sweetyshared)** (1h)
  - Zod schemas (`auth`, `reading`, `report`, `pagination`), constants (`slots`, `limits`, `messages`, `roles`), pure `date.js` utils with timezone support, unit tests.
- [x] **[Module 2: Database Schema & Seed](MODULES.md#module-2--database-schema--seed)** (1h)
  - Prisma 6 schema (`User`, `Reading`, `DoctorPatient`, `Slot` enum), unique constraints, check constraints, production-guarded idempotent seed with 60-day patient demo data.
- [x] **[Module 3: Common Backend Infrastructure](MODULES.md#module-3--common-backend-infrastructure)** (1h)
  - Express 5 setup, config/env validation (Intl timezone check), `AppError`, `prismaErrorMapper`, middlewares (`validate`, `errorHandler`, `originCheck`, `rateLimit`, `requestId`), Prisma singleton, test database harness.
- [x] **[Module 4: Authentication & Users](MODULES.md#module-4--authentication--users)** (1.5h)
  - JWT in httpOnly cookie (`SameSite=Lax`, `COOKIE_SECURE`), bcrypt hashing (cost 12), register (always `PATIENT`), login, logout, me endpoint, integration tests.
- [x] **[Module 5: Glucose Readings CRUD & Concurrency](MODULES.md#module-5--readings-crud--pagination)** (2h)
  - Add reading (max 4/day check, duplicate-slot check inside `$transaction`, race-condition fallback), edit reading, delete reading (204), paginated list (`from`, `to` filter), ownership enforcement, concurrency tests.
- [x] **[Module 6: Glucose Reports & Analytics](MODULES.md#module-6--reports--analytics)** (2h)
  - Reports endpoint (`daily`, `month-to-date`, `monthly`), SQL aggregations (`MIN`, `MAX`, `AVG`, `COUNT`), timezone-aware pure ranges (`report.ranges.js`), single-point decimal rounding, empty state handling.
- [x] **[Module 7: Frontend Foundation](MODULES.md#module-7--frontend-foundation)** (1.5h)
  - Vite + React 18, Tailwind CSS, shadcn/ui JS setup, React Router 6, TanStack Query 5 provider, Axios client with credentials, AuthContext + ProtectedRoute, layout components (`AppShell`, `Navbar`).
- [x] **[Module 8: Frontend Features & Visualization](MODULES.md#module-8--frontend-features--charts)** (3h)
  - Auth pages (Login, Register), Readings log with pagination and filter, Reading entry form with slot dropdown and date picker, Reports dashboard with Recharts visualization, empty states.

--- *Tier 1 ends — Core MVP complete* ---

---

## Tier 2 — Production Packaging & Form Testing (Bonus)

- [x] **[Module 9: Docker & Production Setup](MODULES.md#module-9--docker-containerization)** (1h)
  - Multi-stage Dockerfiles for client (nginx reverse proxy) and server/worker, `docker-compose.yml` orchestrating PostgreSQL, Redis, backend, worker, frontend.
- [x] **[Module 10: Frontend Form Tests (MSW)](MODULES.md#module-10--frontend-form-tests-with-msw)** (1.5h)
  - Vitest + Testing Library + MSW integration tests for `ReadingForm` (empty, 39 mg/dl, 601 mg/dl, future date, duplicate slot error) and `LoginForm`.

---

## Tier 3 — Performance & Background Automation (Bonus)

- [x] **[Module 11: Redis Caching Layer](MODULES.md#module-11--redis-cache-for-reports)** (1.5h)
  - Optional Redis cache for reports (`cache:` prefix), cache invalidation on reading mutations, fail-open behavior if Redis is offline.
- [x] **[Module 12: BullMQ Daily Reminder Worker](MODULES.md#module-12--bullmq-daily-reminder-worker)** (1.5h)
  - Background worker process (`src/worker.js`), BullMQ repeatable job (`bull:` prefix), queries patients with <4 readings today, idempotent notification logging.

---

## Tier 4 — Multi-Role & Final Delivery (Bonus)

- [x] **[Module 13: Doctor Role & Patient Linking](MODULES.md#module-13--doctor-role--patient-access)** (3h, drop first if running late)
  - `patientAccess.policy.js` enforcement, doctor patient list endpoint, doctor viewing patient reports via `?patientId=`, seeded doctor account.
- [x] **[Module 14: Final Delivery, CI, Demo](MODULES.md#module-14--ci-readme-screenshots--submission)** (1h)
  - Green CI pipeline, completed README with screenshots, 2–3 min walkthrough video recording, final code review against standards.
