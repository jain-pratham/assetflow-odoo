export const ROUTES = {
  DASHBOARD: '/dashboard',
  ORGANIZATION: {
    DEPARTMENTS: '/organization/departments',
    CATEGORIES: '/organization/categories',
    EMPLOYEES: '/organization/employees',
  },
  ASSETS: {
    REGISTER: '/assets/register',
    LIST: '/assets/list',
    DETAILS: (id: string) => `/assets/${id}`,
    DEPARTMENT: '/assets/department',
    MY: '/assets/my',
  },
  ALLOCATION: {
    ALLOCATE: '/allocation/allocate',
    TRANSFER: '/allocation/transfer',
    RETURN: '/allocation/return',
    HISTORY: '/allocation/history',
    TRANSFER_REQUESTS: '/allocation/transfer-requests',
    RETURN_REQUESTS: '/allocation/return-requests',
  },
  BOOKING: {
    RESOURCE: '/booking/resource',
    CALENDAR: '/booking/calendar',
    REQUESTS: '/booking/requests',
    MY: '/booking/my',
  },
  MAINTENANCE: {
    REQUESTS: '/maintenance/requests',
    ASSIGN_TECHNICIAN: '/maintenance/assign-technician',
    HISTORY: '/maintenance/history',
    RAISE: '/maintenance/raise',
    DEPARTMENT: '/maintenance/department',
    MY: '/maintenance/my',
  },
  AUDIT: {
    CYCLES: '/audit/cycles',
    VERIFICATION: '/audit/verification',
    DISCREPANCY_REPORTS: '/audit/discrepancy-reports',
  },
  REPORTS: {
    DASHBOARD: '/reports/dashboard',
    ASSETS: '/reports/assets',
    BOOKINGS: '/reports/bookings',
    MAINTENANCE: '/reports/maintenance',
    DEPARTMENT: '/reports/department',
  },
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  }
};
