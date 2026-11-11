---
name: database-prisma
description: Prisma 6 ORM guidelines, models, migrations, constraints, queries, and seeding rules.
---

# Database & Prisma Rules

## Schema & Models
- Use Prisma 6.x (pin 6.x, not 7). Models: `User`, `Reading`, `DoctorPatient`.
- Enums: `Role` (`PATIENT`, `DOCTOR`), `Slot` (`MORNING_FASTING`, `AFTER_BREAKFAST`, `AFTER_LUNCH`, `AFTER_DINNER`).
- `Reading` has `@db.Date` for `readingDate`, `UNIQUE(userId, readingDate, slot)`, and index `@@index([userId, readingDate])`.
- Check constraint `CHECK ("value" BETWEEN 40 AND 600)` added via second migration.

## Date Handling
- Dates are plain `YYYY-MM-DD` strings end-to-end across API and business logic.
- Convert `YYYY-MM-DD` string to UTC-midnight `Date` object only at the repository edge.
- Timezone is never hardcoded: server reads `APP_TIMEZONE` (default `Asia/Kolkata`) and validates via `Intl`.

## Concurrency & Seed Safety
- Max 4 readings/day is structurally guaranteed by 4 slot enums and `UNIQUE(userId, readingDate, slot)`.
- Service validation runs count check (< 4) first, then duplicate slot inside `prisma.$transaction`.
- On unique constraint violation (`P2002`), detect via `isUniqueViolation(err)`, re-count outside transaction: count >= 4 returns daily-limit message, else slot duplicate message.
- `prisma/seed.js` must refuse execution when `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true`.
