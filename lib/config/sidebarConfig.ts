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
    icon: ArrowRightLeft,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD],
    children: [
      { id: 'alloc-allocate', name: 'Allocate Asset', href: ROUTES.ALLOCATION.ALLOCATE, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
      { id: 'alloc-transfer', name: 'Transfer Asset', href: ROUTES.ALLOCATION.TRANSFER, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
      { id: 'alloc-return', name: 'Return Asset', href: ROUTES.ALLOCATION.RETURN, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
      { id: 'alloc-history', name: 'Allocation History', href: ROUTES.ALLOCATION.HISTORY, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
      { id: 'alloc-transfer-req', name: 'Transfer Requests', href: ROUTES.ALLOCATION.TRANSFER_REQUESTS, roles: [ROLES.DEPARTMENT_HEAD] },
      { id: 'alloc-return-req', name: 'Return Requests', href: ROUTES.ALLOCATION.RETURN_REQUESTS, roles: [ROLES.DEPARTMENT_HEAD] },
    ],
  },
  {
    id: 'booking',
    name: 'Resource Booking',
    icon: CalendarCheck,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE],
    children: [
      { id: 'booking-book', name: 'Book Resource', href: ROUTES.BOOKING.RESOURCE, roles: [ROLES.ADMIN, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE] },
      { id: 'booking-calendar', name: 'Booking Calendar', href: ROUTES.BOOKING.CALENDAR, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD] },
      { id: 'booking-requests', name: 'Booking Requests', href: ROUTES.BOOKING.REQUESTS, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
      { id: 'booking-my', name: 'My Bookings', href: ROUTES.BOOKING.MY, roles: [ROLES.EMPLOYEE] },
    ],
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    icon: Wrench,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE],
    children: [
      { id: 'maint-requests', name: 'Maintenance Requests', href: ROUTES.MAINTENANCE.REQUESTS, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
      { id: 'maint-assign', name: 'Assign Technician', href: ROUTES.MAINTENANCE.ASSIGN_TECHNICIAN, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
      { id: 'maint-history', name: 'Maintenance History', href: ROUTES.MAINTENANCE.HISTORY, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
      { id: 'maint-raise', name: 'Raise Request', href: ROUTES.MAINTENANCE.RAISE, roles: [ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE] },
      { id: 'maint-dept', name: 'Department Requests', href: ROUTES.MAINTENANCE.DEPARTMENT, roles: [ROLES.DEPARTMENT_HEAD] },
      { id: 'maint-my', name: 'My Requests', href: ROUTES.MAINTENANCE.MY, roles: [ROLES.EMPLOYEE] },
    ],
  },
  {
    id: 'audit',
    name: 'Audit',
    icon: ShieldCheck,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER],
    children: [
      { id: 'audit-cycles', name: 'Audit Cycles', href: ROUTES.AUDIT.CYCLES, roles: [ROLES.ADMIN] },
      { id: 'audit-verification', name: 'Asset Verification', href: ROUTES.AUDIT.VERIFICATION, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
      { id: 'audit-discrepancy', name: 'Discrepancy Reports', href: ROUTES.AUDIT.DISCREPANCY_REPORTS, roles: [ROLES.ADMIN] },
    ],
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: BarChart3,
    roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD],
    children: [
      { id: 'reports-dashboard', name: 'Reports Dashboard', href: ROUTES.REPORTS.DASHBOARD, roles: [ROLES.ADMIN] },
      { id: 'reports-assets', name: 'Asset Reports', href: ROUTES.REPORTS.ASSETS, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
      { id: 'reports-bookings', name: 'Booking Reports', href: ROUTES.REPORTS.BOOKINGS, roles: [ROLES.ADMIN] },
      { id: 'reports-maintenance', name: 'Maintenance Reports', href: ROUTES.REPORTS.MAINTENANCE, roles: [ROLES.ADMIN, ROLES.ASSET_MANAGER] },
      { id: 'reports-dept', name: 'Department Reports', href: ROUTES.REPORTS.DEPARTMENT, roles: [ROLES.DEPARTMENT_HEAD] },
    ],
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
