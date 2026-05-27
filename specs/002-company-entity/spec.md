# Feature Specification: Company Entity

**Feature Branch**: `002-company-entity`

**Created**: 2026-05-26

**Status**: Draft

**Input**: User description: "Let's create the features for the Company entity. A Company it's in the portal to register and coordinate it's employees. A Company must have an owner user, multiple users of type employee can be associated with the company. The Company must have: id(UUID), companyName, customDomain (this will be the url for the multi-tenant, so company xyz can access it's application through it's own domain), ownerUserId."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Register a New Company (Priority: P1)

An owner user registers a new company in the portal, providing a company name and a custom
domain. The system generates a unique identifier, links the specified owner user, and stores
the company record. The new company is returned in the response.

**Why this priority**: Company creation is the foundational action — no employee association,
tenant routing, or company management is possible without an existing company record. It is
the entry point for all multi-tenant operations.

**Independent Test**: Can be fully tested by sending a valid creation request and asserting
that the response contains a company with a UUID, the provided companyName and customDomain,
the specified ownerUserId, and HTTP 201.

**Acceptance Scenarios**:

1. **Given** no company exists with the provided customDomain, **When** a creation request is sent with valid companyName, customDomain, and ownerUserId, **Then** a new company is returned with a UUID, all provided fields, and HTTP 201.
2. **Given** a company already exists with the provided customDomain, **When** a duplicate creation request is sent, **Then** the system rejects it with a conflict error (HTTP 409).
3. **Given** a creation request with a non-existent ownerUserId, **When** the request is processed, **Then** the system rejects it with a not-found error (HTTP 404).
4. **Given** a creation request with a missing mandatory field (companyName, customDomain, or ownerUserId), **When** the request is processed, **Then** the system rejects it with a validation error (HTTP 400).
5. **Given** a creation request with an invalid customDomain format (e.g., containing spaces or invalid characters), **When** the request is processed, **Then** the system rejects it with a validation error (HTTP 400).
6. **Given** a creation request where the referenced ownerUserId belongs to a user whose role is not `OWNER`, **When** the request is processed, **Then** the system rejects it with a validation error (HTTP 400).

---

### User Story 2 — Retrieve a Company by ID (Priority: P2)

A caller provides a company's UUID and receives the full company record, including its
name, custom domain, and owner reference.

**Why this priority**: Reading company data is required to support tenant resolution,
employee listing, and ownership verification across the application.

**Independent Test**: Can be fully tested by first creating a company, then fetching it by
the returned UUID and asserting all fields are present and match.

**Acceptance Scenarios**:

1. **Given** a company exists with a given UUID, **When** a retrieve request is sent with that UUID, **Then** the full company record is returned with HTTP 200.
2. **Given** no company exists with the given UUID, **When** a retrieve request is sent, **Then** the system returns a not-found error (HTTP 404).
3. **Given** the UUID provided is not a valid UUID format, **When** a retrieve request is sent, **Then** the system returns a validation error (HTTP 400).

---

### User Story 3 — List All Companies (Priority: P3)

A caller requests the full list of registered companies and receives an ordered collection
of company records.

**Why this priority**: Listing supports administrative views and multi-tenant tenant
discovery; it can be delivered independently as a complete operational slice.

**Independent Test**: Can be fully tested by creating multiple companies and asserting that
all of them appear in the list response with HTTP 200.

**Acceptance Scenarios**:

1. **Given** one or more companies exist, **When** a list request is sent, **Then** all companies are returned with HTTP 200.
2. **Given** no companies exist, **When** a list request is sent, **Then** an empty collection is returned with HTTP 200.

---

### User Story 4 — Update a Company (Priority: P4)

A caller sends a partial payload with one or more of the company's mutable fields
(companyName, customDomain, ownerUserId) following PATCH semantics — only the fields
present in the request are updated; omitted fields are preserved exactly as they are.

**Why this priority**: Mutation of company data is required for real-world operations such
as domain migration, rebranding, and ownership transfer, but is secondary to creation and
retrieval.

**Independent Test**: Can be fully tested in isolation by creating a company, sending a
partial update, and asserting that updated fields changed while omitted fields remain
unchanged.

**Acceptance Scenarios**:

1. **Given** a company exists, **When** an update request is sent with a new companyName, **Then** only the name is changed and all other fields remain unchanged, returning HTTP 200.
2. **Given** a company exists, **When** an update request is sent with a customDomain already in use by another company, **Then** the system rejects it with a conflict error (HTTP 409).
3. **Given** a company exists, **When** an update request is sent with a non-existent ownerUserId, **Then** the system rejects it with a not-found error (HTTP 404).
4. **Given** a company exists, **When** an update request is sent with an ownerUserId referencing a user whose role is not `OWNER`, **Then** the system rejects it with a validation error (HTTP 400).
5. **Given** no company exists with the given UUID, **When** an update request is sent, **Then** the system returns a not-found error (HTTP 404).
6. **Given** an update request with an invalid customDomain format, **When** the request is processed, **Then** the system rejects it with a validation error (HTTP 400).

---

### User Story 5 — Delete a Company (Priority: P5)

A caller provides a company's UUID and requests its removal from the system. Upon deletion,
all associated employees have their company association cleared (companyId set to undefined).

**Why this priority**: Deletion is the least frequent lifecycle operation and depends on
all other operations being stable. The cascade behavior on associated users makes it
functionally more complex than a simple remove.

**Independent Test**: Can be fully tested by creating a company, associating employees,
deleting the company, and asserting HTTP 204 on delete and that the employees' companyId is
null afterward.

**Acceptance Scenarios**:

1. **Given** a company exists with no associated employees, **When** a delete request is sent by the user registered as the owner of thecompany, **Then** the company is removed and the system returns HTTP 204.
2. **Given** a company exists with associated employees, **When** a delete request is sent, **Then** the company is removed, all employees have their companyId cleared, and the system returns HTTP 204.
3. **Given** no company exists with the given UUID, **When** a delete request is sent, **Then** the system returns a not-found error (HTTP 404).
4. **Given** a delete request is sent by a user who is not the owner of the company, **When** the request is processed, **Then** the system rejects it with a forbidden error (HTTP 403).

---

### Edge Cases

- What happens when the ownerUserId refers to a user who already owns another company? The system should allow a user to own multiple companies.
- What happens if a customDomain update conflicts with an existing domain during a concurrent request? The system must enforce uniqueness at the persistence layer.
- What happens when listing companies and none have associated employees yet? Empty employee sets are valid and should not prevent listing.
- How does the system handle a companyName with leading/trailing whitespace? Input should be trimmed before storage.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow creation of a new company with a companyName, customDomain, and ownerUserId.
- **FR-002**: System MUST generate a UUID for each company at creation time.
- **FR-003**: The customDomain MUST be unique across all company records — no two companies may share the same domain.
- **FR-004**: The ownerUserId MUST reference an existing user with `role = OWNER`; creation and ownership updates referencing a non-existent user or a user whose role is not `OWNER` MUST be rejected.
- **FR-005**: System MUST allow retrieval of a single company by its UUID.
- **FR-006**: System MUST allow listing all registered companies.
- **FR-007**: System MUST allow partial updates (PATCH semantics) to companyName, customDomain, and ownerUserId.
- **FR-008**: System MUST allow deletion of a company by its UUID.
- **FR-009**: Upon company deletion, all users whose companyId matches the deleted company MUST have their companyId cleared (set to undefined).
- **FR-010**: The customDomain MUST be a valid fully-qualified domain name (FQDN) — e.g., `xyz.portal.com` or `xyz.empresa.com.br`. Values that are not valid FQDNs (slugs, bare labels without a TLD, or strings containing spaces) MUST be rejected with HTTP 400.
- **FR-011**: Duplicate customDomain on creation or update MUST be rejected with a conflict response.
- **FR-012**: Company deletion MUST be restricted to the user designated as the owner (`ownerUserId`); any other caller MUST receive a forbidden error (HTTP 403). Create and Update operations are open in this iteration.

### Key Entities

- **Company**: Represents a registered organization in the portal. Identified by a UUID, it has a human-readable name (`companyName`), a fully-qualified domain name (`customDomain`, e.g., `xyz.portal.com`) used as the tenant's entry point, and a reference to its owner (`ownerUserId`). A company can have zero or more associated employee users.
- **User** _(existing)_: Already defined in the system. Users with role `employee` or `owner` can be associated with a company via their `companyId` field. The `ownerUserId` on Company references a User record.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Company registration completes successfully in a single request with no additional round-trips required from the caller.
- **SC-002**: Custom domain lookups resolve to the correct tenant record — no two tenants share the same domain at any point in time.
- **SC-003**: Company deletion cascades to all associated employees without requiring a separate cleanup call from the caller.
- **SC-004**: All five lifecycle operations (create, retrieve, list, update, delete) return consistent and predictable responses across repeated calls.
- **SC-005**: Invalid inputs (missing fields, duplicate domains, non-existent user references) are rejected at the boundary with descriptive error responses before any data is persisted.

## Assumptions

- A user may own multiple companies (no restriction on the number of companies a single user can own).
- The `customDomain` value is stored and compared in a case-insensitive manner to prevent near-duplicate domains (e.g., `XYZ.com` and `xyz.com` are treated as the same domain).
- Employee association is managed through the existing `companyId` field on the User entity — there is no separate membership/join table for this iteration.
- Ownership transfer (updating `ownerUserId`) enforces the same role restriction as creation: the new owner must also have `role = owner`.
- The Company entity does not carry a `createdAt` timestamp in this iteration; that can be added in a future enhancement.
- Multi-tenant routing based on `customDomain` is out of scope for this feature; this spec only covers the CRUD lifecycle of the Company record.
- Authorization is scoped to deletion only in this iteration: only the company owner may delete their company (HTTP 403 for others). Create and Update operations do not enforce ownership checks.

## Clarifications

### Session 2026-05-26

- Q: What is the authorization model for Create, Update, and Delete operations? → A: Only delete enforces ownership — the caller must be the company owner (HTTP 403 for non-owners); Create and Update are open in this iteration.
- Q: What is the expected format for customDomain? → A: Full FQDN (e.g., `xyz.portal.com`); slugs and bare labels are invalid.
- Q: Should ownerUserId be restricted to users with a specific role? → A: Yes — ownerUserId must reference a user with `role = owner`; any other role is rejected with HTTP 400.
