import { UserRole } from '@/types/roles';
import { ROLES } from '@/constants/roles';

export interface RolePermissions {
  canCreateAssets: boolean;
  canEditAssets: boolean;
  canDeleteAssets: boolean;
  canManageDepartments: boolean;
  canManageUsers: boolean;
  canAllocateAssets: boolean;
  canApproveAllocations: boolean;
  canApproveMaintenance: boolean;
  canManageAudit: boolean;
}

export const PERMISSIONS: Record<UserRole, RolePermissions> = {
  [ROLES.ADMIN]: {
    canCreateAssets: true,
    canEditAssets: true,
    canDeleteAssets: true,
    canManageDepartments: true,
    canManageUsers: true,
    canAllocateAssets: true,
    canApproveAllocations: true,
    canApproveMaintenance: true,
    canManageAudit: true,
  },
  [ROLES.ASSET_MANAGER]: {
    canCreateAssets: true,
    canEditAssets: true,
    canDeleteAssets: false,
    canManageDepartments: false,
    canManageUsers: false,
    canAllocateAssets: true,
    canApproveAllocations: true,
    canApproveMaintenance: true,
    canManageAudit: true,
  },
  [ROLES.DEPARTMENT_HEAD]: {
    canCreateAssets: false,
    canEditAssets: false,
    canDeleteAssets: false,
    canManageDepartments: false, // Managed by Admin
    canManageUsers: false,
    canAllocateAssets: false,
    canApproveAllocations: true, // For their department
    canApproveMaintenance: false,
    canManageAudit: false,
  },
  [ROLES.EMPLOYEE]: {
    canCreateAssets: false,
    canEditAssets: false,
    canDeleteAssets: false,
    canManageDepartments: false,
    canManageUsers: false,
    canAllocateAssets: false,
    canApproveAllocations: false,
    canApproveMaintenance: false,
    canManageAudit: false,
  },
};
