export enum UserRole {
  OWNER = 'OWNER',
  EMPLOYEE = 'EMPLOYEE',
  EXTERNAL = 'EXTERNAL',
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  creationDate: string;
  role: UserRole;
  companyId?: string;
}
