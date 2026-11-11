---
name: testing
description: Vitest test strategy, integration tests, MSW mock patterns, and must-have test cases.
---

# Testing Standards & Required Cases

## Strategy & Setup
- Vitest is the universal runner for client, server, and shared.
- Backend integration tests run against real PostgreSQL (`TEST_DATABASE_URL`) with sequential execution (`fileParallelism: false`).
- In scaffolding, placeholder tests use `it.todo('TODO(module-N): ...')` so they never pass or fail misleadingly.

## Must-Have Backend Test Cases
1. Five validation rules: required glucose, range 40-600, duplicate slot label, max 4/day, future date rejection.
2. Report ranges: daily (selected date), month-to-date (1st through date), monthly (whole previous month). Include 15 Jan -> previous Dec, 1 Mar leap/non-leap years, and 1st of month.
3. Empty report state returns count 0 with null stats.
4. Data isolation: user cannot read, edit, or delete another patient's reading.
5. Pagination edge cases: page boundaries, limit clamps (max 100).
6. Security checks: originCheck (mismatch -> 403, match -> 200, absent -> 200), role manipulation in registration ignored.
7. Concurrency: 5 concurrent POST requests result in exactly 4 readings with clean error message.

## Must-Have Frontend Test Cases
- `ReadingForm.test.jsx` with MSW: empty submission, 39 mg/dl, 601 mg/dl, future date, duplicate slot server error.
- `LoginForm.test.jsx`: invalid credentials display error message.
