# API Contract: Companies

**Phase**: 1 — Design & Contracts
**Date**: 2026-05-26
**Feature**: [spec.md](../spec.md) · [data-model.md](../data-model.md)
**Base path**: `/company`

---

## Endpoints

### POST /company — Register a New Company

**Request**

```http
POST /company
Content-Type: application/json

{
  "companyName": "Acme Corp",
  "customDomain": "acme.portal.com",
  "ownerUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field          | Type   | Required | Constraints                                     |
| -------------- | ------ | -------- | ----------------------------------------------- |
| `companyName`  | string | Yes      | Min 1 char; trimmed                             |
| `customDomain` | string | Yes      | Valid FQDN; stored lowercase; globally unique   |
| `ownerUserId`  | UUID   | Yes      | Must reference an existing User with role OWNER |

**Responses**

`201 Created`

```json
{
  "data": {
    "id": "c0ffee00-0000-4000-a000-000000000001",
    "companyName": "Acme Corp",
    "customDomain": "acme.portal.com",
    "ownerUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

`400 Bad Request` — missing/invalid field or ownerUserId does not have role OWNER

```json
{ "message": "..." }
```

`404 Not Found` — ownerUserId does not exist

```json
{ "message": "User not found" }
```

`409 Conflict` — customDomain already registered

```json
{ "message": "Domain already registered" }
```

---

### GET /company — List All Companies

**Request**

```http
GET /company
```

No body. No query parameters.

**Responses**

`200 OK`

```json
{
  "data": [
    {
      "id": "c0ffee00-0000-4000-a000-000000000001",
      "companyName": "Acme Corp",
      "customDomain": "acme.portal.com",
      "ownerUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  ]
}
```

`200 OK` _(empty list)_

```json
{ "data": [] }
```

---

### GET /company/:id — Retrieve a Company by ID

**Request**

```http
GET /company/c0ffee00-0000-4000-a000-000000000001
```

| Param | Location | Type | Constraints           |
| ----- | -------- | ---- | --------------------- |
| `id`  | path     | UUID | Must be valid UUID v4 |

**Responses**

`200 OK`

```json
{
  "data": {
    "id": "c0ffee00-0000-4000-a000-000000000001",
    "companyName": "Acme Corp",
    "customDomain": "acme.portal.com",
    "ownerUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

`400 Bad Request` — `:id` is not a valid UUID

```json
{ "message": "..." }
```

`404 Not Found`

```json
{ "message": "Company not found" }
```

---

### PATCH /company/:id — Update a Company

**Request**

```http
PATCH /company/c0ffee00-0000-4000-a000-000000000001
Content-Type: application/json

{
  "companyName": "Acme Corp Renamed"
}
```

| Param          | Location | Type   | Constraints                                                |
| -------------- | -------- | ------ | ---------------------------------------------------------- |
| `id`           | path     | UUID   | Must be valid UUID v4                                      |
| `companyName`  | body     | string | Optional · min 1 char · trimmed                            |
| `customDomain` | body     | string | Optional · valid FQDN · lowercase · unique (excl. current) |
| `ownerUserId`  | body     | UUID   | Optional · must reference existing User with role OWNER    |

At least one body field must be present.

**Responses**

`200 OK` — returns updated company

```json
{
  "data": {
    "id": "c0ffee00-0000-4000-a000-000000000001",
    "companyName": "Acme Corp Renamed",
    "customDomain": "acme.portal.com",
    "ownerUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

`400 Bad Request` — empty body, invalid field, or ownerUserId role ≠ OWNER

```json
{ "message": "..." }
```

`404 Not Found` — company or ownerUserId not found

```json
{ "message": "..." }
```

`409 Conflict` — customDomain already registered by another company

```json
{ "message": "Domain already registered" }
```

---

### DELETE /company/:id — Delete a Company

**Request**

```http
DELETE /company/c0ffee00-0000-4000-a000-000000000001
Content-Type: application/json

{
  "callerId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Param      | Location | Type | Constraints                                           |
| ---------- | -------- | ---- | ----------------------------------------------------- |
| `id`       | path     | UUID | Must be valid UUID v4                                 |
| `callerId` | body     | UUID | Must equal `company.ownerUserId`; mismatch → HTTP 403 |

**Responses**

`204 No Content` — company deleted, cascade complete (employees' `companyId` cleared)

`400 Bad Request` — `:id` or `callerId` is not a valid UUID

```json
{ "message": "..." }
```

`403 Forbidden` — callerId does not match ownerUserId

```json
{ "message": "Forbidden" }
```

`404 Not Found`

```json
{ "message": "Company not found" }
```

---

## Response Envelope

All successful responses with a body use the `{ "data": ... }` envelope, consistent with the
existing `/users` contract. `204 No Content` responses have no body.

## Error Shape

All error responses return a JSON object with at least a `message` field:

```json
{ "message": "Human-readable description" }
```

Handled by the existing `errorHandler` middleware — no changes required.
