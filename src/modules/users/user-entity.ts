export enum UserRole {
  Owner = 'Owner',
  Admin = 'Admin',
  Employee = 'Employee',
  External = 'External',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  startDate: Date;
  status: UserStatus;
}
