# Feature Specification: User CRUD

**Feature Branch**: `001-user-crud`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "Create the spec for the User feature. For now I want a CRUD for the user. The user needs to have: id (uuid), name, email, creationDate, role, companyId (optional). The user alter will either create a company if he is an owner, or join one as an employee or external, but for now let's just focus on the user. The user should always be identified by its ID and initially the role should not be updatable."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Create a New User (Priority: P1)

An operator or external client sends the required information (name, email, role) to register
a new user in the system. The system generates a unique identifier and records the creation
date automatically. The new user is returned in the response.

**Why this priority**: Creating a user is the foundational action — no other operation
(retrieve, update, delete) is possible without it. It is the entry point for all further
user management.

**Independent Test**: Can be fully tested by sending a valid creation request and asserting
that the response contains a user with a UUID, the provided name/email/role, an
auto-generated creation date, and no companyId (or a provided companyId when supplied).

**Acceptance Scenarios**:

1. **Given** no user exists with the provided email, **When** a creation request is sent with valid name, email, and role, **Then** a new user is returned with a UUID, the provided data, an auto-generated creation date, and HTTP 201.
2. **Given** a user already exists with the provided email, **When** a duplicate creation request is sent, **Then** the system rejects it with a conflict error (HTTP 409).
3. **Given** a creation request with companyId provided, **When** the request is processed, **Then** the returned user includes the provided companyId.
4. **Given** a creation request omitting companyId, **When** the request is processed, **Then** the returned user has no companyId set.
5. **Given** a creation request with a missing mandatory field (name, email, or role), **When** the request is processed, **Then** the system rejects it with a validation error (HTTP 400).

---

### User Story 2 — Retrieve a User by ID (Priority: P2)

A caller provides a user's UUID and receives the full profile of that user.

**Why this priority**: Reading is the most frequent operation and is required to display user
profiles, verify identity, and support downstream features (e.g., company association).

**Independent Test**: Can be fully tested by first creating a user, then fetching it by the
returned UUID and asserting all fields are present and match.

**Acceptance Scenarios**:

1. **Given** a user exists with a given UUID, **When** a retrieve request is sent with that UUID, **Then** the full user profile is returned with HTTP 200.
2. **Given** no user exists with the given UUID, **When** a retrieve request is sent, **Then** the system returns a not-found error (HTTP 404).
3. **Given** the UUID provided is not a valid UUID format, **When** a retrieve request is sent, **Then** the system returns a validation error (HTTP 400).

---

### User Story 3 — List All Users (Priority: P3)

A caller requests the full list of registered users and receives an ordered collection of
user profiles.

**Why this priority**: Listing supports administrative views and is needed before more
targeted lookups can be performed; it can be delivered independently as a complete slice.

**Independent Test**: Can be fully tested by creating multiple users and asserting that
all of them appear in the list response with HTTP 200.

**Acceptance Scenarios**:

1. **Given** one or more users exist, **When** a list request is sent, **Then** all users are returned with HTTP 200.
2. **Given** no users exist, **When** a list request is sent, **Then** an empty collection is returned with HTTP 200.

---

### User Story 4 — Update a User (Priority: P4)

A caller sends a partial payload with one or more of the user's mutable fields (name, email,
companyId) following PATCH semantics — only the fields present in the request are updated;
omitted fields are preserved exactly as they are. The role field is explicitly excluded from
updates.

**Why this priority**: Mutation of user data is required for real-world usage but is lower
priority than create and read, which are needed to demonstrate an MVP.

**Independent Test**: Can be fully tested by creating a user, sending a partial update
with a new name and email, and asserting the response reflects the changes while all
unchanged fields (role, id, creationDate) remain intact.

**Acceptance Scenarios**:

1. **Given** a user exists, **When** an update request is sent with a new name, **Then** the user's name is updated and returned with HTTP 200.
2. **Given** a user exists, **When** an update request is sent with a new email not taken by another user, **Then** the user's email is updated and returned with HTTP 200.
3. **Given** a user exists, **When** an update request is sent with an email already used by a different user, **Then** the system rejects it with a conflict error (HTTP 409).
4. **Given** a user exists, **When** an update request attempts to change the role, **Then** the system ignores the role field silently — the existing role is preserved.
5. **Given** a user exists, **When** an update request is sent with companyId set or cleared, **Then** the change is persisted and returned.
6. **Given** no user exists with the given UUID, **When** an update request is sent, **Then** the system returns a not-found error (HTTP 404).
7. **Given** a user exists, **When** an update request is sent with an empty body (no fields provided), **Then** the system rejects it with a validation error (HTTP 400).
8. **Given** a user exists, **When** an update request includes only a `name` field, **Then** only the name is changed; `email` and `companyId` are preserved unchanged.

---

### User Story 5 — Delete a User (Priority: P5)

A caller provides a user's UUID and the system permanently removes that user from the
registry.

**Why this priority**: Deletion is required for data lifecycle management but is the least
critical for initial usage; the system is functional without it.

**Independent Test**: Can be fully tested by creating a user, deleting it by UUID, then
attempting to retrieve it and asserting a not-found response.

**Acceptance Scenarios**:

1. **Given** a user exists, **When** a delete request is sent with that user's UUID, **Then** the user is removed and HTTP 204 is returned.
2. **Given** no user exists with the given UUID, **When** a delete request is sent, **Then** the system returns a not-found error (HTTP 404).

---

### Edge Cases

- What happens when two concurrent creation requests are sent with the same email?
- What happens when the UUID in the path is well-formed but belongs to a deleted user?
- ~~What happens when an update request body is empty?~~ Resolved: HTTP 400 — at least one mutable field must be present (see US4 Scenario 7).
- How does the system handle extra/unknown fields in a request body?
- What happens when the list contains thousands of users — is there a size limit?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST create a new user with a system-generated UUID and auto-recorded creation date when provided with a valid name, email, and role.
- **FR-002**: The system MUST reject user creation if the email address is already registered to another user.
- **FR-003**: The system MUST reject any request that is missing a mandatory field (name, email, or role).
- **FR-004**: The system MUST allow retrieval of a single user by their UUID.
- **FR-005**: The system MUST return a not-found response when a user with the specified UUID does not exist.
- **FR-006**: The system MUST return all registered users when a list is requested.
- **FR-007**: The system MUST support partial updates (PATCH semantics) — only fields present in the request body are modified; omitted fields retain their current values. Mutable fields are: name, email, and companyId. At least one mutable field MUST be present in the request body.
- **FR-008**: The system MUST NOT allow the role field to be changed after a user is created.
- **FR-009**: The system MUST reject an email update if the new email is already in use by a different user.
- **FR-010**: The system MUST permanently remove a user when a delete request is received for a valid UUID.
- **FR-011**: The system MUST accept an optional companyId on both creation and update.
- **FR-012**: Each user MUST be uniquely identified by their UUID across all operations.
- **FR-013**: All responses containing user data (single user or collection) MUST wrap the payload in a `data` envelope — `{ "data": { ... } }` for a single user and `{ "data": [ ... ] }` for a collection.
- **FR-014**: The system MUST normalize email addresses to lowercase before storing and before any uniqueness comparison; `User@Example.com` and `user@example.com` MUST be treated as the same address.

### Key Entities

- **User**: Represents a registered individual in the system. Attributes: unique identifier (UUID), full name, unique email address, creation date (system-assigned, immutable), role (assigned at creation, immutable after), and an optional company association identifier.

- **UserRole**: A classification assigned to a user at creation time that determines their relationship to companies. Valid values: `OWNER`, `EMPLOYEE`, `EXTERNAL`. Cannot be changed after assignment.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A caller can create, retrieve, update, and delete a user through a single consistent interface without requiring additional knowledge of internal identifiers.
- **SC-002**: Every user operation (create, retrieve, update, delete, list) MUST complete with a p99 response time ≤ 500 ms under sequential (non-concurrent) development and test load.
- **SC-003**: Duplicate email addresses are rejected 100% of the time across all operations that write email data.
- **SC-004**: The role field remains unchanged after creation in 100% of update attempts, regardless of whether it is included in the request body.
- **SC-005**: All five user stories pass their acceptance scenarios with no manual workarounds required.

## Assumptions

- Email addresses are unique across the entire system and compared case-insensitively; the system normalizes all email values to lowercase before storing and comparing them.
- The `creationDate` is set by the system at the moment of creation and is never editable by callers.
- Valid role values are `OWNER`, `EMPLOYEE`, and `EXTERNAL`; any other value is rejected at creation.
- No authentication or authorisation is required for these endpoints in this initial scope; access control will be added in a later feature.
- The `companyId` is stored as a reference identifier only; existence validation against a company registry is out of scope for this feature. No format constraint is applied — any non-empty string is accepted; format validation is deferred until the company module is defined.
- Pagination on the list endpoint is out of scope for this initial version.
- Company creation and association logic is explicitly out of scope; `companyId` is a plain optional field with no referential integrity enforced at this stage.
- `id`, `creationDate`, and `role` are immutable after creation.
- The update endpoint follows PATCH semantics; a caller is never required to resend unchanged fields.

## Clarifications

### Session 2026-05-22

- Q: What is the HTTP response format for user operations — naked object, `data` envelope, or status envelope? → A: `data` envelope — `{ "data": { ... } }` for single user, `{ "data": [ ... ] }` for collections.
- Q: How should email case be handled for uniqueness checks? → A: Case-insensitive — email normalized to lowercase before storage and comparison.
- Q: What update semantics should the update endpoint follow — PATCH (omitted fields preserved) or PUT (full replacement)? → A: PATCH — only provided fields are updated; omitted fields retained; empty body rejected with HTTP 400.
- Q: What is the measurable performance target for SC-002? → A: p99 ≤ 500 ms for all endpoints under sequential development/test load.
- Q: Should `companyId` have a format constraint (e.g., UUID) or accept any non-empty string? → A: No format constraint — any non-empty string accepted; validation deferred to company module.
