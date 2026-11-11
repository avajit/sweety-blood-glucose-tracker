# Coding Standards — Sweety Blood Glucose Tracker

---

## Language

**This project is JavaScript only. TypeScript is strictly prohibited.**

- Do **not** add `typescript`, `ts-node`, `tsx`, `@types/*` packages, or any `.ts` / `.tsx` files anywhere in the repository.
- Do **not** add `tsconfig.json` files.
- ESLint must **not** include TypeScript parser or plugins.
- shadcn/ui is installed with `tsx:false` — components are `.jsx`, not `.tsx`.

---

## File Extensions

| Context | Extension | Rule |
|---|---|---|
| Node.js / server modules | `.js` | ES module syntax (`import`/`export`); `"type": "module"` in `package.json` |
| React components (with JSX) | `.jsx` | All files containing JSX markup use `.jsx` |
| Shared utilities, constants | `.js` | No JSX → `.js` |
| Test files | `.test.js` or `.test.jsx` | Match the extension of the file under test |

### Relative Import Extension Rule

**Always include the `.js` extension in relative imports**, even when importing `.jsx` files from `.js` files. Node's ESM resolver requires explicit extensions.

```js
// ✅ Correct
import { ReadingForm } from './components/ReadingForm.jsx';
import { formatDate } from '../utils/date.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';

// ❌ Wrong — missing extension
import { ReadingForm } from './components/ReadingForm';
import { formatDate } from '../utils/date';
```

Package imports (bare specifiers like `'react'`, `'zod'`, `'@sweety/shared'`) do **not** need an extension.

---

## JSDoc

Add JSDoc comments to all non-trivial functions — particularly:

- Repository methods (describe params and return type)
- Service methods (describe business rule enforced)
- Utility functions in `@sweety/shared`
- Custom React hooks

Minimal example:

```js
/**
 * Returns all readings for a user within an optional date range.
 * @param {string} userId
 * @param {{ from?: string, to?: string, skip: number, take: number }} opts
 * @returns {Promise<{ data: Reading[], total: number }>}
 */
export async function findAllByUser(userId, opts) { … }
```

---

## No Magic Strings or Numbers

All reusable string literals and numeric constants must be defined in `@sweety/shared/constants/` and imported from there.

```js
// ✅ Correct
import { VALUE_MIN, VALUE_MAX } from '@sweety/shared/constants/limits.js';
import { SLOTS } from '@sweety/shared/constants/slots.js';

// ❌ Wrong
if (value < 40 || value > 600) { … }
if (slot === 'MORNING_FASTING') { … }
```

---

## Error Messages

**All user-facing error and success message strings live exclusively in `@sweety/shared/constants/messages.js`.**

- Server `AppError` instances use a key from `messages.js`.
- Client form validation messages reference the same constants (or Zod `message` overrides that import from `messages.js`).
- Never hard-code message strings in controllers, services, or components.

```js
// packages/shared/constants/messages.js
export const MESSAGES = {
  AUTH: {
    EMAIL_TAKEN:      'An account with this email already exists.',
    INVALID_CREDS:    'Invalid email or password.',
    UNAUTHORIZED:     'You must be logged in to do that.',
  },
  READINGS: {
    DAILY_LIMIT:      'You can only record 4 readings per day.',
    DUPLICATE_SLOT:   'A reading for this slot already exists today.',
    FUTURE_DATE:      'Reading date cannot be in the future.',
    NOT_FOUND:        'Reading not found.',
    FORBIDDEN:        'You do not have permission to modify this reading.',
  },
  REPORTS: {
    FUTURE_DATE:      'Report date cannot be in the future.',
    FORBIDDEN:        'You do not have access to this patient\'s data.',
  },
  VALIDATION: {
    VALUE_RANGE:      'Glucose value must be between 40 and 600 mg/dL.',
    INVALID_SLOT:     'Invalid reading slot.',
    INVALID_DATE:     'Invalid date format. Use YYYY-MM-DD.',
  },
};
```

---

## No Unneeded Dependencies

Before adding a package, ask:
1. Is this already provided by an existing dependency?
2. Can a small utility in `@sweety/shared/utils/` replace it?
3. Is it listed in the approved stack in `ARCHITECTURE.md`?

If the answer to all three is "no", discuss with the team before adding. Do **not** add:
- `lodash` (use native JS)
- `moment` (use `date-fns`)
- `uuid` (use `crypto.randomUUID()`)
- `dotenv` on the client (use Vite's built-in env support)

---

## Module and Import Organisation

Order imports consistently in every file:

1. Node built-ins (`node:path`, `node:fs`)
2. Third-party packages
3. Workspace packages (`@sweety/shared/…`)
4. Relative imports (deepest → shallowest)

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `reading.service.js` |
| React components | `PascalCase.jsx` | `ReadingForm.jsx` |
| Variables / functions | `camelCase` | `findAllByUser` |
| Constants | `UPPER_SNAKE_CASE` | `VALUE_MAX` |
| Prisma models | `PascalCase` | `Reading` |
| Database columns | `camelCase` (Prisma default) | `readingDate` |
| Environment variables | `UPPER_SNAKE_CASE` | `JWT_SECRET` |

---

## Code Style (ESLint + Prettier)

- **Prettier** handles all formatting (single quotes, 2-space indent, trailing commas in multi-line).
- **ESLint** enforces code quality; extends `eslint:recommended`.
- Pre-commit hook (`husky` + `lint-staged`) runs `eslint --fix` and `prettier --write` on staged files.
- Never commit code that fails `npm run lint`.

---

## Git Conventions

- Branch names: `feat/<module>-<short-description>`, `fix/<short-description>`.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- Every feature branch must pass CI before merging to `main`.
