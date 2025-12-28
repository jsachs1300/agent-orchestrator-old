# PR1 Review (Externally Observable Behavior)

## Endpoints

### `POST /v1/requirements/bulk`
Bulk create requirements (PM only).

**Request headers**
```
X-Agent-Role: pm
X-Agent-Id: <opaque-string>
Content-Type: application/json
```

**Request body (example)**
```json
[
  {
    "req_id": "REQ-001",
    "title": "LLM-driven routing only",
    "priority": "P0",
    "acceptance": ["No heuristic intent classification"],
    "constraints": ["No additional properties in routing schema"],
    "source_ref": "REQUIREMENTS.md#routing",
    "status": "derived"
  }
]
```

**201 Response (example)**
```json
{
  "requirements": [
    {
      "req_id": "REQ-001",
      "title": "LLM-driven routing only",
      "priority": "P0",
      "acceptance": ["No heuristic intent classification"],
      "constraints": ["No additional properties in routing schema"],
      "source_ref": "REQUIREMENTS.md#routing",
      "status": "derived"
    }
  ]
}
```

**400 Response (validation error)**
```json
{
  "error": "validation_error",
  "message": "unexpected fields in requirement"
}
```

**409 Response (duplicates)**
```json
{
  "error": "requirement_exists",
  "message": "One or more requirements already exist",
  "duplicates": ["REQ-001"]
}
```

---

### `GET /v1/requirements/{req_id}`
Fetch a single requirement by ID (any valid role).

**Request headers**
```
X-Agent-Role: coder
X-Agent-Id: <opaque-string>
```

**200 Response (example)**
```json
{
  "req_id": "REQ-003",
  "title": "Deterministic context",
  "priority": "P2",
  "acceptance": ["Context from state only"],
  "constraints": ["No global state return"],
  "source_ref": "REQUIREMENTS.md#context",
  "status": "derived"
}
```

**404 Response**
```json
{
  "error": "not_found"
}
```

## Auth Rules (401 cases)
All `/v1/requirements/*` endpoints require **both** headers on every request:
- `X-Agent-Role` must be one of `pm | architect | coder | tester`
- `X-Agent-Id` must be present and non-empty

`POST /v1/requirements/bulk` additionally requires `X-Agent-Role: pm`.

Any missing/invalid `X-Agent-Role`, missing/empty `X-Agent-Id`, or non-`pm` role on bulk create returns:
```json
{ "error": "unauthorized" }
```

## Validation Rules (bulk create)
Payload must be an **array** of requirement objects.

Each requirement must:
- Include **only** these fields: `req_id`, `title`, `priority`, `acceptance`, `constraints`, `source_ref`, `status`
- Provide non-empty strings for `req_id`, `title`, `source_ref`
- Provide `priority` as one of `P0`, `P1`, `P2`, `P3`
- Provide `acceptance` and `constraints` as arrays of **non-empty** strings (empty arrays allowed)
- Allowed fields include `status` (optional). If present must be **"derived"**.
- Payload must not contain duplicate `req_id` values.

Invalid payloads return `400` with `error: "validation_error"` and a message describing the failure.

## Duplicate Behavior (409 rules)
If any `req_id` in the incoming array already exists, the request returns `409` and lists duplicate IDs in `duplicates`. In this case, the response body is:
```json
{
  "error": "requirement_exists",
  "message": "One or more requirements already exist",
  "duplicates": ["REQ-001"]
}
```

## Files Added/Changed
- `src/app/index.ts`
- `src/app/middleware/agent-auth.ts`
- `src/app/routes/v1/requirements.ts`
- `src/core/orchestration-v2/requirements-store.ts`
- `src/core/orchestration-v2/types.ts`
- `src/core/orchestration-v2/validation.ts`
- `tests/requirements.v2.test.js`
- `PR1_REVIEW.md`

## Tests Added + Coverage
- `tests/requirements.v2.test.js`
  - Enforces 401 when missing agent headers or non-PM role for bulk create.
  - Stores requirements via `POST /v1/requirements/bulk` for PM role (201 response).
  - Returns 409 and duplicates list on bulk create when `req_id` already exists.
  - Rejects empty/whitespace `req_id` values (400 response).
  - Defaults omitted `status` to `"derived"` on storage/response (201 response).
  - Rejects payloads with unexpected fields (400 response).
  - Rejects empty/whitespace `priority` values (400 response).
  - Rejects invalid `priority` values outside `P0`-`P3` (400 response).
  - Rejects duplicate `req_id` values within the same payload (400 response).
  - Rejects non-string entries in `acceptance` (400 response).
  - Rejects empty/whitespace entries in `acceptance` (400 response).
  - Rejects non-string entries in `constraints` (400 response).
  - Rejects empty/whitespace entries in `constraints` (400 response).
  - Enforces agent headers on `GET /v1/requirements/:req_id` (401 response).
  - Retrieves a stored requirement via `GET /v1/requirements/:req_id` (200 response).
