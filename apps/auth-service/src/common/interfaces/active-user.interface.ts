export enum UserRole {
  User = 1,
  Admin = 2,
}

export interface ActiveUser {
  userId: string;
  roleId: UserRole;
}
