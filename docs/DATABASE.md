# Database — Sweety Blood Glucose Tracker

## Technology

- **ORM**: Prisma 6.x (`@prisma/client`, `prisma`)
- **Database**: PostgreSQL 16+
- **Schema file**: `packages/server/prisma/schema.prisma`
- **Migrations**: `packages/server/prisma/migrations/`

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  PATIENT
  DOCTOR
}

enum Slot {
  MORNING_FASTING
  AFTER_BREAKFAST
  AFTER_LUNCH
  AFTER_DINNER
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(PATIENT)
  createdAt    DateTime @default(now())

  readings      Reading[]
  doctorLinks   DoctorPatient[] @relation("DoctorLinks")
  patientLinks  DoctorPatient[] @relation("PatientLinks")
}

model Reading {
  id          String   @id @default(uuid())
  userId      String
  readingDate DateTime @db.Date
  slot        Slot
  value       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, readingDate, slot])
  @@index([userId, readingDate])
}

model DoctorPatient {
  doctorId  String
  patientId String

  doctor  User @relation("DoctorLinks",  fields: [doctorId],  references: [id], onDelete: Cascade)
  patient User @relation("PatientLinks", fields: [patientId], references: [id], onDelete: Cascade)

  @@id([doctorId, patientId])
}
```

---

## Migrations

### Migration 1 — Initial schema

Creates all three tables and their indexes via `prisma migrate dev`.

```
packages/server/prisma/migrations/
  20240101000000_init/
    migration.sql
```

### Migration 2 — Reading value CHECK constraint

Adds a database-level constraint to enforce that glucose readings are physiologically plausible:

```sql
ALTER TABLE "Reading"
  ADD CONSTRAINT "reading_value_range"
  CHECK (value BETWEEN 40 AND 600);
```

> **Note:** Zod validation rejects out-of-range values at the API layer first; this constraint is a defence-in-depth guard.

---

## Entity Relationships

```
User 1──────────────* Reading
     (userId FK, cascade delete)

User (DOCTOR) *────────────* User (PATIENT)
              via DoctorPatient
              (composite PK: doctorId + patientId, both cascade)
```

---

## Date Handling

| Layer | Representation |
|---|---|
| API request / response | Plain `YYYY-MM-DD` string |
| Repository edge | Converted to a `Date` object at **UTC midnight** (`new Date(dateStr + 'T00:00:00.000Z')`) before passing to Prisma |
| Prisma / PostgreSQL | Stored as a `DATE` column (no time component) |

**Rule:** Plain `YYYY-MM-DD` strings flow end-to-end between client and server. The conversion to a `Date` object happens *only* inside the repository, never in controllers or services.

The "today" boundary (for rejecting future-date readings and reports) is computed in `APP_TIMEZONE` (default: `Asia/Kolkata`) using `date-fns-tz`.

---

## Seed Script

**File:** `packages/server/prisma/seed.js`

### Guard

```js
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  console.error('Refusing to seed in production. Set ALLOW_DEMO_SEED=true to override.');
  process.exit(1);
}
```

### Demo Data Created

| Entity | Detail |
|---|---|
| Demo patient | `demo@sweety.app` / `Demo@1234`, role `PATIENT` |
| Readings | Last 60 days; one day intentionally has fewer than 4 readings |
| Doctor account | `doctor@sweety.app` / `Doctor@1234`, role `DOCTOR` |
| DoctorPatient link | Doctor linked to demo patient |

The seed is **idempotent** — running it twice does not duplicate data (`upsert` / `createIfNotExists` patterns).

---

## Useful Commands

```bash
# Apply migrations (dev)
npm run db:migrate -w @sweety/server

# Open Prisma Studio
npm run db:studio -w @sweety/server

# Run seed
npm run db:seed -w @sweety/server

# Reset database (drops, re-migrates, re-seeds)
npm run db:reset -w @sweety/server
```
