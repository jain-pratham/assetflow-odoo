import { UserRole } from '../types/roles';

export const ROLES = {
  ADMIN: 'ADMIN',
  ASSET_MANAGER: 'ASSET_MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  EMPLOYEE: 'EMPLOYEE',
} as const satisfies Record<UserRole, UserRole>;
