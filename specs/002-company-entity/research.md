# Research: Company Entity

**Phase**: 0 — Outline & Research
**Date**: 2026-05-26
**Feature**: [spec.md](spec.md) · [plan.md](plan.md)

## 1. Zod v4 — FQDN Validation

**Decision**: Custom regex via `z.string().regex(FQDN_REGEX).toLowerCase()`.

```ts
const FQDN_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const CreateCompanySchema = z.object({
  customDomain: z.string().regex(FQDN_REGEX).toLowerCase(),
  // ...
});
```

**Rationale**: Zod v4's `z.string().url()` validates full URLs (requires protocol), which is
not what we need — we want a bare hostname like `xyz.portal.com`. A custom regex is the only
idiomatic option. The regex enforces: each label starts/ends with alphanumeric, may contain
hyphens in the middle (max 63 chars per label), at least one dot, TLD is alpha-only and
2+ chars. The `.toLowerCase()` chain normalises the value at parse time, satisfying the
case-insensitive uniqueness requirement (FR-003 + Assumption in spec).

**Alternatives considered**:

- `z.string().url()` — rejected: requires `https://` prefix; not suitable for bare hostname.
- Manual `.transform()` for lowercase — rejected: `.toLowerCase()` is the idiomatic Zod v4 API.

---

## 2. Zod v4 — PATCH Schema (at least one field required)

**Decision**: Reuse the `.partial().refine()` pattern established in `user-schemas.ts`.

```ts
const UpdateCompanyBaseSchema = z.object({
  companyName: z.string().min(1).trim(),
  customDomain: z.string().regex(FQDN_REGEX).toLowerCase(),
  ownerUserId: z.string().uuid(),
});

export const UpdateCompanySchema = UpdateCompanyBaseSchema.partial().refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: 'At least one field must be provided' },
);
```

**Rationale**: Identical justification to the user-schemas approach — `.partial()` makes all
fields optional and `.refine()` ensures an empty body is rejected with HTTP 400.

---

## 3. Delete Ownership Check — Caller Identity Without Auth

**Decision**: Accept `callerId` (UUID) in the DELETE request body; validate via Zod; service
checks `callerId === company.ownerUserId`.

```ts
export const DeleteCompanySchema = z.object({
  callerId: z.string().uuid(),
});
```

**Rationale**: The system has no authentication layer in this iteration. Passing the caller
identity in the request body is the simplest mechanism that keeps the check inside the
service layer, is easily testable, and maps cleanly to a real JWT `sub` claim once auth is
introduced — the controller will simply swap `req.body.callerId` for a decoded token value.

**Alternatives considered**:

- `X-Caller-Id` header — rejected: Zod does not validate headers in the same pipeline as
  body/params; requires separate parsing logic and more boilerplate for an MVP.
- Query parameter — rejected: caller identity in a query string is unusual and leaks
  identifiers into server access logs.

---

## 4. ForbiddenError — HTTP 403 Error Class

**Decision**: Add `ForbiddenError` to `src/shared/errors/` following the existing pattern.

```ts
// src/shared/errors/forbidden-error.ts
import { AppError } from './app-error';

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}
```

**Rationale**: The project already has `BadRequestError` (400), `DuplicatedItemError` (409),
and `NotFoundError` (404) — all following the same pattern of extending `AppError` with a
fixed status code. `ForbiddenError` is the natural addition for FR-012. The existing
`errorHandler` middleware already serialises any `AppError` subclass correctly, so no
middleware changes are required.

---

## 5. Cross-Module Dependency — UserRepository in CompanyService

**Decision**: Inject `IUserRepository` as a second constructor parameter of `CompanyService`.

```ts
export class CompanyService {
  constructor(
    private readonly repository: ICompanyRepository,
    private readonly userRepository: IUserRepository,
  ) {}
}
```

**Rationale**: Two operations require cross-module access to User data:

1. **Create / Update** — must verify `ownerUserId` exists AND has `role = OWNER`.
2. **Delete (cascade)** — must clear `companyId` on all employees of the deleted company.

Injecting `IUserRepository` keeps both repositories behind their interfaces (Constitution
Principle V) and avoids any direct import of the mock implementation in the service.
The `companies/index.ts` router wires both repositories at startup — mirroring how
`users/index.ts` wires `MockUserRepository` into `UserService`.

**Alternatives considered**:

- Importing `UserService` into `CompanyService` — rejected: services importing other
  services creates bidirectional coupling and risks circular dependency. Accessing the
  repository directly is the lower-level, safer option.
- Event / pub-sub cascade — rejected: over-engineered for an in-memory MVP with no
  async infrastructure.

---

## 6. Mock Database Extension Strategy

**Decision**: Add `companyDatabase: ICompany[]` to `src/shared/database/mock-database.ts`
and extend `clearDatabase()` to wipe it alongside the user array.

```ts
// src/shared/database/mock-database.ts
import { IUser } from '../../modules/users/user-entity';
import { ICompany } from '../../modules/companies/company-entity';

export const database: IUser[] = [];
export const companyDatabase: ICompany[] = [];

export function clearDatabase(): void {
  database.splice(0, database.length);
  companyDatabase.splice(0, companyDatabase.length);
}
```

**Rationale**: All existing test `afterEach` hooks call `clearDatabase()` — extending it to
also clear company data means no test file needs modification. The pattern is already
established (database.ts already imports from a domain module), so adding a second import
is consistent. Replacing the entire file with a generic store would require touching every
repository, which is out of scope.

**Alternatives considered**:

- Module-level array inside `MockCompanyRepository` + export `clearCompanyDatabase()` —
  rejected: every test file for companies would need to import and call it manually,
  fragmenting the teardown logic.
- Generic typed store — rejected: premature abstraction for a mock that will be replaced
  by a real database adapter.

---

## 7. companyName — Whitespace Handling

**Decision**: Use `z.string().min(1).trim()` in Zod schema.

**Rationale**: Spec edge case states "companyName with leading/trailing whitespace should be
trimmed before storage". Zod v4's `.trim()` applies the transformation at parse time,
requiring no manual string handling in the service.
