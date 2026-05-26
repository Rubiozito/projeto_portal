---
description: 'Task list for User CRUD feature implementation'
---

# Tasks: User CRUD

**Input**: Design documents from `specs/001-user-crud/`

**Branch**: `001-user-crud` | **Date**: 2026-05-22 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

**Tests**: MANDATORY (Constitution â€” Principle II). Every user story includes unit tests
(service layer) and integration tests (controller/routes via Supertest). Test tasks are
written **before** implementation â€” TDD workflow enforced.

## Format: `[ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story label â€” [US1] through [US5]
- No story label for Setup, Foundational, and Polish phases

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire the users feature into the Express application entry point.

- [x] T001 Register `usersRouter` and `errorHandler` middleware in `src/app.ts`

**Checkpoint**: Express app routes user requests and handles errors globally.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, validation schemas, repository, service, and controller skeletons
that every user story depends on.

**âš ï¸ CRITICAL**: No user story work can begin until this phase is complete.

[x] T002 Implement `IUser` interface and `UserRole` enum in `src/modules/users/user-entity.ts`
- [x] T002b Update `errorHandler` to catch `ZodError` and return HTTP 400 with first validation message in `src/shared/middlewares/error-handler.ts`
- [x] T003 [P] Define `CreateUserSchema`, `UpdateUserSchema`, and `UuidParamSchema` with Zod in `src/modules/users/user-schemas.ts`
- [x] T004 [P] Define `IUserRepository` interface and implement `MockUserRepository` class in `src/modules/users/user-repository.ts`
- [x] T005 Create `UserService` class with constructor accepting `IUserRepository` in `src/modules/users/user-service.ts`
- [x] T006 Create `UserController` class with constructor accepting `UserService` and export `usersRouter` with DI wiring in `src/modules/users/user-controller.ts` and `src/modules/users/index.ts`

**Dependency**: T002b is independent of all other foundational tasks (already complete). T003 and T004 are [P] â€” both depend only on T002 but are independent of each other. T005 depends on T004. T006 depends on T005.

**Checkpoint**: Foundation ready â€” all 5 user story phases can now proceed in order.

---

## Phase 3: User Story 1 â€” Create a New User (Priority: P1) ðŸŽ¯ MVP

**Goal**: `POST /users` â€” register a new user; system generates UUID and creationDate;
returns `{ "data": { ...user } }` with HTTP 201.

**Independent Test**: Send a valid creation request â†’ assert response contains a UUID,
provided name/email/role, auto-generated creationDate, and HTTP 201. Send duplicate email
â†’ assert HTTP 409. Send missing field â†’ assert HTTP 400.

### Tests for User Story 1

> **Write these tests FIRST â€” ensure they FAIL before writing any implementation**

- [x] T007 [P] [US1] Write failing unit tests for `UserService.createUser` in `test/modules/users/user-service.test.ts`
- [x] T008 [P] [US1] Rewrite `test/modules/users/create-user.test.ts` with integration tests for `POST /users` aligned with spec (data envelope, roles `OWNER`/`EMPLOYEE`/`EXTERNAL`, HTTP 201/400/409)

### Implementation for User Story 1

- [x] T009 [US1] Implement `UserService.createUser` â€” UUID generation, lowercase email, creationDate, duplicate-email check â€” in `src/modules/users/user-service.ts`
- [x] T010 [US1] Implement `createUser` handler in `src/modules/users/user-controller.ts` responding with `{ data: user }` and HTTP 201
- [x] T011 [US1] Register `POST /users` route with `CreateUserSchema` Zod validation in `src/modules/users/index.ts`

**Dependency within story**: T007 and T008 are [P]. T009 depends on T007 being red (TDD).
T010 depends on T009. T011 depends on T010.

**Checkpoint**: `POST /users` is fully functional. Unit tests and integration tests pass.
User Story 1 is independently verified and deliverable as MVP.

---

## Phase 4: User Story 2 â€” Retrieve a User by ID (Priority: P2)

**Goal**: `GET /users/:id` â€” return a single user by UUID; `{ "data": { ...user } }` with
HTTP 200; HTTP 404 for unknown ID; HTTP 400 for invalid UUID format.

**Independent Test**: Create a user via POST â†’ fetch by returned UUID â†’ assert all fields
match and HTTP 200. Fetch non-existent UUID â†’ assert HTTP 404. Fetch with a non-UUID string
as `:id` â†’ assert HTTP 400.

### Tests for User Story 2

> **Write these tests FIRST â€” ensure they FAIL before writing any implementation**

- [x] T012 [P] [US2] Add failing unit tests for `UserService.getUserById` in `test/modules/users/user-service.test.ts`
- [x] T013 [P] [US2] Rewrite `test/modules/users/get-user.test.ts` with integration tests for `GET /users/:id` aligned with spec (data envelope, 200/400/404 scenarios)

### Implementation for User Story 2

- [x] T014 [US2] Implement `UserService.getUserById` â€” lookup by id, throw `NotFoundError` if absent â€” in `src/modules/users/user-service.ts`
- [x] T015 [US2] Implement `getUser` handler in `src/modules/users/user-controller.ts` responding with `{ data: user }` and HTTP 200
- [x] T016 [US2] Register `GET /users/:id` route with `UuidParamSchema` validation in `src/modules/users/index.ts`

**Checkpoint**: `GET /users/:id` is fully functional. Unit tests and integration tests pass.

---

## Phase 5: User Story 3 â€” List All Users (Priority: P3)

**Goal**: `GET /users` â€” return all registered users as `{ "data": [ ...users ] }` with
HTTP 200; empty array when no users exist.

**Independent Test**: Create multiple users â†’ request list â†’ assert all users appear and
HTTP 200. Clear the store â†’ request list â†’ assert empty array and HTTP 200.

### Tests for User Story 3

> **Write these tests FIRST â€” ensure they FAIL before writing any implementation**

- [x] T017 [P] [US3] Add failing unit tests for `UserService.getAllUsers` in `test/modules/users/user-service.test.ts`
- [x] T018 [P] [US3] Create `test/modules/users/list-users.test.ts` with integration tests for `GET /users` per spec (data envelope, populated list, empty list)

### Implementation for User Story 3

- [x] T019 [US3] Implement `UserService.getAllUsers` â€” return full array from repository â€” in `src/modules/users/user-service.ts`
- [x] T020 [US3] Implement `listUsers` handler in `src/modules/users/user-controller.ts` responding with `{ data: users }` and HTTP 200
- [x] T021 [US3] Register `GET /users` route in `src/modules/users/index.ts`

**Checkpoint**: `GET /users` is fully functional. Unit tests and integration tests pass.

---

## Phase 6: User Story 4 â€” Update a User (Priority: P4)

**Goal**: `PATCH /users/:id` â€” partially update mutable fields (name, email, companyId);
role is stripped silently; empty body â†’ HTTP 400; email conflict â†’ HTTP 409; unknown id â†’
HTTP 404; returns `{ "data": { ...updatedUser } }` with HTTP 200.

**Independent Test**: Create a user â†’ send PATCH with new name â†’ assert only name changed,
role/id/creationDate unchanged, HTTP 200. Send empty body â†’ assert HTTP 400. Send conflicting
email â†’ assert HTTP 409. Send `{ companyId: null }` â†’ assert companyId cleared.

### Tests for User Story 4

> **Write these tests FIRST â€” ensure they FAIL before writing any implementation**

- [x] T022 [P] [US4] Add failing unit tests for `UserService.updateUser` in `test/modules/users/user-service.test.ts`
- [x] T023 [P] [US4] Create `test/modules/users/update-user.test.ts` with integration tests for `PATCH /users/:id` per spec (all 8 acceptance scenarios)

### Implementation for User Story 4

- [x] T024 [US4] Implement `UserService.updateUser` â€” PATCH merge, email uniqueness check, role field ignored, `companyId: null` to clear â€” in `src/modules/users/user-service.ts`
- [x] T025 [US4] Implement `updateUser` handler in `src/modules/users/user-controller.ts` responding with `{ data: user }` and HTTP 200
- [x] T026 [US4] Register `PATCH /users/:id` route with `UuidParamSchema` and `UpdateUserSchema` Zod validation in `src/modules/users/index.ts`

**Checkpoint**: `PATCH /users/:id` is fully functional. Unit tests and integration tests
pass. All 8 acceptance scenarios verified.

---

## Phase 7: User Story 5 â€” Delete a User (Priority: P5)

**Goal**: `DELETE /users/:id` â€” permanently remove a user; HTTP 204 on success; HTTP 404
for unknown UUID; HTTP 400 for invalid UUID format.

**Independent Test**: Create a user â†’ delete by UUID â†’ assert HTTP 204 â†’ fetch same UUID
â†’ assert HTTP 404. Delete non-existent UUID â†’ assert HTTP 404.

### Tests for User Story 5

> **Write these tests FIRST â€” ensure they FAIL before writing any implementation**

- [x] T027 [P] [US5] Add failing unit tests for `UserService.deleteUser` in `test/modules/users/user-service.test.ts`
- [x] T028 [P] [US5] Create `test/modules/users/delete-user.test.ts` with integration tests for `DELETE /users/:id` per spec (204 success, 404 not found, 400 invalid UUID)

### Implementation for User Story 5

- [x] T029 [US5] Implement `UserService.deleteUser` â€” remove from repository, throw `NotFoundError` if absent â€” in `src/modules/users/user-service.ts`
- [x] T030 [US5] Implement `deleteUser` handler in `src/modules/users/user-controller.ts` responding with HTTP 204 (no body)
- [x] T031 [US5] Register `DELETE /users/:id` route with `UuidParamSchema` validation in `src/modules/users/index.ts`

**Checkpoint**: `DELETE /users/:id` is fully functional. All 5 user stories are complete
and independently verified.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full codebase compiles, is consistently formatted, and all tests
pass as a whole.

- [x] T032 [P] Run `npm run build` and resolve any TypeScript compilation errors across all modified files
- [x] T033 [P] Run `npm run format:check` and fix formatting issues in all modified files with `npm run format`
- [x] T034 Run `npm test` and confirm all 5 user stories' acceptance scenarios pass with no failures

**Final Checkpoint**: All 34 tasks complete. Feature `001-user-crud` is ready for review.

---

## Dependencies

### Story Completion Order (sequential by priority)

```
Foundational (T002â€“T006)
      â”‚
      â–¼
   US1 (T007â€“T011)  â† MVP
      â”‚
      â–¼
   US2 (T012â€“T016)
      â”‚
      â–¼
   US3 (T017â€“T021)
      â”‚
      â–¼
   US4 (T022â€“T026)
      â”‚
      â–¼
   US5 (T027â€“T031)
      â”‚
      â–¼
Polish (T032â€“T034)
```

### Parallel Opportunities per Story

Each story follows the same internal pattern:

```
[Test unit] [P]â”€â”€â”
                  â”œâ”€â”€â–º [Implement service] â”€â”€â–º [Implement controller] â”€â”€â–º [Register route]
[Test integ] [P]â”€â”€â”˜
```

Within the Foundational phase:

```
T002b (independent â€” already complete)
T002 â”€â”€â–º T003 [P] â”€â”€â”
         T004 [P] â”€â”€â”´â”€â”€â–º T005 â”€â”€â–º T006
```

---

## Summary

| Phase         | Tasks             | Count  |
| ------------- | ----------------- | ------ |
| Phase 1       | T001              | 1      |
| Phase 2       | T002â€“T006 + T002b | 6      |
| Phase 3 (US1) | T007â€“T011         | 5      |
| Phase 4 (US2) | T012â€“T016         | 5      |
| Phase 5 (US3) | T017â€“T021         | 5      |
| Phase 6 (US4) | T022â€“T026         | 5      |
| Phase 7 (US5) | T027â€“T031         | 5      |
| Phase 8       | T032â€“T034         | 3      |
| **Total**     |                   | **35** |

### Test Coverage per Story

| Story | Unit tests file                           | Integration tests file                   |
| ----- | ----------------------------------------- | ---------------------------------------- |
| US1   | `test/modules/users/user-service.test.ts` | `test/modules/users/create-user.test.ts` |
| US2   | `test/modules/users/user-service.test.ts` | `test/modules/users/get-user.test.ts`    |
| US3   | `test/modules/users/user-service.test.ts` | `test/modules/users/list-users.test.ts`  |
| US4   | `test/modules/users/user-service.test.ts` | `test/modules/users/update-user.test.ts` |
| US5   | `test/modules/users/user-service.test.ts` | `test/modules/users/delete-user.test.ts` |

### Parallel Opportunities

- T003 and T004 within Foundational phase
- Test tasks (unit + integration) within each story: 5 pairs total
- T032 and T033 in Polish phase

**Total parallelizable task pairs**: 7

### Independent Test Criteria per Story

| Story | Pass Condition                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------ |
| US1   | POST /users â†’ 201 + data envelope; duplicate email â†’ 409; missing field â†’ 400                          |
| US2   | GET /users/:id â†’ 200 + data envelope; unknown id â†’ 404; non-UUID path â†’ 400                            |
| US3   | GET /users â†’ 200 + data array; empty store â†’ empty array                                               |
| US4   | PATCH /users/:id â†’ 200 + updated fields only; empty body â†’ 400; role not changed; email conflict â†’ 409 |
| US5   | DELETE /users/:id â†’ 204; subsequent GET â†’ 404; unknown id â†’ 404                                        |

### Implementation Strategy

**MVP scope**: Complete Phase 1 â†’ Phase 2 â†’ Phase 3 (US1 only). This delivers a working
`POST /users` endpoint with full test coverage and proves the end-to-end architecture.

**Incremental delivery**: Each phase (Phase 3 through Phase 7) adds one complete, independently
testable slice. Stories can be demonstrated to stakeholders one at a time as they complete.
