# Implementation Plan: Company Entity

**Branch**: `002-company-entity` | **Date**: 2026-05-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-company-entity/spec.md`

## Summary

Build a full CRUD REST API for the `Company` entity at `/company`: create, retrieve by ID,
list all, partial update (PATCH semantics), and delete with ownership guard and employee
cascade. Runtime validation uses **Zod** — FQDN regex for `customDomain`, UUID for path
params and `ownerUserId`, trimming for `companyName`. The `CompanyService` takes both
`ICompanyRepository` and `IUserRepository` as constructor dependencies to support ownership
validation (role = OWNER check) and cascade deletion (clear `companyId` on all associated
users). A new `ForbiddenError` (HTTP 403) is added to `src/shared/errors/`. All tests are
written before production code (TDD); Vitest + Supertest; all tests must pass.

## Technical Context

**Language/Version**: TypeScript 6.x — strict mode (`tsconfig.json`)

**Primary Dependencies**: Express 5.x · Zod 4.x · Vitest 4.x · Supertest 7.x

**Storage**: In-memory array — `companyDatabase` added to `src/shared/database/mock-database.ts`

**Testing**: Vitest + Supertest (integration tests per endpoint) + Vitest unit tests for service layer

**Target Platform**: Node.js LTS

**Project Type**: web-service (REST API)

**Performance Goals**: p99 ≤ 500 ms per endpoint under sequential test load

**Constraints**: No authentication · delete ownership verified via `callerId` in request body · FQDN format enforced by Zod regex · no pagination · no real database

**Scale/Scope**: MVP — in-memory, no concurrency guarantees

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| Principle                        | Gate                                                                                                                             | Status                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| I — Clean Code                   | Every function has a single responsibility; no commented-out code; intention-revealing names                                     | ✅ PASS — module structure and service/controller split enforces separation                                               |
| II — Test-First (NON-NEGOTIABLE) | Unit tests written and failing before implementation; failing suite blocks merge                                                 | ✅ PASS — TDD workflow mandated; all 6 test files written before production code                                          |
| III — Modular Architecture       | Feature lives in `src/modules/companies/`; single entry point `index.ts`; controller thin; service holds logic; no circular deps | ✅ PASS — mirrors existing `users/` layout; `IUserRepository` injected (not `UserService`) to avoid circular dep          |
| IV — Type Safety                 | No `any`; explicit types everywhere; Zod validates HTTP boundary; errors via `AppError` subclasses                               | ✅ PASS — Zod schemas cover all inputs; `ForbiddenError` extends `AppError`                                               |
| V — DB Agnosticism               | All data access behind repository interface; mock swappable without touching service                                             | ✅ PASS — `ICompanyRepository` interface defined; `MockCompanyRepository` implements it; `companyDatabase` in shared mock |

**All gates pass.**

## Project Structure

### Documentation (this feature)

```text
specs/002-company-entity/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── companies.md     # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app.ts                              # MODIFIED: register companiesRouter at /company
├── modules/
│   └── companies/
│       ├── index.ts                    # NEW: Express Router — 5 endpoints
│       ├── company-controller.ts       # NEW: thin — parse → delegate → respond
│       ├── company-entity.ts           # NEW: ICompany interface
│       ├── company-repository.ts       # NEW: ICompanyRepository interface + MockCompanyRepository
│       ├── company-schemas.ts          # NEW: Zod schemas for all operations
│       └── company-service.ts          # NEW: business logic (CRUD + cascade + ownership)
└── shared/
    ├── database/
    │   └── mock-database.ts            # MODIFIED: add companyDatabase + extend clearDatabase()
    └── errors/
        └── forbidden-error.ts          # NEW: ForbiddenError extends AppError (HTTP 403)

test/
└── modules/
    └── companies/
        ├── company-service.test.ts     # NEW: unit tests for service layer
        ├── create-company.test.ts      # NEW: integration — POST /company
        ├── get-company.test.ts         # NEW: integration — GET /company/:id
        ├── list-companies.test.ts      # NEW: integration — GET /company
        ├── update-company.test.ts      # NEW: integration — PATCH /company/:id
        └── delete-company.test.ts      # NEW: integration — DELETE /company/:id
```

**Structure Decision**: Single project — all source under `src/`, tests under `test/` mirroring
`src/`. No new top-level directories required. Feature module `src/modules/companies/` follows
the exact same five-file layout as `src/modules/users/`.

## Complexity Tracking

> No Constitution violations — complexity tracking not required.
