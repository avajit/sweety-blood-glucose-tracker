# Sweety — Blood Glucose Tracker

## Project Summary

Sweety is a blood-glucose tracker monorepo (npm workspaces). Packages: `@sweety/client` (React 18 + Vite SPA), `@sweety/server` (Express 5 API), `@sweety/shared` (Zod schemas, constants, utils). Stack: Node 22 LTS, Express 5, PostgreSQL, Prisma 6.x, Zod 3.x, React 18, TanStack Query 5, Tailwind CSS, shadcn/ui (JS, no TSX), Recharts, Vitest, MSW.

## Hard Rules

- **JavaScript only.** No `.ts`, `.tsx`, `tsconfig*.json`, or type-declaration files. No TypeScript, ever.
- Backend and shared use `.js` (ES modules, `"type":"module"` in every package.json).
- React files containing JSX use `.jsx`.
- Relative imports in Node code **must** include the `.js` extension.
- Use `"@sweety/shared": "*"` (npm workspaces syntax, NOT `"workspace:*"`).

## Security Rules

1. **userId always from `req.user`** — never from body, query string, or params.
2. **Exact Origin check** — `originCheck.middleware.js` applies to every POST/PATCH/PUT/DELETE. If `Origin` header is present and does NOT exactly equal `CLIENT_ORIGIN` → respond 403. If absent → allow (non-browser clients).
3. **Patient-only public registration** — `register` schema and service never read `role` from the request; the service sets `PATIENT` itself.
4. **Seed guard** — `prisma/seed.js` refuses to run when `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true`.
5. **Secure flag follows `COOKIE_SECURE`** (not `NODE_ENV`). `httpOnly`, `SameSite=Lax`, `path=/`.

## Docs Index

| File | Contents |
|---|---|
| `docs/ARCHITECTURE.md` | System design, versions, request lifecycle |
| `docs/DATABASE.md` | Prisma schema, enums, indexes |
| `docs/API.md` | All REST endpoints, request/response shapes |
| `docs/MODULES.md` | Per-module responsibility, files, tests |
| `docs/CODING_STANDARDS.md` | Code style rules, prohibitions |
| `docs/SECURITY.md` | Auth, CSRF, rate-limiting, seed guard |
| `docs/TESTING.md` | Test strategy, must-have cases, seed |
| `docs/IMPLEMENTATION_PLAN.md` | Time-boxed module checklist |

## Import Direction

```
routes → controller → service → repository → lib/prisma
common/ and shared/ import nothing from modules
```

Client: a feature may only be imported through that feature's `index.js`.

## Never redesign the architecture

All design decisions are encoded in the docs and in this file. If something seems wrong, report it and stop — do not silently change the design.

## Workflow (follow for every module)

**A) Inspect** — Read the module's section in `docs/MODULES.md` and all related files. List the files you will create or modify, and note security and test concerns. Do not code yet.

**B) Implement** — Write ONLY that module with its tests. No placeholders. No unrelated edits. No new dependency without explaining why.

**C) Verify** — Run that module's tests and lint. Check module boundary rules (import direction, ownership). Report failures honestly. Never claim done if tests fail.

**D) Final report** — List files created/modified, tests run and results, known limitations, and the next module. Then **stop and wait**; commit only when asked.

> Keep output short. Do not re-explain the architecture. Do not rewrite working code.

