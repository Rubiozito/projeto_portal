import { randomUUID } from 'crypto';

import { DuplicatedItemError } from '../../shared/errors/duplicated-item-error';
import { NotFoundError } from '../../shared/errors/not-found-error';

import { IUser } from './user-entity';
import { IUserRepository } from './user-repository';
import { CreateUserInput, UpdateUserInput } from './user-schemas';

export class UserService {
  constructor(private readonly repository: IUserRepository) {}

  createUser(input: CreateUserInput): IUser {
    const existing = this.repository.findByEmail(input.email);
    if (existing) {
      throw new DuplicatedItemError('Email already registered');
    }

    const user: IUser = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      creationDate: new Date().toISOString(),
      role: input.role,
      ...(input.companyId !== undefined && { companyId: input.companyId }),
    };

    return this.repository.create(user);
  }

  getUserById(id: string): IUser {
    const user = this.repository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  getAllUsers(): IUser[] {
    return this.repository.findAll();
  }

  updateUser(id: string, input: UpdateUserInput): IUser {
    const user = this.repository.findById(id);
    if (!user) throw new NotFoundError('User not found');

    if (input.email !== undefined && input.email !== user.email) {
      const emailTaken = this.repository.findByEmail(input.email);
      if (emailTaken) throw new DuplicatedItemError('Email already registered');
    }

    const patch: Partial<IUser> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.email !== undefined) patch.email = input.email;
    if (input.companyId !== undefined) {
      // null means clear; string means set
      patch.companyId = input.companyId === null ? undefined : input.companyId;
    }

    const updated = this.repository.update(id, patch);
    if (!updated) throw new NotFoundError('User not found');
    return updated;
  }

  deleteUser(id: string): void {
    const deleted = this.repository.delete(id);
    if (!deleted) throw new NotFoundError('User not found');
  }
}
