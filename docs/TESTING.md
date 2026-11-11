# Testing — Sweety Blood Glucose Tracker

---

## Testing Stack

| Package | Purpose |
|---|---|
| **Vitest 2.1.4** | Test runner for all packages (server + client + shared) |
| **Supertest** | HTTP integration tests for Express routes |
| **React Testing Library 16.0.1** | Component tests with user-centric queries |
| **@testing-library/user-event** | Realistic user interaction simulation |
| **@testing-library/jest-dom** | Custom matchers (`.toBeInTheDocument()`, etc.) |
| **jsdom** | Browser DOM environment for Vitest |
| **MSW 2.6.4** | Mock Service Worker — API mocking in component tests |

---

## Configuration

### Shared / Server (`vitest.config.js`)

```js
// packages/server/vitest.config.js
export default {
  test: {
    environment: 'node',
    globals: true,
    sequence: { concurrent: false },   // integration tests run sequentially
  },
};
```

### Client (`vitest.config.js`)

```js
// packages/client/vitest.config.js
export default {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/mocks/setup.js'],
  },
};
```

---

## Integration Test Setup

- Integration tests use a **separate `TEST_DATABASE_URL`** pointing to a dedicated test database.
- The test database is migrated (`prisma migrate deploy`) before the suite runs.
- Tests run **sequentially** (`sequence: { concurrent: false }`) to avoid state conflicts.
- Each test suite uses `beforeAll` / `afterAll` hooks to seed and clean specific rows.
- A Prisma client pointed at `TEST_DATABASE_URL` is injected into services under test.

```js
// example: packages/server/src/modules/readings/__tests__/reading.integration.test.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
```

---

## Seed for Tests

The test seed (also the demo seed `prisma/seed.js`) creates:

| Entity | Detail |
|---|---|
| Demo patient | `demo@sweety.app` / `Demo@1234`, role `PATIENT` |
| Readings | Last 60 days of data; **one day intentionally has fewer than 4 readings** |
| Doctor | `doctor@sweety.app` / `Doctor@1234`, role `DOCTOR` |
| DoctorPatient | Doctor linked to the demo patient |

The seed is **idempotent** — running it multiple times produces the same result.

---

## Must-Have Tests

### 1. Validation — 5 Rules (`packages/shared`)

```
✅ value below 40 is rejected
✅ value above 600 is rejected
✅ date in the future is rejected
✅ unknown slot value is rejected
✅ email is normalised to lowercase before validation passes
```

### 2. Report Ranges — 3 Cases + Edge Cases (`packages/server`)

```
✅ monthly: date = 2024-02-15 → range from 2024-01-01 to 2024-01-31
✅ month-to-date: date = 2024-11-01 → single-day range (from 2024-11-01 to 2024-11-01)
✅ daily: future date → 422 FUTURE_DATE
✅ edge case: empty result → { count:0, highest:null, lowest:null, average:null, readings:[] }
```

### 3. Empty State (`packages/server`)

```
✅ GET /api/readings with no data → { data:[], total:0, totalPages:0, page:1, limit:20 }
```

### 4. Ownership (`packages/server`)

```
✅ PATCH /api/readings/:id by non-owner → 403 FORBIDDEN
✅ DELETE /api/readings/:id by non-owner → 403 FORBIDDEN
✅ Doctor GET /api/reports/:type?patientId= for unlinked patient → 403 FORBIDDEN
```

### 5. Pagination (`packages/server`)

```
✅ Second page returns correct data slice
✅ totalPages is Math.ceil(total / limit)
✅ Requesting page beyond totalPages returns empty data array (not an error)
```

### 6. ReadingForm with MSW (`packages/client`)

```
✅ Submitting invalid value shows inline error without calling API
✅ Submitting valid form → MSW returns 201 → success feedback shown
✅ MSW returns 409 DAILY_LIMIT → correct message from messages.js is displayed
✅ All inputs have associated labels (accessibility)
```

### 7. `originCheck` (`packages/server`)

```
✅ Absent Origin header → next() called (allowed)
✅ Origin === CLIENT_ORIGIN exactly → next() called
✅ Origin present but different → 403 returned
✅ GET request → originCheck is not applied
```

### 8. Register with DOCTOR Role (`packages/server`)

```
✅ POST /api/auth/register with body { role: "DOCTOR" } → created user has role PATIENT
```

### 9. Concurrency / Daily Limit (`packages/server`)

```
✅ Posting a 5th reading on the same day → 409 DAILY_LIMIT (not duplicate-slot error)
✅ When day has 3 readings and duplicate slot is submitted → 409 CONFLICT
```

---

## Running Tests

```bash
# All packages
npm test

# Single package
npm test -w @sweety/shared
npm test -w @sweety/server
npm test -w @sweety/client

# Watch mode
npm test -- --watch -w @sweety/client

# Coverage
npm test -- --coverage -w @sweety/server
```

---

## CI

GitHub Actions runs lint → unit tests → integration tests → build on every push and pull request. See Module 14 and `.github/workflows/ci.yml`.

The CI Postgres service is provided by the `services:` block in the workflow:

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_DB: sweety_test
      POSTGRES_USER: sweety
      POSTGRES_PASSWORD: sweety
    ports:
      - 5432:5432
```

`TEST_DATABASE_URL` is set to `postgresql://sweety:sweety@localhost:5432/sweety_test`.
