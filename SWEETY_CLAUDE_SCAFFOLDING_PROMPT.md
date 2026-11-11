You are a senior engineer scaffolding a new repository. Another AI (Gemini CLI) will
write ALL feature code later. Your job is ONLY: root configuration, documentation,
folder structure with placeholder files, and AI context files (GEMINI.md, skills).
Do NOT implement feature logic. Do NOT install dependencies (no node_modules). Do NOT
generate Prisma migrations.

=== EXECUTION RULES ===
- Work in the 5 phases below. After each phase run its VERIFY steps. If they pass, make
  ONE Conventional-Commit commit for that phase, print a short report (files created,
  checks run and results, open issues), then continue to the next phase. If a check
  fails, fix it; if you cannot, STOP and report. Never commit a broken state.
- Decisions written in this prompt are FINAL. Do not redesign anything. If two
  instructions contradict each other or something is truly ambiguous, stop and ask once
  instead of guessing silently.
- Before creating anything run `git status` and `ls`. Never overwrite an existing file
  without reading it first. If `git config user.name` or `user.email` is unset, stop and
  ask the user.
- Never claim a check passed unless you actually ran it. Lint and tests cannot run in
  this scaffold (nothing is installed); say so rather than implying they passed.
- The only allowed "install-like" command: after all package.json files exist, run
  `npm install --package-lock-only` (writes package-lock.json, creates no node_modules).
  If it fails, report it and document that CI cannot pass until the lockfile exists.

=== PROJECT ===
Sweety: a blood-glucose tracker for the Kenpath "Junior Full Stack Developer -
JavaScript & AI" assignment, deadline Friday 13 Nov 2026. A diabetes patient records up
to 4 readings/day (mg/dl) and views daily, month-to-date and previous-month reports.
Reviewers value: working features, clean readable code, correct validation, a few
meaningful tests, regular commits, and a README with Notes (assumptions + improvements).

=== HARD RULES ===
- JavaScript only. Backend and shared use .js (ES modules, "type":"module" in EVERY
  package.json). React files containing JSX use .jsx. NO TypeScript anywhere: no .ts,
  .tsx, tsconfig, or type-declaration files. Use jsconfig.json.
- Relative imports in Node code MUST include the .js extension.
- npm workspaces monorepo: client, server, shared, named @sweety/client, @sweety/server,
  @sweety/shared. Depend on shared with "@sweety/shared": "*" (NOT the pnpm-only
  "workspace:*"). shared has NO build step; it exports plain ESM source via
  "exports": "./src/index.js". Root package.json sets "engines": {"node": ">=22.9"}.
- Stack: Node 22 LTS, Express 5, PostgreSQL, Prisma 6.x (pin 6.x, NOT 7), Zod, bcryptjs,
  jsonwebtoken (JWT in httpOnly cookie), helmet, cors, cookie-parser, express-rate-limit,
  pino + pino-http, Vitest + Supertest, ioredis, bullmq. Client: React + Vite, React
  Router, TanStack Query, Axios, React Hook Form + @hookform/resolvers, Tailwind CSS,
  shadcn/ui (JS output, "tsx": false), Recharts, date-fns, Vitest + React Testing Library
  + user-event + jest-dom + jsdom + MSW.
- Versions: stable releases with caret ranges, but do NOT blindly take "latest". Use
  `npm view <pkg> version peerDependencies` to confirm compatibility between: Node 22,
  React, @testing-library/react, Vite and @vitejs/plugin-react, Tailwind and shadcn,
  Zod and @hookform/resolvers (choose ONE Zod major the resolver supports, used in shared,
  server and client), Express 5, and Recharts with the chosen React. Record every chosen
  major in docs/ARCHITECTURE.md ("Versions"). If the network is unavailable, say so and
  use conservative known-compatible versions.

=== PHASE 1: GIT AND ROOT WORKSPACE ===
git init on branch main. Create: .gitignore (node_modules, .env, dist, coverage, *.log,
.DS_Store), .nvmrc (22), .editorconfig, .prettierrc, .prettierignore,
.lintstagedrc.json, commitlint.config.cjs, eslint.config.js, package.json,
.husky/pre-commit (npx lint-staged), .husky/commit-msg (npx --no -- commitlint --edit
"$1"), docker/postgres/init/01-create-test-db.sql (CREATE DATABASE sweety_test;),
docker-compose.yml (comment only; module 9 fills it), .env.example,
.github/workflows/ci.yml, and the three workspace package.json files (client, server,
shared) with scripts and dependencies per the stack. No pull_request_template.

- Root package.json: private, "type":"module", workspaces, engines, scripts: dev:server,
  dev:client, dev:worker, test, lint, format, db:migrate, db:seed, db:studio, and
  "prepare": "husky || true" (so Docker installs without dev dependencies do not fail).
  devDependencies: eslint, @eslint/js, eslint-plugin-import, globals, prettier, husky,
  lint-staged, @commitlint/cli, @commitlint/config-conventional, dotenv-cli.
- Prisma scripts load the ROOT .env through dotenv-cli, e.g. in server/:
  `dotenv -e ../.env -- prisma migrate dev`. Server runtime scripts use
  `node --env-file-if-exists=../.env` (Docker has no .env file and must not crash).
- server/package.json also contains: "prisma": { "seed": "node prisma/seed.js" }.
- eslint.config.js (flat config): no-undef, no-unused-vars, import/no-unresolved,
  import/extensions (require .js in relative imports), and no-restricted-imports
  enforcing:
    * controllers cannot import repositories; repositories cannot import services;
    * `@prisma/client` may be imported ONLY by: *.repository.js, prisma/seed.js,
      src/lib/prisma.js, src/common/errors/prismaErrorMapper.js, and files under
      server/tests/;
    * `ioredis` may be imported ONLY by src/lib/redis.js (report.cache.js and the BullMQ
      files receive the connection from lib/redis.js, they never import ioredis);
    * client code may import another feature only through that feature's index.js.
- Every vitest.config.js sets passWithNoTests: true and does NOT reference globalSetup yet
  (Gemini wires it in module 3). The server vitest.config.js also sets
  fileParallelism: false (integration test files share one database). Client vitest uses
  environment jsdom with setupFiles ./src/test/setup.js.
- ci.yml (real content): Postgres service (POSTGRES_DB=sweety_test), actions/setup-node
  with node-version-file .nvmrc, `npm ci`, lint, test, env DATABASE_URL and
  TEST_DATABASE_URL pointing at the service. Add a commented-out
  `prisma migrate deploy` step marked "enable in module 2".
- .env.example (no real secrets), one comment line above each variable, listing exactly:
  NODE_ENV, PORT, LOG_LEVEL, APP_TIMEZONE (IANA name, default Asia/Kolkata),
  DATABASE_URL, TEST_DATABASE_URL, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB,
  JWT_SECRET (min 32 chars), JWT_EXPIRES_IN, COOKIE_SECURE (true only when served over
  HTTPS), CLIENT_ORIGIN (exact origin the browser uses, e.g. http://localhost:5173 in dev),
  ALLOW_DEMO_SEED (set true only for demo/Docker seeding; the seed refuses to run in
  production otherwise), REDIS_URL (optional; empty disables cache and reminders),
  REMINDER_CRON, VITE_API_URL, VITE_APP_TIMEZONE (must match APP_TIMEZONE).
Then run `npm install --package-lock-only`.
VERIFY: every JSON file parses; package-lock.json exists (or the failure is reported);
no node_modules directory; no .env file; the string "workspace:" appears in no
package.json. Commit: "chore: initialize npm workspace and tooling".

=== PHASE 2: DOCUMENTATION (docs/ and README.md) ===
Write REAL, concise, complete content: ARCHITECTURE.md (include "Versions"), DATABASE.md,
API.md, MODULES.md, CODING_STANDARDS.md, SECURITY.md, TESTING.md, IMPLEMENTATION_PLAN.md.
No DECISIONS.md, no PR template. Also write README.md with these headings: Overview, Tech
stack, Prerequisites, Installation, Database setup, Running (server, client, worker),
Running tests, Seed data, Docker, API summary, Screenshots, Troubleshooting, Notes
(Assumptions / What I would improve with more time). Bodies are TODO except:
 - Troubleshooting: "Works in Postman but login fails in the browser with 403? Check that
   CLIENT_ORIGIN exactly equals the browser's origin (http://localhost:5173 in dev; the
   nginx URL in Docker)."
 - Notes > Assumptions, prefilled with: (1) dates are plain YYYY-MM-DD and "today" is
   computed in APP_TIMEZONE (default Asia/Kolkata); (2) "Monthly" means the whole month
   before the selected date's month; (3) when a day already has 4 readings the daily-limit
   message takes priority over the duplicate-slot message; (4) a report for a future
   selected date is rejected with the future-date message; (5) doctor accounts and
   patient links come from the seed script only, there is no UI; (6) the API is mounted
   under /api; (7) demo credentials are for development and demos only.

IMPLEMENTATION_PLAN.md: checkbox list with time-boxes. "Tier 1 = required, merged and
tested by Thursday night. Tiers 2-4 = bonus; drop anything unmerged and untested at
Friday 2 PM and list it under README Notes."
 0 Root setup (30m) | 1 Shared (1h) | 2 Database+seed (1h) | 3 Common backend (1h) |
 4 Auth (1.5h) | 5 Readings incl. pagination (2h) | 6 Reports (2h) |
 7 Frontend foundation (1.5h) | 8 Frontend features + charts (3h)
 --- Tier 1 ends ---
 9 Docker (1h) | 10 Frontend form tests (1.5h) | 11 Redis cache (1.5h) |
 12 BullMQ reminder (1.5h) | 13 Doctor role (3h, drop first if late) |
 14 CI, README, screenshots, 2-3 min recording.
Each box links to its section in MODULES.md.

MODULES.md: one section per module 0-14. EVERY section has these six items:
Responsibility; File list; Database interaction; API contract; Dependencies on other
modules; Tests and acceptance criteria ("done" = tests pass and the feature works against
real PostgreSQL).

DECISIONS TO ENCODE (write them into the matching docs):

Architecture
- Backend flow: routes -> validate(shared Zod schema) -> controller -> service ->
  repository -> Prisma. Controllers do HTTP only. Services hold business rules and
  transactions and never touch req/res; they receive the Prisma client through their
  constructor and never import @prisma/client. Repositories are the only query layer and
  accept either the client or a transaction client.
- Express 5 forwards async errors (no asyncHandler). The validate middleware stores parsed
  input on req.validated (Express 5 req.query is read-only; never assign to it). One
  errorHandler formats all errors as { error: { code, message, details } }. Unknown errors
  are logged; the client gets a generic 500.
- userId ALWAYS comes from the authenticated user (req.user), never from body, query or
  params. requireAuth verifies the JWT and loads the user by id, so deleted users and role
  changes are honored.
- Request validation = shared Zod schemas. Response shaping = each module's mapper. There
  are NO server *.dto.js files and NO auth.mapper.js.
- Redis is OPTIONAL. Empty REDIS_URL = caching skipped and reminder job not started. If
  Redis fails at runtime the cache fails open (compute from DB). Cache keys and BullMQ use
  separate prefixes (cache: and bull:) defined in common/constants/redisPrefixes.js.
- Only the worker process registers the recurring reminder job, with a fixed scheduler ID
  so restarts never duplicate it.
- Doctor access: patientAccess.policy.js lives in modules/doctors (exported through its
  index.js). reports imports it; doctors never imports reports. A doctor views a patient's
  report through the reports route with ?patientId=; the policy allows the owner, or a
  doctor linked to that patient, and otherwise returns 403.
- Dev: Vite proxy forwards /api to the server (the browser's Origin header is preserved).
  Docker: nginx proxies /api so cookies are same-origin and CORS is not needed. Compose
  build context = repo root; the worker reuses the server image with another command; the
  image includes the Prisma CLI so `migrate deploy` and the seed can run inside it.

Database (Prisma 6)
- User(id uuid, name, email unique lowercase, passwordHash, role PATIENT|DOCTOR default
  PATIENT, createdAt)
- Reading(id uuid, userId, readingDate @db.Date, slot enum, value Int, createdAt,
  updatedAt), UNIQUE(userId, readingDate, slot), index(userId, readingDate), cascade.
- Slot enum: MORNING_FASTING, AFTER_BREAKFAST, AFTER_LUNCH, AFTER_DINNER.
- DoctorPatient(doctorId, patientId) composite PK, both cascade.
- A second migration adds CHECK ("value" BETWEEN 40 AND 600).
- Dates are plain YYYY-MM-DD strings end to end; convert to a UTC-midnight Date only at
  the repository edge.

Validation (messages live ONLY in shared/constants/messages.js)
- "Please enter a glucose value." (an empty form value "" or NaN must become undefined so
  this message shows)
- "Value must be between 40 and 600 mg/dl." (whole number)
- "You already have an After lunch reading for this date." (uses the slot label)
- "You can add only 4 readings per day."
- "Date cannot be in the future."
- Service check order: day capacity (4) FIRST, then duplicate slot, both inside one
  prisma.$transaction (default isolation; do NOT use Serializable and do NOT add retry
  loops). The 4-per-day limit is guaranteed by the database: 4 enum slots plus
  UNIQUE(userId, readingDate, slot) make a fifth row impossible even under concurrency.
  The service checks exist only to give friendly messages. When a race raises a unique
  violation (detected with isUniqueViolation(err) exported by prismaErrorMapper.js),
  re-count that day OUTSIDE the failed transaction: count >= 4 returns the daily-limit
  message, otherwise the duplicate-slot message with the slot label.
- PATCH applies the same rules: moving a reading to another day checks that day's
  capacity; changing slot or date checks for a duplicate (excluding the reading itself);
  a future date is rejected.
- Timezone: NOT hardcoded. The server reads APP_TIMEZONE (default Asia/Kolkata) from
  config/env.js and validates it with Intl; the client reads VITE_APP_TIMEZONE.
  shared/utils/date.js is the ONE date implementation and takes the timezone as a
  parameter (shared never reads process.env). shared/constants/limits.js may hold
  DEFAULT_APP_TIMEZONE as a fallback only. The server is authoritative; the client check
  is a convenience.

API (every route under /api; error shape above)
- GET /api/health
- POST /api/auth/register {name,email,password(min 8)}; POST /api/auth/login;
  POST /api/auth/logout; GET /api/auth/me. Emails trimmed and lowercased. Login failure is
  always "Invalid email or password". Public registration ALWAYS creates role PATIENT: the
  register schema and service never read role or userId from the request; the service sets
  PATIENT itself.
- GET /api/readings?page=1&limit=20&from=&to= -> { data, page, limit, total, totalPages }
  (limit default 20, max 100); POST /api/readings {date,slot,value};
  PATCH /api/readings/:id; DELETE /api/readings/:id (204).
- GET /api/reports/:type?date=YYYY-MM-DD&patientId= where type is daily | month-to-date |
  monthly; date defaults to today in APP_TIMEZONE. Response: { type, range:{from,to},
  count, highest, lowest, average, readings }. average is rounded to 1 decimal in ONE place
  (report.mapper.js); readings is included for daily only; an empty range returns count 0
  with null stats (the UI shows a friendly empty state). A future selected date is
  rejected with the future-date message.
- Ranges (pure function getRanges(selectedDate) in report.ranges.js): daily = that date;
  month-to-date = 1st of that month through the date; monthly = the WHOLE month before the
  selected date's month. Aggregates are computed in SQL (MIN, MAX, AVG, COUNT).
- GET /api/doctor/patients (DOCTOR role only).

Security
- bcrypt cost 12; JWT_SECRET min 32 chars; helmet; JSON body limit 10kb; ownership check
  on every query; pino redact for cookies, authorization and password fields; never log
  tokens or passwords; production uses prisma migrate deploy.
- Cookie: httpOnly, SameSite=Lax, path /; the Secure flag follows COOKIE_SECURE (NOT
  NODE_ENV), so the Docker demo over plain http still logs in.
- CSRF: server/src/common/middleware/originCheck.middleware.js is applied to every
  POST/PATCH/PUT/DELETE under /api. If an Origin header is present and is not EXACTLY
  equal to CLIENT_ORIGIN (plain string equality: no startsWith, wildcards or regex),
  respond 403 FORBIDDEN. If Origin is absent, allow it (non-browser clients such as
  Supertest hold no browser session; browsers always send Origin on these methods).
  SameSite=Lax is a second layer, not the only protection. No state-changing GET
  endpoints: GET handlers never write data.
- Rate limiting: strict limiter on login and register, general limiter on /api. Both are
  SKIPPED when NODE_ENV=test so integration tests are not flaky.
- Seed safety: prisma/seed.js refuses to run when NODE_ENV=production unless
  ALLOW_DEMO_SEED=true is set explicitly; otherwise it prints a clear message and exits
  non-zero. The Docker demo sets ALLOW_DEMO_SEED=true in compose only.
- Doctor accounts and doctor-patient links are created only by the seed script.
- Refresh-token rotation is documented as optional future work and NOT scaffolded.

Testing: Vitest everywhere. Must-have tests: all 5 validation rules; the 3 report ranges
including 15 Jan -> previous month is Dec of the previous year, 1 Mar in leap and
non-leap years, and 1st-of-month MTD; empty state; a user cannot read/edit/delete another
user's reading; pagination boundaries; ReadingForm test with MSW (empty, 39, 601, future
date, duplicate-slot server error). Extra must-haves: originCheck (mismatched Origin ->
403, matching Origin passes, absent Origin passes); register with body {role:"DOCTOR"}
still creates a PATIENT; 5 simultaneous POST /api/readings for one user and day leave at
most 4 rows and every failed request carries a friendly message; the 5th reading returns
the daily-limit message. Integration tests use TEST_DATABASE_URL (applied through
migrations in global-setup) and run sequentially. Placeholder tests use it.todo so they
never pass or fail misleadingly.

Seed (document in TESTING.md and README): idempotent (upsert by email; replace or skip
existing demo readings); demo patient demo@sweety.app / Demo@1234 with readings for the
last 60 days relative to today so all three reports are non-empty; one day with fewer than
4 readings (for the reminder); one doctor linked to the patient. README states the demo
credentials are for development and demos only.

CODING_STANDARDS.md must explicitly PROHIBIT TypeScript and state the .js/.jsx rule, the
.js-extension import rule, JSDoc for complex functions, no magic strings or numbers, and
no unneeded dependencies.
VERIFY: all 8 docs + README exist; every MODULES.md section has all six items; API.md uses
/api/health; no document lists TypeScript as part of the selected stack and
CODING_STANDARDS.md explicitly prohibits it; the README Troubleshooting and Assumptions
text is present; the four security rules (CSRF, patient-only registration, seed guard,
Secure-by-COOKIE_SECURE) appear in SECURITY.md. Commit:
"docs: add architecture, module specs and implementation plan".

=== PHASE 3: FOLDER TREE AND PLACEHOLDERS ===
Every file below must exist. Non-test code files contain exactly ONE line:
// TODO(module-N): see docs/MODULES.md
Test files (*.test.js / *.test.jsx) contain exactly:
import { it } from 'vitest';
it.todo('TODO(module-N): see docs/MODULES.md');
Folders that would otherwise be empty get a .gitkeep.
Module numbers (N): shared/* = 1; server/prisma/seed.js = 2; server config, common,
lib/prisma, lib/logger, health, tests/setup (except test-redis), factories, helpers = 3;
originCheck middleware = 3; auth, users, security.api.test.js = 4; readings and its tests
= 5; reports (except cache) and its tests = 6; client src/app, api, components/layout,
components/feedback, hooks, lib, test, features/auth and features/readings files = 7 for
foundation files and 8 for feature files; ReadingForm.test.jsx and LoginForm.test.jsx =
10; Dockerfiles, nginx.conf = 9; lib/redis.js, test-redis.js, report.cache*, and
reports.cache.api.test.js = 11; jobs/reminder = 12; doctors, features/doctor,
doctors.access.api.test.js = 13.

shared/ (also: jsconfig.json, vitest.config.js; package.json exists from phase 1)
  src/constants/{slots,limits,messages,roles}.js
  src/schemas/{auth,reading,report,pagination}.schema.js + auth.schema.test.js,
    reading.schema.test.js
  src/utils/date.js + date.test.js ; src/index.js

server/ (also: Dockerfile placeholder, .dockerignore, jsconfig.json, vitest.config.js)
  prisma/schema.prisma (datasource + generator only; url = env("DATABASE_URL")), seed.js
  src/config/env.js
  src/common/constants/{redisPrefixes,cookieNames}.js
  src/common/errors/{AppError,httpErrors,prismaErrorMapper}.js
  src/common/middleware/{auth,role,validate,rateLimit,requestId,originCheck,
    errorHandler}.middleware.js
  src/common/utils/{validated,cookies}.js
  src/lib/{prisma,redis,logger}.js
  src/modules/health/{health.routes,health.controller}.js
  src/modules/auth/{auth.routes,auth.controller,auth.service,auth.service.test,
    password.hasher,token.service,index}.js
  src/modules/users/{user.repository,user.mapper,index}.js
  src/modules/readings/{reading.routes,reading.controller,reading.service,
    reading.service.test,reading.repository,reading.mapper,index}.js
  src/modules/reports/{report.routes,report.controller,report.service,
    report.service.test,report.repository,report.ranges,report.ranges.test,report.cache,
    report.cache.test,report.mapper,index}.js
  src/modules/doctors/{doctor.routes,doctor.controller,doctor.service,doctor.repository,
    doctor.mapper,patientAccess.policy,index}.js
  src/jobs/reminder/{reminder.queue,reminder.scheduler,reminder.processor,
    reminder.processor.test}.js
  src/{app,server,worker}.js
  tests/setup/{global-setup,test-db,test-redis}.js
  tests/factories/{user,reading}.factory.js ; tests/helpers/{request,auth}.js
  tests/integration/{auth.api,security.api,readings.validation.api,readings.crud.api,
    readings.pagination.api,readings.ownership.api,readings.concurrency.api,
    reports.ranges.api,reports.empty-state.api,reports.cache.api,
    doctors.access.api}.test.js

client/ (also: index.html, components.json with "tsx": false and alias "@", nginx.conf and
  Dockerfile placeholders, .dockerignore, jsconfig.json with "@/*" -> "src/*",
  vite.config.js, vitest.config.js, public/favicon.svg)
  src/main.jsx ; src/styles/globals.css
  src/app/{App,router,providers}.jsx ; src/app/queryClient.js
  src/api/{httpClient,apiError,queryKeys,auth.api,readings.api,reports.api,
    doctors.api}.js
  src/features/auth/: components/{LoginForm,RegisterForm}.jsx, LoginForm.test.jsx,
    hooks/{useLogin,useRegister,useCurrentUser}.js, context/AuthContext.jsx,
    pages/{LoginPage,RegisterPage}.jsx, index.js
  src/features/readings/: components/{ReadingForm,ReadingsTable,ReadingRow,
    DeleteReadingDialog,Pagination}.jsx, ReadingForm.test.jsx,
    hooks/{useReadings,useCreateReading,useUpdateReading,useDeleteReading}.js,
    pages/ReadingsPage.jsx, index.js
  src/features/reports/: components/{ReportCard,ReportStats,ReportEmptyState,
    DailyReadingsList,ReportDatePicker,MonthlyChart}.jsx, hooks/useReport.js,
    pages/ReportsPage.jsx, index.js (public API used by the doctor feature)
  src/features/doctor/: components/PatientList.jsx, hooks/usePatients.js,
    pages/{PatientsPage,PatientReportPage}.jsx, index.js
  src/components/ui/.gitkeep ; src/components/layout/{AppShell,Navbar,ProtectedRoute,
    RoleRoute}.jsx ; src/components/feedback/{ErrorBoundary,FormError,LoadingSpinner,
    EmptyState}.jsx
  src/hooks/useDocumentTitle.js ; src/lib/{utils,format}.js
  src/test/{setup.js,renderWithProviders.jsx,factories.js,msw/server.js,msw/handlers.js}
  (ReadingForm.test.jsx and LoginForm.test.jsx live next to their components, as listed.)

Also create docs/screenshots/.gitkeep.
VERIFY: every listed file exists; placeholders contain the right line; test files use
it.todo; `find . ( -name "*.ts" -o -name "*.tsx" -o -name "tsconfig*.json" ) -not -path
"*/node_modules/*"` returns nothing. Commit: "chore: scaffold project structure".

=== PHASE 4: AI CONTEXT FILES ===
GEMINI.md at repo root, under 120 lines: project summary; hard rules; the security rules
(userId from req.user, exact Origin check, PATIENT-only registration, seed guard); docs
index; import direction (routes -> controller -> service -> repository -> lib/prisma;
common/ and shared/ import nothing from modules); "never redesign the architecture"; and
this workflow:
 A) Inspect: read the module's section in docs/MODULES.md and related files, list files to
    create/modify, note security and test concerns. Do not code yet.
 B) Implement ONLY that module with tests; no placeholders, no unrelated edits, no new
    dependency without saying why.
 C) Verify: run that module's tests and lint, check module boundaries and ownership,
    report failures honestly. Never claim done if tests fail.
 D) Final report: files created/modified, tests run + results, known limitations, next
    module. Then stop and wait; commit only when asked.
 Also: "Keep output short, do not re-explain the architecture, do not rewrite working code."
CLAUDE.md at repo root containing a single line: @GEMINI.md  (one source of truth).
.gemini/skills/<name>/SKILL.md for: project-architecture, javascript-standards,
backend-development, database-prisma, api-security, testing, frontend-development,
docker-deployment. Each starts with YAML frontmatter (name, one-line description of when
to use it) followed by 15-40 lines of concrete rules restated from this prompt (e.g.
javascript-standards: no TypeScript, ESM, .js extensions in imports, JSDoc for complex
functions, no unneeded dependencies, no magic strings or numbers). Skills may not be
auto-discovered by every Gemini CLI version, so the essential rules must ALSO be in
GEMINI.md.
VERIFY: GEMINI.md < 120 lines; 8 skills each with valid frontmatter; CLAUDE.md is the
single line @GEMINI.md. Commit: "chore: add gemini and claude context files".

=== PHASE 5: FINAL VERIFICATION ===
1. No .ts/.tsx/tsconfig files. 2. All JSON parses. 3. Every tree file exists. 4. No .env
and no secrets committed. 5. package-lock.json status stated honestly (present, or CI
blocked). 6. Print the tree (3 levels) and `git log --oneline` (expect 4 phase commits).
7. Final report: what was created, anything not done or assumed, versions chosen, a
reminder that lint and tests have not been run, and the exact next step for the user
(run `npm install`, `npm run lint`, `npm test`). Then STOP. Do not start feature
implementation.