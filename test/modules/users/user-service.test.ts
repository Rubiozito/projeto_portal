import { beforeEach, describe, expect, it } from 'vitest';

import { clearDatabase } from '../../../src/shared/database/mock-database';
import { UserRole } from '../../../src/modules/users/user-entity';
import { MockUserRepository } from '../../../src/modules/users/user-repository';
import { UserService } from '../../../src/modules/users/user-service';

let repository: MockUserRepository;
let service: UserService;

beforeEach(() => {
  clearDatabase();
  repository = new MockUserRepository();
  service = new UserService(repository);
});

// US1 — createUser
describe('UserService.createUser', () => {
  it('should create a user and return it with a generated id and creationDate', () => {
    const result = service.createUser({
      name: 'Rafael Silva',
      email: 'rafael@example.com',
      role: UserRole.OWNER,
    });

    expect(result.id).toBeDefined();
    expect(result.creationDate).toBeDefined();
    expect(result.name).toBe('Rafael Silva');
    expect(result.email).toBe('rafael@example.com');
    expect(result.role).toBe(UserRole.OWNER);
  });

  it('should throw DuplicatedItemError when email is already registered', () => {
    service.createUser({
      name: 'User One',
      email: 'dup@example.com',
      role: UserRole.EMPLOYEE,
    });

    expect(() =>
      service.createUser({
        name: 'User Two',
        email: 'dup@example.com',
        role: UserRole.OWNER,
      }),
    ).toThrow('Email already registered');
  });

  it('should include companyId when provided', () => {
    const result = service.createUser({
      name: 'Owner',
      email: 'owner@example.com',
      role: UserRole.OWNER,
      companyId: 'acme-corp',
    });

    expect(result.companyId).toBe('acme-corp');
  });

  it('should not include companyId when not provided', () => {
    const result = service.createUser({
      name: 'Worker',
      email: 'worker@example.com',
      role: UserRole.EMPLOYEE,
    });

    expect(result.companyId).toBeUndefined();
  });
});

// US2 — getUserById
describe('UserService.getUserById', () => {
  it('should return the user when it exists', () => {
    const created = service.createUser({
      name: 'Ana',
      email: 'ana@example.com',
      role: UserRole.EXTERNAL,
    });
    const found = service.getUserById(created.id);

    expect(found).toEqual(created);
  });

  it('should throw NotFoundError when user does not exist', () => {
    expect(() =>
      service.getUserById('00000000-0000-4000-8000-000000000000'),
    ).toThrow('User not found');
  });
});

// US3 — getAllUsers
describe('UserService.getAllUsers', () => {
  it('should return all users', () => {
    service.createUser({
      name: 'Ana',
      email: 'ana@example.com',
      role: UserRole.EMPLOYEE,
    });
    service.createUser({
      name: 'Bob',
      email: 'bob@example.com',
      role: UserRole.OWNER,
    });

    const users = service.getAllUsers();

    expect(users).toHaveLength(2);
  });

  it('should return an empty array when no users exist', () => {
    expect(service.getAllUsers()).toEqual([]);
  });
});

// US4 — updateUser
describe('UserService.updateUser', () => {
  it('should update name and leave other fields unchanged', () => {
    const created = service.createUser({
      name: 'Old Name',
      email: 'u@example.com',
      role: UserRole.OWNER,
    });
    const updated = service.updateUser(created.id, { name: 'New Name' });

    expect(updated.name).toBe('New Name');
    expect(updated.email).toBe('u@example.com');
    expect(updated.role).toBe(UserRole.OWNER);
    expect(updated.id).toBe(created.id);
    expect(updated.creationDate).toBe(created.creationDate);
  });

  it('should update email when not taken by another user', () => {
    const created = service.createUser({
      name: 'User',
      email: 'old@example.com',
      role: UserRole.EMPLOYEE,
    });
    const updated = service.updateUser(created.id, {
      email: 'new@example.com',
    });

    expect(updated.email).toBe('new@example.com');
  });

  it('should throw DuplicatedItemError when new email is taken by a different user', () => {
    service.createUser({
      name: 'User A',
      email: 'a@example.com',
      role: UserRole.OWNER,
    });
    const userB = service.createUser({
      name: 'User B',
      email: 'b@example.com',
      role: UserRole.EMPLOYEE,
    });

    expect(() =>
      service.updateUser(userB.id, { email: 'a@example.com' }),
    ).toThrow('Email already registered');
  });

  it('should clear companyId when null is provided', () => {
    const created = service.createUser({
      name: 'User',
      email: 'u2@example.com',
      role: UserRole.OWNER,
      companyId: 'old-corp',
    });
    const updated = service.updateUser(created.id, { companyId: null });

    expect(updated.companyId).toBeUndefined();
  });

  it('should set companyId when a string is provided', () => {
    const created = service.createUser({
      name: 'User',
      email: 'u3@example.com',
      role: UserRole.OWNER,
    });
    const updated = service.updateUser(created.id, { companyId: 'new-corp' });

    expect(updated.companyId).toBe('new-corp');
  });

  it('should preserve companyId when it is not in the update payload', () => {
    const created = service.createUser({
      name: 'Name',
      email: 'keep@example.com',
      role: UserRole.OWNER,
      companyId: 'corp',
    });
    const updated = service.updateUser(created.id, { name: 'New Name' });

    expect(updated.companyId).toBe('corp');
  });

  it('should throw NotFoundError when user does not exist', () => {
    expect(() =>
      service.updateUser('00000000-0000-4000-8000-000000000000', { name: 'X' }),
    ).toThrow('User not found');
  });
});

// US5 — deleteUser
describe('UserService.deleteUser', () => {
  it('should delete the user without throwing', () => {
    const created = service.createUser({
      name: 'To Delete',
      email: 'del@example.com',
      role: UserRole.OWNER,
    });

    expect(() => service.deleteUser(created.id)).not.toThrow();
  });

  it('should make the user unreachable after deletion', () => {
    const created = service.createUser({
      name: 'Temp',
      email: 'temp@example.com',
      role: UserRole.EMPLOYEE,
    });
    service.deleteUser(created.id);

    expect(() => service.getUserById(created.id)).toThrow('User not found');
  });

  it('should throw NotFoundError when user does not exist', () => {
    expect(() =>
      service.deleteUser('00000000-0000-4000-8000-000000000000'),
    ).toThrow('User not found');
  });
});
