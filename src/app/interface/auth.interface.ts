/* eslint-disable @typescript-eslint/no-unused-vars */
export interface IAuthData {
  userEmail: string;
  userId: string;
  userRole: TUserRole;
}

export const userRoles = {
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
  LEADER: "LEADER",
  SUPERVISOR: "SUPERVISOR",
} as const;

export const userRole = Object.values(userRoles);

export type TUserRole = keyof typeof userRoles;
