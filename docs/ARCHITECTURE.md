# Architecture — Sweety Blood Glucose Tracker

## Versions

| Package / Runtime | Version |
|---|---|
| Node.js | 22 LTS |
| Express | 5.0.1 |
| React | 18.3.1 |
| Vite | 5.4.10 |
| Tailwind CSS | 3.4.14 |
| Zod | 3.23.8 |
| Prisma | 6.1.0 |
| TanStack Query | 5.60.5 |
| React Hook Form | 7.53.2 |
| @hookform/resolvers | 3.9.1 |
| Recharts | 2.13.3 |
| date-fns | 4.1.0 |
| Vitest | 2.1.4 |
| MSW | 2.6.4 |
| React Testing Library | 16.0.1 |

---

## Monorepo Layout

```
sweety-blood-glucose-tracker/
├── package.json              # npm workspaces root
├── packages/
│   ├── shared/               # @sweety/shared  – Zod schemas, constants, utils
│   ├── server/               # @sweety/server  – Express 5 API
│   └── client/               # @sweety/client  – React 18 + Vite SPA
└── docs/
```

### npm Workspaces

The root `package.json` declares:

```json
{
  "workspaces": ["packages/shared", "packages/server", "packages/client"]
}
```

---

## Backend Architecture

### Request Lifecycle

```
HTTP Request
  └─► routes (Express Router)
        └─► originCheck middleware  (CSRF guard – POST/PATCH/PUT/DELETE)
        └─► authenticate middleware (JWT cookie → req.user)
        └─► validate(schema)        (Zod parse → req.validated)
              └─► controller        (HTTP only: reads req.*, sends res.*)
                    └─► service     (business logic, transactions; never touches req/res)
                          └─► repository  (only layer allowed to call Prisma)
                                └─► Prisma Client → PostgreSQL
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Routes** | Register path + middleware chain; no logic |
| **`validate(schema)`** | Runs `schema.parse(req.body \| req.query \| req.params)`; stores result on `req.validated`; passes `ZodError` to `next()` |
| **Controller** | Reads from `req.validated`, `req.user`, `req.params`; calls service; sends HTTP response. Never holds business rules |
| **Service** | All business rules and DB transactions. Receives a Prisma client via constructor (enables test injection). Never imports `req` or `res` |
| **Repository** | The *only* layer that calls Prisma. One repository per domain model |
| **`errorHandler`** | Last middleware; formats every error as `{ error: { code, message, details } }` |

### Key Conventions

- **Express 5 async propagation** — Express 5 natively forwards rejected async handler promises to `next(error)`. No `asyncHandler` wrapper is used anywhere.
- **`userId` source** — Always read from `req.user.id` (set by `authenticate` middleware). Controllers never accept `userId` from request body or query params.
- **Prisma client injection** — `new ReadingService(prisma)`. In integration tests a test-database Prisma client is injected instead.
- **Redis** — Optional. The cache layer (`modules/cache/`) checks for a Redis connection; if absent it falls back to no-op. The application starts without Redis.
- **BullMQ worker** — Only the separate worker process (`packages/server/src/worker.js`) registers recurring reminder jobs. The main API process does not.

### Doctor Access

Doctor-specific access to patient data is enforced by `modules/doctors/patientAccess.policy.js`. This middleware verifies that the requesting doctor has an active `DoctorPatient` record for the target `patientId` before the controller runs.

---

## Frontend Architecture

```
packages/client/src/
├── main.jsx
├── App.jsx
├── routes/              # React Router 6 route tree
├── pages/               # Page-level components
├── components/          # Reusable UI (shadcn/ui + custom)
├── features/            # Feature folders (readings, reports, auth, doctor)
│   └── <feature>/
│       ├── api.js       # Axios calls + TanStack Query hooks
│       ├── components/  # Feature-scoped components
│       └── schemas.js   # Re-exports shared Zod schema
├── hooks/               # Shared custom hooks
├── lib/                 # axios instance, queryClient, utils
└── mocks/               # MSW handlers for tests
```

### Networking

| Environment | How client reaches API |
|---|---|
| Development | Vite `server.proxy` proxies `/api` → `http://localhost:4000` |
| Docker / production | nginx reverse-proxy routes `/api` to the Express container |

### Data Fetching

TanStack Query 5 manages all server state. `useQuery` / `useMutation` hooks live in `features/<domain>/api.js`. The Axios instance is configured in `lib/axios.js` with `withCredentials: true` so the `httpOnly` cookie is sent automatically.

### Forms

React Hook Form 7 + `@hookform/resolvers` integrates Zod schemas from `@sweety/shared` for client-side validation. The same schema validates on the server, guaranteeing identical rules.

---

## Security Overview

See [`SECURITY.md`](./SECURITY.md) for the full security specification.

---

## Environment Variables

### Server (`packages/server/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 32 chars |
| `CLIENT_ORIGIN` | ✅ | Exact browser origin, e.g. `http://localhost:5173` |
| `PORT` | No | Defaults to `4000` |
| `COOKIE_SECURE` | No | `true` in production |
| `APP_TIMEZONE` | No | Defaults to `Asia/Kolkata` |
| `REDIS_URL` | No | Enables Redis cache / BullMQ |
| `TEST_DATABASE_URL` | Test | Separate DB for integration tests |
| `ALLOW_DEMO_SEED` | No | Required to run seed in production |

### Client (`packages/client/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE` | Base URL (empty in dev; nginx origin in Docker) |
