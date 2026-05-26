<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0  (initial ratification)
Modified principles: N/A — first version
Added sections: Core Principles (I–V), Tech Stack & Constraints, Development Workflow, Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ aligned (Constitution Check gates map to principles I–V)
  - .specify/templates/spec-template.md ✅ aligned (User Stories & Testing section mandatory per Principle II)
  - .specify/templates/tasks-template.md ⚠ pending — "Tests are OPTIONAL" note must be removed; tests are MANDATORY per Principle II
Follow-up TODOs:
  - tasks-template.md: remove the sentence "Tests: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested"
  - Database adapter (Principle V) must be defined once a DB technology is chosen
-->

# Portal Project Constitution

## Core Principles

### I. Clean Code

Every unit of code MUST have a single, clearly stated responsibility.
Functions and methods MUST be short, doing exactly one thing; if a function needs a comment
to explain what it does, it MUST be refactored.
Names (variables, functions, classes, files) MUST be meaningful and intention-revealing —
abbreviations and cryptic identifiers are prohibited.
Dead code, commented-out blocks, and duplicated logic MUST NOT be committed.
Code MUST be written to be read by humans first; optimise for clarity over cleverness.

### II. Test-First Development (NON-NEGOTIABLE)

TDD is mandatory. The Red-Green-Refactor cycle MUST be followed:
tests are written and reviewed BEFORE any implementation code is produced.
No production code may be merged without a corresponding test that drove its creation.
Every user story MUST have at least one acceptance-level test (integration or e2e)
and unit tests for all non-trivial business logic.
Tests MUST serve as living documentation of expected behaviour; test names MUST describe
the scenario in plain language.
A failing test suite blocks merging unconditionally.

### III. Modular Architecture (Feature-Based)

Source code MUST be organised by feature/domain module under `src/modules/`.
Each module MUST expose a single entry point (`index.ts`); internal files are private to
the module and MUST NOT be imported directly from outside.
Business logic lives exclusively in services; controllers and routers MUST remain thin
(input parsing, delegation, response formatting only).
Circular dependencies between modules are prohibited.
Shared utilities belong in `src/shared/` and MUST NOT contain domain logic.

### IV. Type Safety

The project runs TypeScript in strict mode. `any` is prohibited; use `unknown` when the
type is genuinely indeterminate and narrow it explicitly.
All function parameters and return types MUST be annotated explicitly.
Environment variables MUST be accessed only through the typed config module
(`src/shared/config/`); direct use of `process.env` in business logic is prohibited.
Custom error classes extending `AppError` MUST be used; throwing raw strings or plain
`Error` objects is prohibited.

### V. Database Agnosticism (Repository Pattern)

The database technology is not yet defined. All data access MUST be encapsulated behind
a repository interface defined in the domain module.
No framework-specific or driver-specific code may appear outside the repository layer.
The current in-memory mock (`src/shared/database/mock-database.ts`) is a temporary
placeholder; swapping it for a real database MUST require changes only inside the
repository implementations, never in services or controllers.
When a database is chosen, a migration strategy MUST be defined before any production
data is written.

## Tech Stack & Constraints

- **Runtime**: Node.js (LTS)
- **Language**: TypeScript — strict mode enforced via `tsconfig.json`
- **Framework**: Express
- **Test runner**: Vitest
- **Formatter**: Prettier (single quotes, semicolons, 2-space indent)
- **Database**: Not yet defined — repository pattern abstracts the choice (see Principle V)
- **Build output**: `dist/` — source in `src/`
- **Environment secrets**: never committed; loaded via the typed config module only

## Development Workflow

1. Write failing tests that describe the desired behaviour (Principle II).
2. Implement the minimum code to make the tests pass (Principle I).
3. Refactor under green tests — clean up names, duplication, structure (Principles I & III).
4. Open a PR; the pipeline MUST pass (`npm run build`, `npm test`, `npm run format:check`)
   before any merge is permitted.
5. Reviewers MUST verify compliance with all five principles before approving.

New modules MUST mirror the existing structure:
`src/modules/<feature>/index.ts`, `<feature>-controller.ts`, `<feature>-service.ts`,
`<feature>-repository.ts`, `<feature>-entity.ts`.

Test files live under `test/` mirroring the `src/` tree.

## Governance

This constitution supersedes all other written or verbal coding conventions for this
project. Amendments require:

1. A written proposal describing the change and its rationale.
2. Explicit versioning increment (MAJOR / MINOR / PATCH — see versioning policy below).
3. Propagation to all affected templates and documentation before the amendment is merged.

**Versioning policy**:

- MAJOR — removes or redefines an existing principle in a backward-incompatible way.
- MINOR — adds a new principle or materially expands an existing one.
- PATCH — clarifications, wording fixes, non-semantic refinements.

All PRs MUST include a Constitution Check section in the plan confirming compliance with
Principles I–V. Any deliberate deviation requires an explicit exception recorded in the PR
description and ratified by the team.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-05-18
