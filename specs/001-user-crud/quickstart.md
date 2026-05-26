# Quickstart: User CRUD

**Feature**: `001-user-crud` | **Branch**: `001-user-crud`

## Prerequisites

- Node.js LTS installed
- `npm install` already run (all dependencies including Zod are present)

## Running the API

```bash
npm run dev
```

The server starts on `http://localhost:3000` by default.

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# With coverage report
npm run test:coverage
```

## TDD Workflow for this Feature

1. Pick the next failing test (start with `user-service.test.ts` for unit tests, then integration tests per user story).
2. Run `npm run test:watch` and confirm the test is **red**.
3. Write the minimum implementation to make it pass.
4. Refactor under green tests.
5. Repeat for the next test / story.

## Manual Smoke Tests

All examples assume the server is running on `http://localhost:3000`.

### Create a user

```bash
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Rafael Silva","email":"rafael@example.com","role":"OWNER"}' | jq
```

Expected: HTTP 201 · `{ "data": { "id": "...", "name": "Rafael Silva", ... } }`

### List all users

```bash
curl -s http://localhost:3000/users | jq
```

Expected: HTTP 200 · `{ "data": [ ... ] }`

### Retrieve user by ID

```bash
curl -s http://localhost:3000/users/<uuid> | jq
```

Expected: HTTP 200 · `{ "data": { ... } }`

### Partial update (PATCH)

```bash
curl -s -X PATCH http://localhost:3000/users/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"name":"Rafael Souza"}' | jq
```

Expected: HTTP 200 · `{ "data": { "name": "Rafael Souza", ... } }`

### Delete a user

```bash
curl -s -X DELETE http://localhost:3000/users/<uuid> -o /dev/null -w "%{http_code}"
```

Expected: HTTP 204

## Key Files

| File                                      | Purpose                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `src/modules/users/user-entity.ts`        | `IUser` interface and `UserRole` enum              |
| `src/modules/users/user-schemas.ts`       | Zod schemas for create, update, and path params    |
| `src/modules/users/user-repository.ts`    | `IUserRepository` interface + `MockUserRepository` |
| `src/modules/users/user-service.ts`       | Business logic for all 5 operations                |
| `src/modules/users/user-controller.ts`    | Thin Express handlers                              |
| `src/modules/users/index.ts`              | Express Router — mounts all endpoints              |
| `src/app.ts`                              | Registers the users router and error handler       |
| `test/modules/users/user-service.test.ts` | Unit tests for the service layer                   |
| `test/modules/users/create-user.test.ts`  | Integration test — POST /users                     |
| `test/modules/users/get-user.test.ts`     | Integration test — GET /users/:id                  |
| `test/modules/users/list-users.test.ts`   | Integration test — GET /users                      |
| `test/modules/users/update-user.test.ts`  | Integration test — PATCH /users/:id                |
| `test/modules/users/delete-user.test.ts`  | Integration test — DELETE /users/:id               |

## API Reference

See [contracts/users.md](contracts/users.md) for the full endpoint specification.
