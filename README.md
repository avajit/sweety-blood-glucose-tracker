# Sweety — Blood Glucose Tracker

[![CI](https://github.com/avajit/sweety-blood-glucose-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/avajit/sweety-blood-glucose-tracker/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-22_LTS-339933?logo=node.js)
![Express](https://img.shields.io/badge/express-5.0.1-000000?logo=express)
![React](https://img.shields.io/badge/react-18.3.1-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-4169E1?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/tailwind-3.4.14-06B6D4?logo=tailwindcss)
![Docker](https://img.shields.io/badge/docker-compose-2496ED?logo=docker)

A production-grade, clinical blood glucose monitoring application built for diabetic patients and supervising physicians. Sweety enables patients to record and manage up to 4 daily blood glucose readings (mg/dL) across clinical meal slots, visualizes longitudinal analytics (Daily, Month-to-Date, and Monthly) aligned with **American Diabetes Association (ADA)** clinical standards, and grants credentialed healthcare providers secure access to linked patient records.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture & Monorepo](#system-architecture--monorepo)
- [Clinical Guidelines (ADA Standards)](#clinical-guidelines-ada-standards)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Seed Data & Demo Accounts](#seed-data--demo-accounts)
- [Docker & Containerization](#docker--containerization)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [API Reference](#api-reference)
- [Security Architecture](#security-architecture)
- [Application Screenshots](#application-screenshots)
- [Troubleshooting](#troubleshooting)
- [Assumptions & Future Roadmap](#assumptions--future-roadmap)

---

## Overview

Managing diabetes requires disciplined, longitudinal glucose logging. Sweety provides a zero-friction, clinically accurate platform designed around patient health outcomes and clinician workflow:
1. **Patient Portal:** Log daily readings across 4 distinct meal slots (`FASTING`, `POST_BREAKFAST`, `POST_LUNCH`, `POST_DINNER`), filter historical logs, and track glycemic control over custom dates and calendar months.
2. **Clinical Analytics:** Instant calculations of Mean Glucose, Min/Max values, and readings count, plotted against ADA glycemic target bands in interactive charts.
3. **Doctor Portal:** Healthcare providers can securely view their linked patient roster and inspect detailed clinical glycemic reports without boundary crossing.
4. **Resilient Background Automation:** Automated daily reminders via BullMQ workers and high-speed report caching via Redis with automatic invalidation.

---

## System Architecture & Monorepo

The repository is structured as an **npm workspaces** monorepo written in **100% standard JavaScript (ES Modules, zero TypeScript)**.

```
sweety-blood-glucose-tracker/
├── client/                     # @sweety/client (React 18 + Vite SPA)
│   ├── src/
│   │   ├── api/                # Axios API client instances
│   │   ├── components/         # Shared UI & layout components (Navbar, AppShell)
│   │   ├── features/           # Domain feature modules (auth, readings, reports, doctor)
│   │   ├── mocks/              # MSW 2 test handlers & server
│   │   └── routes/             # Protected and role-based React Router 6 routes
│   └── nginx.conf              # Production Nginx reverse proxy configuration
├── server/                     # @sweety/server (Express 5 API)
│   ├── prisma/                 # Prisma 6 schema and idempotent seed runner
│   ├── src/
│   │   ├── common/             # Middlewares (auth, originCheck, rateLimit, validate, errorHandler)
│   │   ├── config/             # Zod environment variable validation with timezone check
│   │   ├── lib/                # Database (Prisma) and Redis client singletons
│   │   ├── modules/            # Domain modules (auth, readings, reports, doctors, cache, reminders)
│   │   └── worker.js           # Standalone BullMQ daily reminder background worker
│   └── tests/                  # Integration test suites against PostgreSQL
├── shared/                     # @sweety/shared (Shared Zod schemas, constants, and date utilities)
│   └── src/
│       ├── constants/          # Clinical limits, meal slots, messages, and roles
│       ├── schemas/            # Request validation schemas (auth, reading, report, pagination)
│       └── utils/              # Pure timezone-aware date arithmetic
├── docs/                       # Architecture, Database, Security, and API specifications
└── docker-compose.yml          # Full-stack Docker orchestration
```

### Request Lifecycle
```
HTTP Request
  └─► Express Router
        └─► originCheck.middleware.js   (CSRF guard on mutating requests)
        └─► authenticate.middleware.js  (JWT cookie → req.user)
        └─► role.middleware.js          (RBAC enforcement)
        └─► validate.middleware.js      (Zod parsing into req.validated)
              └─► Controller            (HTTP translation: reads req.*, sends res.*)
                    └─► Service         (Business logic & database transactions)
                          └─► Repository (Prisma Client queries PostgreSQL)
```

---

## Clinical Guidelines (ADA Standards)

Sweety strictly adheres to the **American Diabetes Association (ADA) Standards of Medical Care in Diabetes**:

| Clinical Meal Slot | Recommended Target Range | Clinical Note |
|---|---|---|
| `FASTING` | **70 – 130 mg/dL** | Pre-prandial / morning baseline |
| `POST_BREAKFAST` | **< 180 mg/dL** | 1-2 hours post-meal peak |
| `POST_LUNCH` | **< 180 mg/dL** | 1-2 hours post-meal peak |
| `POST_DINNER` | **< 180 mg/dL** | 1-2 hours post-meal peak |

- **Hypoglycemia Alert:** `< 70 mg/dL` (Flagged in Amber/Red for urgent intervention)
- **Normal Range:** `70 – 180 mg/dL` (Post-meal acceptable upper threshold)
- **Hyperglycemia Alert:** `> 180 mg/dL` (Flagged in Red for elevated glycemic risk)
- **Physiological Boundaries:** Inputs must fall between `40 mg/dL` and `600 mg/dL`.
- **Daily Quota:** Exactly 1 reading per slot; maximum 4 readings per calendar day.

---

## Key Features

- **Clinical Correlates (Carbohydrates & Rapid Insulin):** Patients can optionally log meal carbohydrate intake (0–300g) and rapid-acting bolus insulin units (0–100u) alongside glucose readings, providing endocrinologists with vital insulin-to-carb ratio context.
- **ADA Rule of 15 Hypoglycemia Emergency Protocol:** Immediate interactive modal alert triggering for readings < 70 mg/dL, complete with clinical carb treatment instructions and a live 15-minute retest countdown timer.
- **One-Click Clinical CSV Export:** Instant RFC 4180-compliant CSV export from both Readings and Reports pages with full clinical slot names, ADA classification labels, carbs, insulin, and notes.
- **Enterprise Refresh Token Rotation:** Silent token refresh with cryptographic family rotation, reuse theft detection, and automatic client interceptor retry.
- **Strict Meal Slot & Daily Limit Concurrency:** High-concurrency database transactions (`SERIALIZABLE` isolation / transactional check constraints) prevent race conditions when logging readings.
- **Dynamic Glycemic Reports:**
  - **Daily Report:** Meal slot distribution, count, mean, min, and max for any selected date.
  - **Month-to-Date (MTD):** Rolling cumulative glycemic analytics from the 1st of the month to the selected date.
  - **Monthly Report:** Full calendar summary of the preceding complete month.
- **Smart Redis Caching Layer:** Caches report aggregations with a 60-second TTL. Automatically purges user cache tags upon any reading mutation (Create, Update, Delete). Gracefully degrades to direct PostgreSQL queries if Redis is offline.
- **Background Reminder Worker:** Powered by BullMQ and Node.js. Runs on a scheduled cron (`0 20 * * *`) to query patients with fewer than 4 readings logged today and dispatch notifications.
- **Doctor Clinical Access & Patient Linking:** Dedicated doctor portal (`/doctor/patients`) allowing physicians to review linked patient logs with strict cross-patient boundary protection.
- **Enterprise CSRF & Origin Validation:** Rejects mutating requests with mismatched `Origin` headers (403 Forbidden) while permitting legitimate same-origin and non-browser automated requests.

---

## Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Runtime** | Node.js 22 LTS | Fast, modern JavaScript runtime with native ES Modules |
| **Backend Framework** | Express 5.0.1 | Next-gen Express with native rejected promise propagation |
| **Database & ORM** | PostgreSQL 16 + Prisma 6.1.0 | Relational database with type-safe queries, joins, and migrations |
| **Frontend Framework** | React 18.3.1 + Vite 5.4.10 | Blazing fast client SPA with hot module reloading |
| **State & Data Fetching** | TanStack Query 5 | Server-state caching, automatic refetching, and query invalidation |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Responsive modern design system with semantic clinical palettes |
| **Data Visualization** | Recharts 2.13.3 | Responsive SVG area and line charts with target threshold bands |
| **Validation** | Zod 3.23.8 | End-to-end runtime contract validation across client and server |
| **Caching & Queues** | Redis + BullMQ | Fast key-value report caching and background queue execution |
| **Testing** | Vitest + RTL + MSW 2 + Supertest | Comprehensive unit, component, integration, and mock tests |

---

## Prerequisites

Before setting up the project, ensure you have the following installed:
- **Node.js:** `>= 22.9.0` (Use `nvm use` to select version from `.nvmrc`)
- **npm:** `>= 10.x`
- **PostgreSQL:** `>= 16` (Running locally or via Docker)
- **Redis:** `>= 7.x` (Optional; app runs normally without Redis)
- **Docker & Docker Compose:** (Optional; for containerized startup)

---

## Installation & Setup

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/avajit/sweety-blood-glucose-tracker.git
cd sweety-blood-glucose-tracker
npm install
```

### 2. Configure Environment Variables
Copy the example environment file to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` matches your local database credentials:
```env
# Application
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
APP_TIMEZONE=Asia/Kolkata
VITE_APP_TIMEZONE=Asia/Kolkata

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sweety_dev?schema=public

# Authentication & Security
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
COOKIE_SECURE=false

# Cache & Queues (Optional)
REDIS_URL=redis://localhost:6379
REMINDER_CRON=0 20 * * *
```

### 3. Database Migration & Seeding
Deploy database tables and populate 60 days of clinical demo records:
```bash
npm run db:migrate
npm run db:seed
```

---

## Running the Application

You can run individual workspaces or run both frontend and backend concurrently:

| Component | Command | URL / Details |
|---|---|---|
| **API Server** | `npm run dev:server` | `http://localhost:4000` |
| **Frontend SPA** | `npm run dev:client` | `http://localhost:5173` |
| **Background Worker** | `npm run dev:worker` | BullMQ standalone reminder process |
| **Prisma Studio** | `npm run db:studio` | Interactive database GUI at `http://localhost:5555` |

---

## Seed Data & Demo Accounts

The database seed provides two pre-configured evaluation accounts:

### 1. Demo Patient Account
- **Email:** `demo@sweety.app`
- **Password:** `Demo@1234`
- **Role:** `PATIENT`
- **Seed Data:** Populated with **60 days of realistic clinical readings** with realistic variance, normal distributions, and occasional post-meal glycemic elevations.

### 2. Demo Doctor Account
- **Email:** `doctor@sweety.app`
- **Password:** `Doctor@1234`
- **Role:** `DOCTOR`
- **Permissions:** Linked via `DoctorPatient` relation to the demo patient; can inspect patient records and historical reports.

> **Production Safety Guard:** `prisma/seed.js` will refuse to run in `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true` is explicitly provided.

---

## Docker & Containerization

A complete multi-container production stack is orchestrated via Docker Compose:

```bash
# Start all services (PostgreSQL, Redis, API Server, Worker, and Nginx SPA)
npm run docker:up

# Stop all services and tear down persistent volumes
npm run docker:down
```

### Services Deployed:
- `client`: Multi-stage Alpine container serving Vite static build via Nginx on port `80`, reverse-proxying `/api/*` to the backend.
- `server`: Node 22 Alpine API container running Express 5 on port `4000`.
- `worker`: Standalone BullMQ daily reminder background worker.
- `postgres`: PostgreSQL 16 container with persistent data volume `postgres_data`.
- `redis`: Redis 7 container with persistent data volume `redis_data`.

Verify deployment health:
```bash
curl http://localhost/api/health
# Returns: {"status":"ok","timestamp":"2026-11-12T...","timezone":"Asia/Kolkata"}
```

---

## Testing & Quality Assurance

Sweety features a comprehensive test suite across all layers:

```bash
# Run all workspace test suites
npm test

# Run server unit & PostgreSQL integration tests
npm run test -w server

# Run client component & MSW form tests
npm run test -w client

# Run code style & lint checks
npm run lint
```

### Test Coverage Highlights:
- **Server (21 Test Files, 139 Tests):**
  - Concurrency checks verifying that duplicate slots and 5th daily readings are rejected inside transactions.
  - Ownership enforcement ensuring patients cannot read, modify, or delete another patient's data.
  - Doctor access policies verifying linked patient access (200) vs unlinked patient access (403).
  - Exact Origin CSRF header validation across mutating methods (POST/PATCH/DELETE).
  - Timezone-aware date calculations and clinical report aggregation logic.
- **Client (10 Test Files, 27 Tests):**
  - MSW 2 network interception testing invalid glucose inputs, future dates, daily limits, and API error states.
  - Accessible form labeling, navigation, authentication state transitions, and responsive chart fallbacks.

---

## API Reference

All REST endpoints are mounted under `/api` and return standardized JSON responses.

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new patient (Role strictly forced to `PATIENT`) | Public |
| `POST` | `/api/auth/login` | Authenticate user & issue `httpOnly` JWT session cookie | Public |
| `POST` | `/api/auth/logout` | Clear session cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch active user session | Authenticated |

### Glucose Readings (`/api/readings`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/readings` | Create reading (Checks 4/day limit and duplicate slot) | Patient |
| `GET` | `/api/readings` | Paginated readings list with `from`, `to`, `page`, `limit` | Patient |
| `PATCH` | `/api/readings/:id` | Update glucose value or notes | Patient (Owner) |
| `DELETE` | `/api/readings/:id` | Delete reading (Returns `204 No Content`) | Patient (Owner) |

### Clinical Reports (`/api/reports`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/reports/daily?date=` | Daily slot breakdown, count, min, max, avg | Patient / Doctor |
| `GET` | `/api/reports/month-to-date?date=` | Month-to-date cumulative clinical report | Patient / Doctor |
| `GET` | `/api/reports/monthly?date=` | Previous full calendar month clinical report | Patient / Doctor |

### Doctor Portal (`/api/doctor`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/doctor/patients` | List all patients linked to the authenticated doctor | Doctor |

### Health Check (`/api/health`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Health check returning status and server timestamp | Public |

---

## Security Architecture

1. **User Identity from `req.user`:** User identity is strictly extracted from the validated JWT payload. No endpoint trusts `userId` from request body, query params, or URL parameters.
2. **Exact Origin Header Protection:** `originCheck.middleware.js` evaluates every mutating HTTP request (`POST`, `PATCH`, `PUT`, `DELETE`). If the `Origin` header does not match `CLIENT_ORIGIN`, the request is terminated with `403 FORBIDDEN`.
3. **Session Cookie Isolation:** Authentication JWT is stored in an `httpOnly`, `SameSite=Lax`, `path=/` cookie. Secure flag follows `COOKIE_SECURE` configuration.
4. **Strict Role Isolation:** Public registration cannot specify a `role`. Doctor accounts can only be created via administrative database seeding.
5. **Doctor-Patient Access Policy:** Access to patient reports via `?patientId=` is gated by `patientAccess.policy.js`, ensuring doctors can only access patients explicitly assigned to them.
6. **Rate Limiting:** Global rate limiters protect authentication endpoints against brute-force attacks.

---

## Application Screenshots

### 1. Clinical Dashboard & Readings Log
*Track daily glucose logs, meal slots, ADA glycemic badges, and log new readings via modal form.*

![Sweety Dashboard](docs/screenshots/dashboard.png)

---

### 2. Longitudinal Glycemic Analytics & ADA Charting
*View cumulative Month-to-Date averages, Min/Max statistics, and ADA target line charts.*

![Sweety Analytics & Reports](docs/screenshots/reports.png)

---

### 3. Secure Authentication
*Sign in as a patient or clinician with built-in demo credentials for immediate exploration.*

![Sweety Login](docs/screenshots/login.png)

---

## Troubleshooting

### Why does a mutating request fail with 403 Forbidden?
The backend enforces exact Origin header validation (`originCheck.middleware.js`) against CSRF attacks. Ensure your client's origin matches the `CLIENT_ORIGIN` environment variable (`http://localhost:5173` in development, or the Nginx domain in Docker).

### Can the application run if Redis is unavailable?
**Yes.** The caching service (`cache.service.js`) and worker connection check Redis availability upon startup. If Redis is down, the API falls back to direct PostgreSQL queries without interruption.

### How are dates and timezones processed?
Dates are stored and parsed as pure `YYYY-MM-DD` strings. "Today" calculations are resolved using `APP_TIMEZONE` (defaulting to `Asia/Kolkata` / `Intl.DateTimeFormat`) to prevent UTC date boundary drift.

---

## Assumptions & Future Roadmap

### Technical Assumptions:
1. **Meal Slots:** Exactly 4 standardized clinical meal slots (`FASTING`, `POST_BREAKFAST`, `POST_LUNCH`, `POST_DINNER`).
2. **Monthly Report Interval:** Defined as the entire calendar month preceding the selected date (e.g., a selection in March evaluates February 1–28/29).
3. **Validation Precedence:** If a user has 4 readings logged for a day, the 4-per-day quota error takes precedence over the duplicate slot error.

### Future Roadmap:
- [x] Export clinical reports to structured CSV for physician consultations.
- [x] Carbohydrate intake (grams) and insulin dosage (units) logging to correlate insulin sensitivity ratios.
- [x] ADA Rule of 15 hypoglycemia emergency protocol modal with built-in retest timer.
- [x] Enterprise Refresh Token Rotation with replay theft detection and Axios retry.
- [ ] Direct Bluetooth / NFC integration with Continuous Glucose Monitors (Dexcom, FreeStyle Libre).
- [ ] Export clinical summary sheets to printable PDF.
- [ ] Real-time push notifications via Web Push API for missed readings.

---

## License

This project was built for the **Kenpath Junior Full Stack Developer (JavaScript & AI)** technical assessment.
