# Data Model: Company Entity

**Phase**: 1 — Design & Contracts
**Date**: 2026-05-26
**Feature**: [spec.md](spec.md) · [plan.md](plan.md) · [research.md](research.md)

## Entities

### Company

Represents a registered organization in the portal.

| Field          | Type           | Required   | Mutable | Description                                                                         |
| -------------- | -------------- | ---------- | ------- | ----------------------------------------------------------------------------------- |
| `id`           | UUID v4 string | Yes (auto) | No      | Unique identifier, generated at creation                                            |
| `companyName`  | string         | Yes        | Yes     | Human-readable name; min 1 character; leading/trailing whitespace trimmed           |
| `customDomain` | string (FQDN)  | Yes        | Yes     | Fully-qualified domain name; stored as lowercase; unique across all company records |
| `ownerUserId`  | UUID v4 string | Yes        | Yes     | References an existing `User` whose `role` is `OWNER`                               |

### User _(existing — referenced)_

| Field       | Type       | Relevant Constraint                                                                 |
| ----------- | ---------- | ----------------------------------------------------------------------------------- |
| `id`        | UUID v4    | Referenced by `ownerUserId`; must exist at create/update time                       |
| `role`      | `UserRole` | Must be `OWNER` for a user to be set as `ownerUserId`                               |
| `companyId` | string?    | Cleared (set to `undefined`) for all users when their associated company is deleted |

---

## Relationships

```
User (role=OWNER)  ──────────────────  Company
        1                                  *
   (ownerUserId)               (many companies may share same owner)

User (any role)  ──────────────────── Company
        *                                 1
   (companyId)                   (company has many associated employees)
```

- One user may own **many** companies (no cap).
- One company has **one** owner at any given time.
- One company may have **many** users associated via `User.companyId`.
- Deletion of a company cascades: all `User` records where `companyId === deletedCompany.id`
  have their `companyId` cleared.

---

## Validation Rules

### Create Company (POST /company)

| Field          | Rule                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------- |
| `companyName`  | Required · string · min length 1 · whitespace trimmed                                       |
| `customDomain` | Required · valid FQDN (regex) · normalised to lowercase · must be unique across all records |
| `ownerUserId`  | Required · valid UUID v4 · must reference an existing User with `role = OWNER`              |
| `id`           | Stripped silently — system-generated                                                        |
| Unknown fields | Stripped silently                                                                           |

### Update Company (PATCH /company/:id)

| Field          | Rule                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `companyName`  | Optional · string · min length 1 · whitespace trimmed                                                 |
| `customDomain` | Optional · valid FQDN (regex) · normalised to lowercase · must be unique (excluding current record)   |
| `ownerUserId`  | Optional · valid UUID v4 · must reference an existing User with `role = OWNER`                        |
| `id`           | Stripped silently                                                                                     |
| Body empty     | Rejected with HTTP 400 — at least one of `companyName`, `customDomain`, `ownerUserId` must be present |
| Unknown fields | Stripped silently                                                                                     |

### Delete Company (DELETE /company/:id)

| Field      | Rule                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| `callerId` | Required in body · valid UUID v4 · must equal `company.ownerUserId`; mismatch → HTTP 403 |

### UUID Path Parameter (`:id`)

| Rule                           |
| ------------------------------ |
| Must be a valid UUID v4 string |
| Invalid format → HTTP 400      |

---

## FQDN Format

Accepted values for `customDomain` must satisfy:

```
^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$
```

| Example               | Valid?                                             |
| --------------------- | -------------------------------------------------- |
| `xyz.portal.com`      | ✅                                                 |
| `acme.empresa.com.br` | ✅                                                 |
| `my-company.io`       | ✅                                                 |
| `xyz`                 | ❌ (no TLD — missing dot)                          |
| `xyz.c`               | ❌ (TLD < 2 chars)                                 |
| `xyz com`             | ❌ (space)                                         |
| `XYZ.PORTAL.COM`      | ✅ (normalised to `xyz.portal.com` before storage) |

---

## State Transitions

```
        [POST /company]
               │
               ▼
         ┌───────────┐
         │  Active   │──── PATCH /company/:id ───► (name / domain / owner updated)
         └───────────┘
               │
        DELETE /company/:id (callerId = ownerUserId)
               │
               ▼
         ┌───────────┐     cascade
         │  Deleted  │──────────────► users.companyId = undefined
         └───────────┘               (for all users with companyId === company.id)
```

---

## Error Catalogue

| Scenario                                          | HTTP Status | Error Class             |
| ------------------------------------------------- | ----------- | ----------------------- |
| customDomain already in use                       | 409         | `DuplicatedItemError`   |
| ownerUserId not found                             | 404         | `NotFoundError`         |
| ownerUserId found but role ≠ OWNER                | 400         | `BadRequestError`       |
| Company ID not found (retrieve / update / delete) | 404         | `NotFoundError`         |
| callerId ≠ ownerUserId on delete                  | 403         | `ForbiddenError`        |
| Validation failure (missing/invalid fields)       | 400         | Zod → `BadRequestError` |
