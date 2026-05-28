import { ICompany } from '../../modules/companies/company-entity';
import { IUser } from '../../modules/users/user-entity';

export const database: IUser[] = [];
export const companyDatabase: ICompany[] = [];

export function clearDatabase(): void {
  database.splice(0, database.length);
  companyDatabase.splice(0, companyDatabase.length);
}
