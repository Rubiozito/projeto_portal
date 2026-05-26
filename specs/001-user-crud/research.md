# Research: User CRUD

**Phase**: 0 — Outline & Research
**Date**: 2026-05-22
**Feature**: [spec.md](spec.md) · [plan.md](plan.md)

## 1. Zod v4 — PATCH Schema (at least one field required)

**Decision**: Use `.partial().refine()` on the update schema.

```ts
// Option chosen — checks for any non-undefined value
schema
  .partial()
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided',
  });
```

**Rationale**: `.partial()` makes all fields optional. The `.refine()` guard ensures an
empty body is rejected with HTTP 400 (FR-007 + US4 Scenario 7). `Object.values(...).some(...)`
is preferred over `Object.keys(...).length > 0` because it handles explicitly-undefined
values correctly.

**Alternative considered**: Zod discriminated unions per operation type — rejected as
over-engineered for a simple PATCH with three optional fields.

---

## 2. Zod v4 — Email Normalization to Lowercase

**Decision**: Use the built-in `.toLowerCase()` chain method.

```ts
z.string().email().toLowerCase();
```

**Rationale**: `.toLowerCase()` is the idiomatic Zod v4 API; it applies the transform
as part of the parse pipeline. Using `.transform(v => v.toLowerCase())` also works but
`.toLowerCase()` is more expressive and shorter. This satisfies FR-014 automatically
during schema parse — no manual lowercase call needed in the service.

---

## 3. Zod v4 — UUID Validation

**Decision**: Use `z.string().uuidv4()` for path parameter validation.

```ts
z.object({ id: z.string().uuidv4() });
```

**Rationale**: Zod v4 provides a `uuidv4()` shorthand that validates UUID v4 format
specifically. This rejects arbitrary strings and integers in `:id` path params, returning
HTTP 400 (US2 Scenario 3, US4 Scenario 6, US5 Scenario 2).

---

## 4. Zod v4 — Unknown Field Handling

**Decision**: Use the default `.strip()` behavior (unknown keys silently removed).

**Rationale**: Express with `express.json()` already parses JSON bodies; Zod strips extra
fields by default. This satisfies the edge case "How does the system handle extra/unknown
fields in a request body?" — they are silently dropped. Using `.strict()` would cause
HTTP 400 on any extra field, which is overly defensive for a non-public API at MVP stage.

---

## 5. Zod v4 Breaking Changes — Impact Assessment

| Area                                                             | Change                               | Impact on this feature                         |
| ---------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------- |
| `.refine()` type predicates                                      | No longer narrows output type        | None — we don't use type predicate refinements |
| `.refine()` `ctx.path` removed                                   | Cannot access path inside refinement | None — we use `.message` string only           |
| `.object().merge()` with refinements                             | Throws if receiver has refinements   | None — we don't use `.merge()`                 |
| `.partial()`, `.enum()`, `.string().email()`, `.string().uuid()` | No changes                           | Fully compatible                               |

**Verdict**: No breaking changes affect this feature.

---

## 6. Existing Tests — Required Rewrites

The two existing test files contain outdated field names and role values that conflict
with the new spec. Both **must be rewritten** (not patched) as the first task of the
implementation phase.

| File                                     | Problem                                                                                                                       | Resolution                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `test/modules/users/create-user.test.ts` | Uses `role: 'Admin'`, `startDate`, `status` — none exist in spec; expects `{ message: 'User created' }` not `{ data: {...} }` | Rewrite to use `role: 'OWNER'`, `creationDate`, `{ data: {...} }` envelope |
| `test/modules/users/get-user.test.ts`    | Same stale fields; accesses `database` directly via dynamic import                                                            | Rewrite with correct fields and `{ data: {...} }` response                 |

---

## 7. Express 5 — Async Error Handling

**Decision**: No `try/catch` wrappers in controllers. Throw from async route handlers
directly.

**Rationale**: Express 5 automatically forwards errors thrown in async route handlers
to the error middleware. The existing `errorHandler` middleware catches `AppError`
instances and returns `{ message: "..." }` with the correct status code. Controllers
stay thin: parse Zod result → call service → respond.

---

## 8. Repository Pattern — Interface Design

**Decision**: Define `IUserRepository` interface in `user-repository.ts`; implement
`MockUserRepository` in the same file backed by `mock-database.ts`.

**Rationale**: Constitution Principle V requires that no DB-specific code appears
outside the repository layer. The `MockUserRepository` wraps the in-memory array.
When a real DB is introduced, only the repository implementation changes — the service
receives the same interface. The service receives the repository via constructor
injection, making unit testing straightforward (inject a mock/stub).

**Interface sketch** (non-normative):

```ts
interface IUserRepository {
  create(user: IUser): IUser;
  findById(id: string): IUser | undefined;
  findByEmail(email: string): IUser | undefined;
  findAll(): IUser[];
  update(
    id: string,
    data: Partial<Pick<IUser, 'name' | 'email' | 'companyId'>>,
  ): IUser;
  delete(id: string): void;
}
```

---

## Summary of All Decisions

| #   | Decision                                                     | Rationale                                       |
| --- | ------------------------------------------------------------ | ----------------------------------------------- |
| 1   | PATCH schema: `.partial().refine(values.some !== undefined)` | Correct at-least-one guard for Zod v4           |
| 2   | Email lowercase: `.email().toLowerCase()`                    | Idiomatic Zod v4, satisfies FR-014              |
| 3   | UUID validation: `.uuidv4()`                                 | Specific UUID v4 guard, rejects bad path params |
| 4   | Unknown fields: `.strip()` (default)                         | Silent drop, not error; adequate for MVP        |
| 5   | No breaking Zod v4 changes                                   | All APIs used are stable                        |
| 6   | Rewrite both existing test files                             | Outdated model incompatible with spec           |
| 7   | Express 5 async errors: throw directly                       | No `try/catch` in controllers                   |
| 8   | `IUserRepository` + `MockUserRepository`                     | Constitution Principle V compliance             |
