# Sweety — Blood Glucose Tracker

A production-grade blood glucose tracking application built for diabetes patients to record up to 4 daily readings (mg/dl) and visualize daily, month-to-date, and previous-month analytics.

---

## Overview

TODO: Brief summary of the application, architecture overview, and core workflow.

## Tech Stack

TODO: Overview of npm workspaces (`@sweety/client`, `@sweety/server`, `@sweety/shared`), Express 5, React 18, PostgreSQL, Prisma 6, TanStack Query 5, Tailwind CSS, Recharts, and Vitest.

## Prerequisites

TODO: Node.js 22 LTS, npm >= 10, Docker & Docker Compose (optional), PostgreSQL 16.

## Installation

TODO: Step-by-step setup instructions (`npm install`).

## Database Setup

TODO: Prisma migration and database setup steps (`npm run db:migrate`).

## Running (server, client, worker)

TODO: Commands to run each component:
- Server: `npm run dev:server`
- Client: `npm run dev:client`
- Worker: `npm run dev:worker`

## Running Tests

TODO: Test commands (`npm test`).

## Seed Data

The database seed provides a demo patient and doctor account for evaluation:
- **Patient:** `demo@sweety.app` / `Demo@1234`
- **Doctor:** `doctor@sweety.app` / `Doctor@1234`

> **Note:** Demo credentials are for development and demos only. Never use them in production.

TODO: Seed commands and options (`npm run db:seed`).

## Docker

TODO: Docker Compose instructions (`docker compose up --build`).

## API Summary

TODO: High-level overview of REST API routes mounted under `/api`. See [docs/API.md](docs/API.md) for full specifications.

## Screenshots

TODO: Screenshots of the dashboard, entry modal, daily report, and monthly trends chart.

## Troubleshooting

### Works in Postman but login fails in the browser with 403?
Check that `CLIENT_ORIGIN` exactly equals the browser's origin (`http://localhost:5173` in dev; the nginx URL in Docker). The backend enforces an exact string equality check on the `Origin` header for all state-changing HTTP methods (POST, PATCH, PUT, DELETE) to protect against CSRF attacks.

## Notes

### Assumptions

1. **Date format and timezone:** Dates are plain `YYYY-MM-DD` strings end-to-end and "today" is computed in `APP_TIMEZONE` (default `Asia/Kolkata`).
2. **Monthly report definition:** "Monthly" means the whole calendar month before the selected date's month (e.g. if selected date is 2026-03-15, monthly report covers 2026-02-01 through 2026-02-28).
3. **Validation message precedence:** When a day already has 4 readings, the daily-limit message ("You can add only 4 readings per day.") takes priority over the duplicate-slot message.
4. **Future date rejection:** A report request for a future selected date is rejected with the future-date message ("Date cannot be in the future.").
5. **Doctor management:** Doctor accounts and doctor-patient links come from the seed script only; there is no self-service doctor management UI.
6. **API mount path:** The entire REST API is mounted under the `/api` prefix.
7. **Demo credentials:** Demo credentials (`demo@sweety.app` / `Demo@1234`) are for development and demos only.

### What I would improve with more time

TODO: Future improvements (refresh token rotation, export reports to PDF/CSV, real-time sync with WebSockets, insulin / carb intake tracking).
