# Implementation Plan: User CRUD

**Branch**: `001-user-crud` | **Date**: 2026-05-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-user-crud/spec.md`

## Summary

Build a full CRUD REST API for the `User` entity: create, retrieve by ID, list all, partial
update (PATCH semantics), and delete. Runtime validation uses **Zod**; data is persisted in
the existing in-memory mock for this iteration. Unit tests are mandatory and written before
any production code (TDD). The five user stories are ordered by priority (P1→P5) and can be
developed and tested independently. Existing test files (`create-user.test.ts`,
`get-user.test.ts`) must be rewritten to align with the new spec — they reference outdated
field names (`startDate`, `status`) and roles (`Admin`) that are no longer valid.

## Technical Context

**Language/Version**: TypeScript 6.x — strict mode (`tsconfig.json`)

**Primary Dependencies**: Express 5.x · Zod 4.x (already in `dependencies`) · Vitest 4.x · Supertest 7.x (already in `devDependencies`)

**Storage**: In-memory array — `src/shared/database/mock-database.ts` — no real database for this iteration

**Testing**: Vitest · unit tests for service layer · integration-style tests for controller/routes via Supertest

**Target Platform**: Node.js LTS — local development and CI

**Project Type**: web-service (REST API)

**Performance Goals**: p99 ≤ 500 ms per endpoint under sequential development/test load

**Constraints**: No authentication · no pagination · no real database · `companyId` stored as opaque string without referential integrity

**Scale/Scope**: MVP — single in-memory module; no concurrency guarantees required

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| Principle                        | Gate                                                                                                                                           | Status                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| I — Clean Code                   | Every function/method has a single responsibility; no commented-out code committed                                                             | ✅ PASS — module structure enforces separation                       |
| II — Test-First (NON-NEGOTIABLE) | Unit tests written and failing before implementation; suite blocks merge                                                                       | ✅ PASS — user confirmed unit tests mandatory; TDD workflow in tasks |
| III — Modular Architecture       | Feature lives in `src/modules/users/`; single entry point `index.ts`; controllers thin; services hold logic                                    | ✅ PASS — existing scaffold matches required layout                  |
| IV — Type Safety                 | No `any`; explicit types on all functions; Zod validates HTTP boundary; `process.env` only via config module; errors via `AppError` subclasses | ✅ PASS — Zod chosen explicitly for boundary validation              |
| V — DB Agnosticism               | All data access behind repository interface; mock swappable without touching service or controller                                             | ✅ PASS — `IUserRepository` interface planned; mock implements it    |

**All gates pass. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/001-user-crud/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── users.md         # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app.ts                          # Express setup — register users router + error handler
├── index.ts                        # Entrypoint (no changes)
├── modules/
│   └── users/
│       ├── index.ts                # Express Router — mounts all 5 endpoints
│       ├── user-controller.ts      # Thin: parse → delegate to service → respond
│       ├── user-entity.ts          # IUser interface, UserRole enum
│       ├── user-repository.ts      # IUserRepository interface + MockUserRepository impl
│       ├── user-schemas.ts         # Zod schemas: CreateUserSchema, UpdateUserSchema, UuidParamSchema
│       └── user-service.ts         # Business logic: all 5 CRUD operations
└── shared/
    ├── config/                     # (unchanged)
    ├── database/
    │   └── mock-database.ts        # In-memory array + clearDatabase() (unchanged)
    ├── errors/
    │   ├── app-error.ts            # (unchanged)
    │   ├── bad-request-error.ts    # (unchanged)
    │   ├── duplicated-item-error.ts# (unchanged)
    │   └── not-found-error.ts      # (unchanged)
    └── middlewares/
        └── error-handler.ts        # (unchanged)

test/
└── modules/
    └── users/
        ├── create-user.test.ts     # Rewritten to align with spec (integration via Supertest)
        ├── get-user.test.ts        # Rewritten to align with spec (integration via Supertest)
        ├── list-users.test.ts      # New integration test
        ├── update-user.test.ts     # New integration test
        ├── delete-user.test.ts     # New integration test
        └── user-service.test.ts    # New unit tests for service layer
```

**Structure Decision**: Single project — all source under `src/`, tests under `test/` mirroring
`src/` tree. No new top-level directories required. Feature module `src/modules/users/` gains
one new file (`user-schemas.ts`) that co-locates all Zod validation schemas with the module.
