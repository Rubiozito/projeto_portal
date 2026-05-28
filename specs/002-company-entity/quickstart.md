# Quickstart: Company Entity

**Feature**: `002-company-entity` | **Branch**: `002-company-entity`

## Prerequisites

- Node.js LTS installed
- `npm install` already run
- A user with `role: "OWNER"` must exist before creating a company (see helper below)

## Running the API

```bash
npm run dev
```

The server starts on `http://localhost:3000`.

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```

## TDD Workflow for this Feature

1. Start with `company-service.test.ts` — unit tests for the service layer.
2. Run `npm run test:watch` and confirm the test is **red**.
3. Write the minimum production code to make it green.
4. Refactor under green tests.
5. Move to the integration test file for the next user story (create → get → list → update → delete).
6. Repeat.

## Manual Smoke Tests

> Assumes the server is running at `http://localhost:3000`.

### 1. Create a prerequisite user (role OWNER)

```bash
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Owner","email":"alice@example.com","role":"OWNER"}' \
  | jq .
# → 201 — copy the returned "id" as OWNER_ID
```

### 2. Register a company

```bash
curl -s -X POST http://localhost:3000/company \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Acme Corp",
    "customDomain": "acme.portal.com",
    "ownerUserId": "<OWNER_ID>"
  }' | jq .
# → 201 — copy the returned "id" as COMPANY_ID
```

### 3. Retrieve a company

```bash
curl -s http://localhost:3000/company/<COMPANY_ID> | jq .
# → 200
```

### 4. List all companies

```bash
curl -s http://localhost:3000/company | jq .
# → 200 with array
```

### 5. Update a company

```bash
curl -s -X PATCH http://localhost:3000/company/<COMPANY_ID> \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Acme Corp Renamed"}' | jq .
# → 200
```

### 6. Delete a company (owner only)

```bash
curl -s -X DELETE http://localhost:3000/company/<COMPANY_ID> \
  -H "Content-Type: application/json" \
  -d '{"callerId": "<OWNER_ID>"}' | jq .
# → 204 No Content

# Attempt by a non-owner
curl -s -X DELETE http://localhost:3000/company/<COMPANY_ID> \
  -H "Content-Type: application/json" \
  -d '{"callerId": "<OTHER_USER_ID>"}' | jq .
# → 403 Forbidden
```

## Key Implementation Notes

- `customDomain` is stored as **lowercase** — `Acme.Portal.Com` and `acme.portal.com` are
  treated as the same domain.
- The `callerId` in the DELETE body is a temporary mechanism until an auth layer is
  introduced; it will be replaced by the JWT `sub` claim.
- `clearDatabase()` in `src/shared/database/mock-database.ts` now clears both the user
  array and the company array — all test `afterEach` hooks continue to work without changes.
