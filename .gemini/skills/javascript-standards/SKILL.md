---
name: javascript-standards
description: Strict JavaScript language rules, ESM imports, JSDoc, and prohibitions for the codebase.
---

# JavaScript Standards & Prohibitions

## Strict Prohibition: No TypeScript
- Strictly JavaScript only across all workspaces. No `.ts`, `.tsx`, or `tsconfig*.json` files.
- Never add `@types/*`, `typescript`, `ts-node`, or TypeScript compiler plugins.
- Use `jsconfig.json` for IDE autocomplete and path aliases.

## File Extensions & ESM
- Server and shared code use `.js` with native ES Modules (`"type": "module"` in all `package.json` files).
- React components containing JSX use `.jsx`.
- Relative imports in Node.js MUST include explicit `.js` extensions (e.g. `import { x } from './foo.js'`).
- Bare package imports (`import express from 'express'`) do not use extensions.

## Coding Conventions
- Use JSDoc for non-trivial functions, repository methods, and shared utilities.
- No magic numbers or strings: use shared constants in `shared/src/constants/`.
- All user-facing error and validation messages live ONLY in `shared/src/constants/messages.js`.
- No unneeded dependencies: stick strictly to the approved project stack.
