---
name: frontend-development
description: React 18, Vite, TanStack Query, shadcn/ui JS, Tailwind, and Recharts patterns for Sweety client.
---

# Frontend Development Rules

## Tech Stack & Setup
- React 18 + Vite SPA in `packages/client`.
- UI: Tailwind CSS + shadcn/ui in pure JavaScript (`"tsx": false` in `components.json`).
- Forms: React Hook Form with `@hookform/resolvers/zod` consuming `@sweety/shared` schemas.
- Data fetching: TanStack Query v5 with query keys defined in `src/api/queryKeys.js`.
- Routing: React Router 6 with `ProtectedRoute` (requires active session) and `RoleRoute` (requires specific role).

## Visualization & Analytics
- Visual charts: Recharts library for rendering month-to-date and previous-month blood glucose trends.
- Friendly empty state handling when no readings exist for a chosen timeframe.
- Dates: Formatted with `date-fns` using the user's local context aligned with `VITE_APP_TIMEZONE`.

## API Client & Cookies
- Axios client configured with `withCredentials: true` to forward `httpOnly` authentication cookies automatically.
- Centralized error parsing in `src/api/apiError.js` to extract `{ error: { code, message, details } }`.
- Features communicate outside their directory exclusively via `src/features/<feature>/index.js`.
