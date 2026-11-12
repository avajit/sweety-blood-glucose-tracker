# Sweety Blood Glucose Tracker — Comprehensive QA Master Test Strategy & Test Inventory

**Document Reference:** QA-STRATEGY-001  
**Author:** Lead Independent QA Engineer  
**Date:** November 12, 2026  
**Project:** Sweety Blood Glucose Platform (`@sweety/shared`, `@sweety/server`, `@sweety/client`)  
**Target Release:** v1.0.0 Production Readiness Evaluation  

---

## 1. Executive Summary & Quality Objectives

This document establishes the independent Master Test Strategy for the Sweety platform. As a clinical and personal health application dealing with biometric glucose data, clinical analytics (Time in Range, estimated HbA1c, GMI), acute emergency workflows (ADA Rule of 15 for hypoglycemia), and doctor-patient confidentiality, the standard of testing must meet medical-grade software expectations.

### Quality Goals:
1. **Clinical & Biometric Data Integrity:** Verify strict adherence to glucose limits (40–600 mg/dL), daily slot uniqueness, and clinical correlates (carbs, insulin).
2. **Deterministic Mathematical Correctness:** Verify Time-in-Range (TIR) percentages, eA1c calculations, standard deviation, and Coefficient of Variation against clinical guidelines.
3. **Security & Authorization Rigor:** Zero tolerance for IDOR, CSRF bypasses, token theft/replay vulnerabilities, or patient data leakage to unauthorized doctors.
4. **Reliability & Resilience:** Database transaction integrity, CHECK constraints, cache consistency, and graceful error handling under malformed or extreme inputs.

---

## 2. Test Scope & Feature Matrix

The test strategy covers 11 major functional and non-functional areas:

| Module / Feature Code | Description | Test Types Covered |
|---|---|---|
| **FEAT-01: AUTH** | User Authentication & Token Lifecycle | Functional, Boundary, Security, Session, Rate Limiting |
| **FEAT-02: READ** | Blood Glucose Readings & Correlates | CRUD, Boundary (40/600), Business Rules (4/day, slot unique), DB Constraints |
| **FEAT-03: HYPO** | Severe Hypoglycemia (Rule of 15) Protocol | Clinical Logic, Event Triggers, UI Timer, Protocol Conformance |
| **FEAT-04: RPT** | Clinical Glycemic Analytics & Reporting | Math Accuracy (TIR, eA1c, GMI, CV), Timeframe Filters, Redis Caching |
| **FEAT-05: DOC** | Doctor-Patient Clinical Portal | Access Control, Pairing Codes, Unlinking, Multi-tenant Isolation |
| **FEAT-06: CSV** | CSV Export & Data Portability | Formatting, Injection Prevention, Character Encoding, Completeness |
| **FEAT-07: NOTIF** | Notification & Reminder Infrastructure | Scheduling, Preferences, In-app State |
| **FEAT-08: PUSH** | Web Push Notification System | Subscription Handshake, VAPID, Browser Worker compatibility |
| **FEAT-09: BG** | Asynchronous Processing (BullMQ/Redis) | Worker Reliability, Queue Resilience |
| **FEAT-10: SEC** | Cross-Cutting Security Architecture | Origin Check (CSRF), IDOR, SQLi, XSS, Secret Scrubbing, Brute Force |
| **FEAT-11: UI/A11Y** | Responsive UI, Accessibility & Performance | WCAG 2.1 AA, Viewport Compatibility, Keyboard Flow, API Latency |

---

## 3. Detailed Test Case Inventory

### 3.1 Feature 01: Authentication & Token Management (AUTH)

- **TC-AUTH-01 (Positive Registration):** Register new patient with valid email, name, password (`StrongPass123!`). Expected: 201 Created, user created with PATIENT role, password hashed, no role tampering allowed.
- **TC-AUTH-02 (Role Tampering Prevention):** Register patient with explicit `"role": "DOCTOR"` or `"role": "ADMIN"` in body. Expected: Server ignores input role and assigns PATIENT or rejects.
- **TC-AUTH-03 (Password Boundary Validation):** Register with passwords < 8 chars, missing uppercase, missing special char, or > 128 chars. Expected: 400 Bad Request with descriptive Zod validation error.
- **TC-AUTH-04 (Duplicate Email Registration):** Register with an already existing email. Expected: 409 Conflict with generic safe error message.
- **TC-AUTH-05 (Valid Login & Cookie Issuance):** Login with valid credentials. Expected: 200 OK, accessToken in response, refreshToken in HTTP-Only, SameSite=Lax cookie.
- **TC-AUTH-06 (Invalid Credentials):** Login with wrong password or non-existent email. Expected: 401 Unauthorized with generic message ("Invalid email or password").
- **TC-AUTH-07 (Brute-Force Rate Limiting):** Attempt 6 rapid consecutive failed logins from single IP. Expected: 6th request fails with 429 Too Many Requests.
- **TC-AUTH-08 (Token Refresh & Rotation):** Call `/api/auth/refresh` with valid refresh cookie. Expected: 200 OK, new access token issued, refresh token rotated in DB.
- **TC-AUTH-09 (Token Replay / Theft Detection):** Present an old, already-rotated refresh token. Expected: 401 Unauthorized and invalidation of entire token family.
- **TC-AUTH-10 (Logout Cleanup):** Call `/api/auth/logout`. Expected: Refresh cookie cleared, token revoked in DB.

### 3.2 Feature 02: Blood Glucose Readings Management (READ)

- **TC-READ-01 (Boundary Minimum Glucose 40 mg/dL):** Create reading with value = 40. Expected: 201 Created.
- **TC-READ-02 (Boundary Below Minimum 39 mg/dL):** Create reading with value = 39. Expected: 400 Bad Request ("Value must be between 40 and 600").
- **TC-READ-03 (Boundary Maximum Glucose 600 mg/dL):** Create reading with value = 600. Expected: 201 Created.
- **TC-READ-04 (Boundary Above Maximum 601 mg/dL):** Create reading with value = 601. Expected: 400 Bad Request.
- **TC-READ-05 (Non-integer / String / Null Glucose):** Create reading with value = 120.5, "one-twenty", null, -50. Expected: 400 Bad Request.
- **TC-READ-06 (Valid Meal Slots):** Create readings with FASTING, BEFORE_MEAL, AFTER_MEAL, BEDTIME. Expected: 201 for each valid slot.
- **TC-READ-07 (Invalid Meal Slot):** Create reading with slot = "MIDNIGHT_SNACK" or "RANDOM". Expected: 400 Bad Request.
- **TC-READ-08 (Duplicate Meal Slot on Same Day):** Create two readings with slot = "FASTING" on 2026-11-12. Expected: 2nd request fails with 409 Conflict ("Reading for this meal slot already exists today").
- **TC-READ-09 (Max 4 Readings Per Day Limit):** Submit a 5th reading on the same calendar day with another slot. Expected: 400/409 error ("Maximum 4 readings allowed per day").
- **TC-READ-10 (Carbs Correlate Boundary [0-300g]):** Test carbs = 0 (valid), carbs = 300 (valid), carbs = -1 (invalid), carbs = 301 (invalid).
- **TC-READ-11 (Insulin Correlate Boundary [0-100u]):** Test insulin = 0 (valid), insulin = 100 (valid), insulin = -0.5 (invalid), insulin = 101 (invalid).
- **TC-READ-12 (Reading Ownership Isolation):** Patient B attempts to update or delete Patient A's reading. Expected: 404 Not Found or 403 Forbidden.

### 3.3 Feature 03: Severe Hypoglycemia (Rule of 15) Protocol (HYPO)

- **TC-HYPO-01 (Hypo Event Trigger < 70 mg/dL):** Post reading value = 68 mg/dL. Expected: 201 Created, response flags hypoglycemia warning or triggers Rule of 15 state.
- **TC-HYPO-02 (Severe Hypo Event < 54 mg/dL):** Post reading value = 52 mg/dL. Expected: 201 Created, high clinical urgency alert.
- **TC-HYPO-03 (Normoglycemic No-Trigger):** Post reading value = 70 mg/dL. Expected: Normal reading, no hypo modal triggered.
- **TC-HYPO-04 (Frontend Rule of 15 UI Modal & Countdown):** Trigger hypo reading on frontend. Expected: Modal appears immediately with 15g carbs instructions and active 15-minute recheck countdown timer.

### 3.4 Feature 04: Clinical Glycemic Analytics & Reporting (RPT)

- **TC-RPT-01 (TIR Category Classification):**
  - Severe Hypo: < 54 mg/dL
  - Hypo: 54–69 mg/dL
  - In Range: 70–180 mg/dL
  - Hyper: 181–250 mg/dL
  - Severe Hyper: > 250 mg/dL
- **TC-RPT-02 (Estimated HbA1c Formula):** Verify formula: `eA1c = (meanGlucose + 46.7) / 28.7`. Example: mean 154 mg/dL -> (154 + 46.7)/28.7 = 7.0%.
- **TC-RPT-03 (Glycemic Variability - CV & SD):** Verify `SD = sqrt(sum((x - mean)^2) / N)` and `CV = (SD / mean) * 100%`.
- **TC-RPT-04 (Timeframe Filter Queries):** Test 7d, 14d, 30d, 90d query parameters. Expected: Proper date bounding and non-overlapping datasets.
- **TC-RPT-05 (Redis Report Caching & Invalidation):** Query report -> verify cache hit on second query. Add new reading -> verify cache is invalidated and fresh stats returned.

### 3.5 Feature 05: Doctor-Patient Clinical Portal (DOC)

- **TC-DOC-01 (Doctor Pairing Code Generation):** Patient generates 8-char pairing code. Expected: 200 OK, unique code with expiration.
- **TC-DOC-02 (Doctor Link Patient via Code):** Doctor links patient using valid code. Expected: 201 Created, relation established.
- **TC-DOC-03 (Doctor View Linked Patient Dashboard):** Doctor retrieves clinical analytics of linked patient. Expected: 200 OK with patient's glucose telemetry.
- **TC-DOC-04 (Doctor Access Denial for Unlinked Patient):** Doctor attempts to access patient ID not linked to them. Expected: 403 Forbidden.
- **TC-DOC-05 (Patient Unlink Doctor):** Patient removes doctor access. Subsequent doctor requests for that patient must return 403 Forbidden.

### 3.6 Feature 06: CSV Export & Data Integrity (CSV)

- **TC-CSV-01 (Export Schema & Headers):** Call `/api/readings/export`. Expected: 200 OK, `Content-Type: text/csv`, headers: Date, Time, Meal Slot, Glucose Value (mg/dL), Category, Carbs (g), Insulin (units), Notes.
- **TC-CSV-02 (CSV Formula Injection Sanitization):** Add note starting with `=SUM(1+1)`, `@`, `+`, `-`. Expected: Export escapes leading formula characters to prevent DDE/spreadsheet execution vulnerabilities.
- **TC-CSV-03 (Empty Dataset Export):** Export when patient has 0 readings. Expected: 200 OK with valid CSV header row, 0 data rows.

### 3.7 Feature 07 & 08: Notifications & Web Push (NOTIF / PUSH)

- **TC-NOTIF-01 (Notification Preference Update):** Patient toggles daily email reminders. Expected: 200 OK, updated in DB.
- **TC-PUSH-01 (VAPID Public Key Retrieval):** Call `/api/notifications/push/public-key`. Expected: 200 OK with valid base64 VAPID public key.
- **TC-PUSH-02 (Push Subscription Persistence):** Post valid W3C PushSubscription object. Expected: 201 Created, stored against user.
- **TC-PUSH-03 (Malformed Push Subscription):** Post missing endpoint or auth keys. Expected: 400 Bad Request.

### 3.8 Feature 09: Background Asynchronous Processing (BG)

- **TC-BG-01 (BullMQ Queue Connectivity):** Verify Redis connection for background jobs.
- **TC-BG-02 (Worker Job Processing):** Dispatch notification/report job and verify execution without unhandled rejections.

### 3.9 Feature 10: Cross-Cutting Security Architecture (SEC)

- **TC-SEC-01 (CSRF Exact Origin Verification):** Send POST request with header `Origin: http://evil-hacker.com`. Expected: 403 Forbidden.
- **TC-SEC-02 (Missing Origin Header for API Clients):** Send POST request with curl/no Origin header. Expected: Allowed (passes originCheck).
- **TC-SEC-03 (IDOR Parameter Tampering on Readings):** Send PATCH `/api/readings/:otherUserIdReadingId`. Expected: 404 or 403.
- **TC-SEC-04 (Database CHECK Constraint Verification):** Bypass ORM via raw SQL or invalid payload to test DB-level CHECK constraints `40 <= value <= 600`. Expected: Postgres rejects with constraint violation error.
- **TC-SEC-05 (SQL Injection Immunity):** Submit SQL payloads (`' OR 1=1 --`, `'); DROP TABLE "Reading";--`) in queries and inputs. Expected: Escaped by Prisma, zero execution.
- **TC-SEC-06 (XSS Sanitization in Notes):** Submit `<script>alert(1)</script>` in reading notes. Expected: Stored as literal string, escaped during React rendering.

### 3.10 Feature 11: UI, Accessibility & Performance (UI/PERF)

- **TC-UI-01 (Responsive Breakpoints):** Verify mobile (375px), tablet (768px), desktop (1280px) rendering without horizontal scrollbar overflow.
- **TC-UI-02 (Color Contrast & A11y):** Glucose category badges meet WCAG AA 4.5:1 contrast ratio.
- **TC-UI-03 (Form Validation Feedback):** Inline validation displays immediately when entering 601 or 39 in glucose input.
- **TC-PERF-01 (API Response Latency Baseline):** Core endpoints (`/api/readings`, `/api/reports/analytics`) respond within <= 200ms under standard local load.
- **TC-PERF-02 (Cache Acceleration):** Report analytics cache hit executes in <= 25ms.

---

## 4. Execution Plan & Quality Gates

The test execution will proceed through Phases 3 to 10 using automated test harnesses, direct database probes, integration suites, and security payloads. Evidence will be captured into `qa-reports/evidence/` with raw logs.

