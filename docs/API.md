# API Reference — Sweety Blood Glucose Tracker

All endpoints are mounted under `/api`.  
Authentication uses an **`httpOnly` cookie** (`token`) set on login.

---

## Security Model

| Mechanism | Detail |
|---|---|
| **JWT cookie** | `httpOnly`, `SameSite=Lax`; `Secure` flag follows `COOKIE_SECURE` env var |
| **Origin check** | `originCheck` middleware runs on every `POST`, `PATCH`, `PUT`, `DELETE`. If the `Origin` header is present and does not **exactly** equal `CLIENT_ORIGIN` → `403`. If absent → allowed. |
| **Rate limiting** | Applied globally; skipped when `NODE_ENV=test` |

---

## Error Shape

Every error response (4xx / 5xx) follows this envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [ /* optional array, e.g. Zod field errors */ ]
  }
}
```

Common error codes:

| Code | HTTP Status |
|---|---|
| `VALIDATION_ERROR` | 400 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `DAILY_LIMIT` | 409 |
| `FUTURE_DATE` | 422 |
| `INTERNAL_ERROR` | 500 |

---

## Health

### `GET /api/health`

Public. Returns server status.

**Response 200**

```json
{ "status": "ok", "timestamp": "2024-11-11T07:00:00.000Z" }
```

---

## Auth — `/api/auth`

### `POST /api/auth/register`

Register a new **patient** account. The `role` field is **never** read from the request; the service always sets `PATIENT`.

**Request body**

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "Secret@123"
}
```

| Field | Rules |
|---|---|
| `name` | required, non-empty string |
| `email` | required, valid email, stored as lowercase |
| `password` | required, min 8 characters |

**Response 201**

```json
{
  "id": "uuid",
  "name": "Alice",
  "email": "alice@example.com",
  "role": "PATIENT"
}
```

Sets `token` cookie.

**Errors:** `400 VALIDATION_ERROR`, `409 CONFLICT` (email taken)

---

### `POST /api/auth/login`

**Request body**

```json
{ "email": "alice@example.com", "password": "Secret@123" }
```

**Response 200** — same shape as register. Sets `token` cookie.

**Errors:** `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`

---

### `POST /api/auth/logout`

Clears the `token` cookie.

**Response 200**

```json
{ "message": "Logged out" }
```

---

### `GET /api/auth/me`

Requires authentication.

**Response 200**

```json
{
  "id": "uuid",
  "name": "Alice",
  "email": "alice@example.com",
  "role": "PATIENT"
}
```

**Errors:** `401 UNAUTHORIZED`

---

## Readings — `/api/readings`

All endpoints require authentication. `userId` is always taken from `req.user.id`.

### `GET /api/readings`

Paginated list of the authenticated user's readings.

**Query parameters**

| Param | Default | Description |
|---|---|---|
| `page` | `1` | Page number (1-based) |
| `limit` | `20` | Items per page (max 100) |
| `from` | — | `YYYY-MM-DD` start date (inclusive) |
| `to` | — | `YYYY-MM-DD` end date (inclusive) |

**Response 200**

```json
{
  "data": [
    {
      "id": "uuid",
      "readingDate": "2024-11-10",
      "slot": "MORNING_FASTING",
      "value": 95,
      "createdAt": "2024-11-10T04:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 143,
  "totalPages": 8
}
```

---

### `POST /api/readings`

Create a new reading.

**Request body**

```json
{
  "date": "2024-11-11",
  "slot": "AFTER_BREAKFAST",
  "value": 112
}
```

| Field | Rules |
|---|---|
| `date` | required, `YYYY-MM-DD`, not in the future |
| `slot` | required, one of `MORNING_FASTING \| AFTER_BREAKFAST \| AFTER_LUNCH \| AFTER_DINNER` |
| `value` | required, integer, 40–600 |

**Response 201** — the created Reading object.

**Errors:**
- `400 VALIDATION_ERROR` — invalid fields
- `409 DAILY_LIMIT` — the day already has 4 readings (checked before duplicate-slot)
- `409 CONFLICT` — the same slot already exists for that day
- `422 FUTURE_DATE` — `date` is in the future (relative to `APP_TIMEZONE`)

---

### `PATCH /api/readings/:id`

Update the `value` (and optionally `slot` or `date`) of an existing reading. Only the owner may update.

**Request body** — all fields optional, at least one required:

```json
{ "value": 98 }
```

**Response 200** — updated Reading object.

**Errors:** `400 VALIDATION_ERROR`, `403 FORBIDDEN` (not owner), `404 NOT_FOUND`

---

### `DELETE /api/readings/:id`

Delete a reading. Only the owner may delete.

**Response 204** — no body.

**Errors:** `403 FORBIDDEN`, `404 NOT_FOUND`

---

## Reports — `/api/reports/:type`

Requires authentication. The `patientId` query param is accepted only for `DOCTOR` role users who have a `DoctorPatient` link to that patient; for `PATIENT` role the report always uses `req.user.id`.

**Path param `type`**

| Value | Description |
|---|---|
| `daily` | A single calendar day |
| `month-to-date` | From the 1st of the selected date's month up to and including the selected date |
| `monthly` | The entire calendar month **before** the selected date's month |

**Query parameters**

| Param | Required | Description |
|---|---|---|
| `date` | ✅ | `YYYY-MM-DD` reference date; must not be in the future |
| `patientId` | No | Doctor only; defaults to `req.user.id` |

**Response 200**

```json
{
  "type": "daily",
  "range": {
    "from": "2024-11-11",
    "to": "2024-11-11"
  },
  "count": 3,
  "highest": 145,
  "lowest": 88,
  "average": 112,
  "readings": [
    {
      "slot": "MORNING_FASTING",
      "value": 88,
      "readingDate": "2024-11-11"
    }
  ]
}
```

`average` is rounded to the nearest integer. `highest`, `lowest`, `average` are `null` when `count === 0`.

**Errors:**
- `400 VALIDATION_ERROR` — unknown `type` or invalid `date`
- `403 FORBIDDEN` — doctor requested `patientId` they are not linked to
- `422 FUTURE_DATE` — `date` is in the future

---

## Doctor — `/api/doctor`

Requires authentication **and** `role === DOCTOR`.

### `GET /api/doctor/patients`

List all patients linked to the authenticated doctor.

**Response 200**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Alice",
      "email": "alice@example.com"
    }
  ]
}
```

**Errors:** `403 FORBIDDEN` (not a doctor)
