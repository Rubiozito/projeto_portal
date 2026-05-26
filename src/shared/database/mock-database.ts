import { IUser } from '../../modules/users/user-entity';

export const database: IUser[] = [];

export function clearDatabase(): void {
  database.splice(0, database.length);
}
