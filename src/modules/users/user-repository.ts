import { database } from '../../shared/database/mock-database';
import { IUser } from './user-entity';

export function findByEmail(email: string): IUser | undefined {
  return database.find((user) => user.email === email);
}

export function findById(id: string): IUser | undefined {
  return database.find((user) => user.id === id);
}

export function create(user: IUser): IUser {
  database.push(user);
  return user;
}
