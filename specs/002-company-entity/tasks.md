---
description: 'Task list for Company Entity feature implementation'
---

# Tasks: Company Entity

**Input**: Design documents from `specs/002-company-entity/`

**Branch**: `002-company-entity` | **Date**: 2026-05-27 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

**Tests**: MANDATORY (Constitution — Principle II). Every user story includes unit tests
(service layer) and integration tests (controller/routes via Supertest). Test tasks are
written **before** implementation — TDD workflow enforced.

## Format: `[ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story label — [US1] through [US5]
- No story label for Setup, Foundational, and Polish phases

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared infrastructure additions required before any company-specific code is
written. All three tasks target different files and can be executed in parallel.

- [X] T001 [P] Add `ForbiddenError` class extending `AppError` with status 403 in `src/shared/errors/forbidden-error.ts`
- [X] T002 [P] Extend `src/shared/database/mock-database.ts` — add `companyDatabase: ICompany[]` export and extend `clearDatabase()` to also splice the company array (import `ICompany` from `src/modules/companies/company-entity.ts`)
- [X] T003 [P] Register `companiesRouter` at `/company` in `src/app.ts` (import from `src/modules/companies`)

**Checkpoint**: Shared infrastructure ready. ForbiddenError is available, both databases
clear on `clearDatabase()`, and `/company` is routed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, validation schemas, repository, service skeleton, and router
wiring that every user story depends on. No method implementations yet — skeletons only.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Define `ICompany` interface in `src/modules/companies/company-entity.ts` — fields: `id`, `companyName`, `customDomain`, `ownerUserId`
- [X] T005 [P] Define `CreateCompanySchema`, `UpdateCompanySchema`, `DeleteCompanySchema`, and `UuidParamSchema` with Zod in `src/modules/companies/company-schemas.ts` — FQDN regex constant, `.toLowerCase()` on domain, `.trim()` on name, `.partial().refine()` for update, UUID for `ownerUserId` and `callerId`
- [X] T006 [P] Define `ICompanyRepository` interface and implement `MockCompanyRepository` class backed by `companyDatabase` in `src/modules/companies/company-repository.ts` — methods: `create`, `findById`, `findByDomain`, `findAll`, `update`, `delete`
- [X] T007 Create `CompanyService` class in `src/modules/companies/company-service.ts` — constructor accepts `ICompanyRepository` and `IUserRepository`; declare all five method signatures with `throw new Error('not implemented')` bodies
- [X] T008 Create `CompanyController` class in `src/modules/companies/company-controller.ts` — constructor accepts `CompanyService`; declare all five handler properties; wire `companiesRouter` with DI in `src/modules/companies/index.ts`

**Dependency**: T005 and T006 are [P] — both depend only on T004. T007 depends on T005 and
T006. T008 depends on T007.

**Checkpoint**: Foundation complete. All five user story phases can now proceed in order.

---

## Phase 3: User Story 1 — Register a New Company (Priority: P1) 🎯 MVP

**Goal**: `POST /company` — register a company; system generates UUID; validates FQDN
format, domain uniqueness, and ownerUserId existence + role; returns
`{ "data": { ...company } }` with HTTP 201.

**Independent Test**: Send a valid creation request → assert UUID, all provided fields,
HTTP 201. Send duplicate domain → HTTP 409. Send non-existent ownerUserId → HTTP 404.
Send ownerUserId with role ≠ OWNER → HTTP 400. Send invalid FQDN → HTTP 400.
Send missing field → HTTP 400.

### Tests for User Story 1

> **Write these tests FIRST — ensure they FAIL before writing any implementation**

- [X] T009 [P] [US1] Write failing unit tests for `CompanyService.createCompany` covering all 6 acceptance scenarios in `test/modules/companies/company-service.test.ts` — valid creation, duplicate domain (409), owner not found (404), owner role ≠ OWNER (400)
- [X] T010 [P] [US1] Create `test/modules/companies/create-company.test.ts` with integration tests for `POST /company` covering all 6 acceptance scenarios — data envelope, HTTP 201/400/404/409, FQDN format rejection

### Implementation for User Story 1

- [X] T011 [US1] Implement `CompanyService.createCompany` in `src/modules/companies/company-service.ts` — lowercase domain uniqueness check (`DuplicatedItemError`), ownerUserId existence check (`NotFoundError`), ownerUserId role = OWNER check (`BadRequestError`), UUID generation, persist and return
- [X] T012 [US1] Implement `createCompany` handler in `src/modules/companies/company-controller.ts` — parse body with `CreateCompanySchema`, delegate to service, respond with `{ data: company }` and HTTP 201
- [X] T013 [US1] Register `POST /company` route in `src/modules/companies/index.ts`

**Dependency within story**: T009 and T010 are [P]. T011 depends on T009 being red (TDD).
T012 depends on T011. T013 depends on T012.

**Checkpoint**: `POST /company` fully functional. All unit and integration tests pass.
User Story 1 independently verified and deliverable as MVP.

---

## Phase 4: User Story 2 — Retrieve a Company by ID (Priority: P2)

**Goal**: `GET /company/:id` — return a single company by UUID as
`{ "data": { ...company } }` with HTTP 200; HTTP 404 for unknown ID;
HTTP 400 for invalid UUID format.

**Independent Test**: Create a company via POST → fetch by returned UUID → assert all four
fields match and HTTP 200. Fetch non-existent UUID → HTTP 404. Fetch with non-UUID string
as `:id` → HTTP 400.

### Tests for User Story 2

> **Write these tests FIRST — ensure they FAIL before writing any implementation**

- [X] T014 [P] [US2] Add failing unit tests for `CompanyService.getCompanyById` in `test/modules/companies/company-service.test.ts` — found (200), not found (404)
- [X] T015 [P] [US2] Create `test/modules/companies/get-company.test.ts` with integration tests for `GET /company/:id` — data envelope, 200/404/400 (invalid UUID)

### Implementation for User Story 2

- [X] T016 [US2] Implement `CompanyService.getCompanyById` in `src/modules/companies/company-service.ts` — lookup by id, throw `NotFoundError` if absent
- [X] T017 [US2] Implement `getCompanyById` handler in `src/modules/companies/company-controller.ts` — parse params with `UuidParamSchema`, respond with `{ data: company }` and HTTP 200
- [X] T018 [US2] Register `GET /company/:id` route in `src/modules/companies/index.ts`

**Checkpoint**: `GET /company/:id` fully functional. Unit and integration tests pass.

---

## Phase 5: User Story 3 — List All Companies (Priority: P3)

**Goal**: `GET /company` — return all registered companies as `{ "data": [ ...companies ] }`
with HTTP 200; empty array when no companies exist.

**Independent Test**: Create multiple companies → request list → assert all appear with
HTTP 200. Clear store → request list → assert empty array with HTTP 200.

### Tests for User Story 3

> **Write these tests FIRST — ensure they FAIL before writing any implementation**

- [X] T019 [P] [US3] Add failing unit tests for `CompanyService.getAllCompanies` in `test/modules/companies/company-service.test.ts` — non-empty list, empty list
- [X] T020 [P] [US3] Create `test/modules/companies/list-companies.test.ts` with integration tests for `GET /company` — data envelope, populated list, empty list (HTTP 200 both)

### Implementation for User Story 3

- [X] T021 [US3] Implement `CompanyService.getAllCompanies` in `src/modules/companies/company-service.ts` — return full array from repository
- [X] T022 [US3] Implement `listCompanies` handler in `src/modules/companies/company-controller.ts` — respond with `{ data: companies }` and HTTP 200
- [X] T023 [US3] Register `GET /company` route in `src/modules/companies/index.ts`

**Checkpoint**: `GET /company` fully functional. Unit and integration tests pass.

---

## Phase 6: User Story 4 — Update a Company (Priority: P4)

**Goal**: `PATCH /company/:id` — partially update mutable fields (companyName, customDomain,
ownerUserId); empty body → HTTP 400; domain conflict → HTTP 409; ownerUserId role ≠ OWNER →
HTTP 400; unknown id or ownerUserId → HTTP 404; returns `{ "data": { ...updatedCompany } }`
with HTTP 200.

**Independent Test**: Create a company → PATCH with new name → assert only name changed,
HTTP 200. PATCH with conflicting domain → HTTP 409. PATCH with ownerUserId whose role is
not OWNER → HTTP 400. PATCH with empty body → HTTP 400.

### Tests for User Story 4

> **Write these tests FIRST — ensure they FAIL before writing any implementation**

- [X] T024 [P] [US4] Add failing unit tests for `CompanyService.updateCompany` in `test/modules/companies/company-service.test.ts` — all 6 acceptance scenarios: name-only change, domain conflict, non-existent ownerUserId, ownerUserId role ≠ OWNER, company not found, invalid domain format
- [X] T025 [P] [US4] Create `test/modules/companies/update-company.test.ts` with integration tests for `PATCH /company/:id` — all 6 acceptance scenarios including partial update semantics (omitted fields unchanged)

### Implementation for User Story 4

- [X] T026 [US4] Implement `CompanyService.updateCompany` in `src/modules/companies/company-service.ts` — company lookup, conditional domain uniqueness check (excluding self), conditional ownerUserId existence + role check, PATCH merge, persist and return
- [X] T027 [US4] Implement `updateCompany` handler in `src/modules/companies/company-controller.ts` — parse params with `UuidParamSchema`, parse body with `UpdateCompanySchema`, respond with `{ data: company }` and HTTP 200
- [X] T028 [US4] Register `PATCH /company/:id` route in `src/modules/companies/index.ts`

**Checkpoint**: `PATCH /company/:id` fully functional. All 6 acceptance scenarios verified.

---

## Phase 7: User Story 5 — Delete a Company (Priority: P5)

**Goal**: `DELETE /company/:id` — remove a company; verify `callerId === ownerUserId`
(HTTP 403 if mismatch); cascade: clear `companyId` on all associated employee users;
HTTP 204 on success; HTTP 404 for unknown UUID; HTTP 400 for invalid UUID or callerId format.

**Independent Test**: Create a company with employees → delete by UUID with correct
callerId → HTTP 204 → assert company gone (404) → assert employees' companyId is
undefined. Delete with non-owner callerId → HTTP 403.

### Tests for User Story 5

> **Write these tests FIRST — ensure they FAIL before writing any implementation**

- [X] T029 [P] [US5] Add failing unit tests for `CompanyService.deleteCompany` in `test/modules/companies/company-service.test.ts` — success with cascade, non-owner callerId (403), company not found (404)
- [X] T030 [P] [US5] Create `test/modules/companies/delete-company.test.ts` with integration tests for `DELETE /company/:id` — all 4 acceptance scenarios: owner deletes (204), employees cleared after delete, non-owner callerId (403), company not found (404)

### Implementation for User Story 5

- [X] T031 [US5] Implement `CompanyService.deleteCompany` in `src/modules/companies/company-service.ts` — company lookup (`NotFoundError`), callerId ownership check (`ForbiddenError`), delete company, cascade: find all users with `companyId === id` and call `userRepository.update(userId, { companyId: undefined })` for each
- [X] T032 [US5] Implement `deleteCompany` handler in `src/modules/companies/company-controller.ts` — parse params with `UuidParamSchema`, parse body with `DeleteCompanySchema`, delegate to service, respond HTTP 204 with no body
- [X] T033 [US5] Register `DELETE /company/:id` route in `src/modules/companies/index.ts`

**Checkpoint**: `DELETE /company/:id` fully functional. Cascade verified. All 5 user stories
complete and independently verified.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full codebase compiles, is consistently formatted, and all tests
pass as a complete suite.

- [X] T034 [P] Run `npm run build` and resolve any TypeScript compilation errors across all new and modified files
- [X] T035 [P] Run `npm run format:check` and fix any formatting issues with `npm run format` across all new and modified files
- [X] T036 Run `npm test` and confirm all 5 user story acceptance scenarios pass with no failures

**Final Checkpoint**: All 36 tasks complete. Feature `002-company-entity` is ready for review.

---

## Dependency Graph

```
T001 ─┐
T002 ─┼─ (all parallel) ─► T004 ─► T005 ─┐
T003 ─┘                           T006 ─┤─► T007 ─► T008 ─► stories in order
                                               │
                               US1: T009,T010 ─► T011 ─► T012 ─► T013
                               US2: T014,T015 ─► T016 ─► T017 ─► T018
                               US3: T019,T020 ─► T021 ─► T022 ─► T023
                               US4: T024,T025 ─► T026 ─► T027 ─► T028
                               US5: T029,T030 ─► T031 ─► T032 ─► T033
                                                                       │
                                                    T034,T035 (parallel)─► T036
```

## Parallel Execution Per Story

Within each user story phase, the two test tasks ([P]) can be written simultaneously
since they target different files:

| Story | Parallel pair | Then sequential    |
| ----- | ------------- | ------------------ |
| US1   | T009 ∥ T010   | T011 → T012 → T013 |
| US2   | T014 ∥ T015   | T016 → T017 → T018 |
| US3   | T019 ∥ T020   | T021 → T022 → T023 |
| US4   | T024 ∥ T025   | T026 → T027 → T028 |
| US5   | T029 ∥ T030   | T031 → T032 → T033 |

## Implementation Strategy

**MVP scope** (minimum to demonstrate value): Phase 1 + Phase 2 + Phase 3 (US1 only) —
POST /company is functional and tested.

**Recommended delivery order**: US1 → US2 → US3 (read operations) → US4 (update) →
US5 (delete with cascade — most complex).

**Most complex task**: T031 — cascade delete requires cross-repository orchestration via
`IUserRepository`; write comprehensive unit tests in T029 before touching it.
