import { ElementType } from 'react';
import {
  LayoutDashboard,
  Building2,
  Box,
  ArrowRightLeft,
  CalendarCheck,
  Wrench,
  ShieldCheck,
  BarChart3,
  Bell,
  User,
} from 'lucide-react';
import { UserRole } from '@/types/roles';
import { ROLES } from '@/constants/roles';
import { ROUTES } from '@/lib/constants/routes';

export interface SidebarChildItem {
  id: string;
  name: string;
  href: string;
  roles: UserRole[];
}

export interface SidebarConfigItem {
  id: string;
  name: string;
  href?: string;
  icon: ElementType;
  roles: UserRole[];
  children?: SidebarChildItem[];
}

export const sidebarConfig: SidebarConfigItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE],
  },
  {
    id: 'organization',
    name: 'Organization Setup',
    icon: Building2,
    roles: [ROLES.ADMIN],
    children: [
      { id: 'org-departments', name: 'Departments', href: ROUTES.ORGANIZATION.DEPARTMENTS, roles: [ROLES.ADMIN] },
      { id: 'org-categories', name: 'Categories', href: ROUTES.ORGANIZATION.CATEGORIES, roles: [ROLES.ADMIN] },
      { id: 'org-employees', name: 'Employees', href: ROUTES.ORGANIZATION.EMPLOYEES, roles: [ROLES.ADMIN] },
    ],
  },
  {
    id: 'assets',
    name: 'Assets',
    href: '/assets',
    icon: Box,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE],
  },
  {
    id: 'allocation',
    name: 'Allocation & Transfer',
    href: '/allocation',
    icon: ArrowRightLeft,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD],
  },
  {
    id: 'booking',
    name: 'Resource Booking',
    href: '/booking',
    icon: CalendarCheck,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE],
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    href: ROUTES.MAINTENANCE.ROOT,
    icon: Wrench,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.TECHNICIAN, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE],
  },
  {
    id: 'audit',
    name: 'Audit',
    href: '/audit',
    icon: ShieldCheck,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE],
  },
  {
    id: 'reports',
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    href: ROUTES.NOTIFICATIONS,
    icon: Bell,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE],
  },
  {
    id: 'profile',
    name: 'Profile',
    href: ROUTES.PROFILE,
    icon: User,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE],
  },
];
