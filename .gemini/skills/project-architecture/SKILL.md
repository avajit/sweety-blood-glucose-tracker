---
name: project-architecture
description: High-level system architecture, monorepo boundaries, and request flow rules for Sweety.
---

# Project Architecture Rules

## Monorepo Layout
- Workspaces: `packages/shared` (@sweety/shared), `packages/server` (@sweety/server), `packages/client` (@sweety/client).
- Depend on shared using `@sweety/shared: "*"` (npm workspaces, never `workspace:*`).
- `@sweety/shared` has no build step and exports plain ESM source via `./src/index.js`.

## Backend Layering & Request Flow
- Strict layer flow: `routes` -> `validate(schema)` -> `controller` -> `service` -> `repository` -> `lib/prisma`.
- Controllers handle HTTP only: read `req.validated`, `req.user`, `req.params`; call service; return HTTP responses.
- Services hold all business logic and `$transaction` boundaries. Never touch `req`/`res`.
- Services receive `prisma` via constructor injection (enabling test harness mocks). Never import `@prisma/client`.
- Repositories are the sole query layer and accept either the client or a transaction client.
- Common and shared packages must NEVER import from feature modules.

## Client Feature Encapsulation
- Client features (`auth`, `readings`, `reports`, `doctor`) expose their public API only via their feature `index.js`.
- Cross-feature imports must go through the respective feature's `index.js` (enforced by ESLint).
- Dev networking proxies `/api` via Vite; production uses nginx reverse proxy.
