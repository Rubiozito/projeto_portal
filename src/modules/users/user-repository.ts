import { database } from '../../shared/database/mock-database';

import { IUser } from './user-entity';

export interface IUserRepository {
  create(user: IUser): IUser;
  findById(id: string): IUser | undefined;
  findByEmail(email: string): IUser | undefined;
  findAll(): IUser[];
  update(id: string, data: Partial<IUser>): IUser | undefined;
  delete(id: string): boolean;
}

export class MockUserRepository implements IUserRepository {
  create(user: IUser): IUser {
    database.push(user);
    return user;
  }

  findById(id: string): IUser | undefined {
    return database.find((user) => user.id === id);
  }

  findByEmail(email: string): IUser | undefined {
    return database.find((user) => user.email === email);
  }

  findAll(): IUser[] {
    return [...database];
  }

  update(id: string, data: Partial<IUser>): IUser | undefined {
    const index = database.findIndex((user) => user.id === id);
    if (index === -1) return undefined;
    database[index] = { ...database[index], ...data };
    return database[index];
  }

  delete(id: string): boolean {
    const index = database.findIndex((user) => user.id === id);
    if (index === -1) return false;
    database.splice(index, 1);
    return true;
  }
}
