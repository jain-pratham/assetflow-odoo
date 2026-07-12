# AssetFlow Roadmap

## Tech Stack
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod, Axios, Sonner, Lucide
- **Backend**: Node.js, Express.js (or Next.js API Routes), MongoDB, Mongoose, Zod
- **Auth**: JWT, bcrypt
- **Charts**: Recharts (optional/time-permitting)
- **State**: React Context / Hooks

### Phase 1: Core Setup & Authentication (Day 1 - 2 hours) [COMPLETED]
**Goal:** Establish project foundation, secure user access, and RBAC.

- [x] Initialize Next.js, Redux, Tailwind, shadcn/ui.
- [x] Set up Express, MongoDB, Mongoose.
- [x] Implement User schema with roles (Admin, Asset Manager, Department Head, Employee).
- [x] Develop auth flows (Signup, Login, Refresh Token, Forgot Password).
- [x] Implement JWT authentication & RBAC middleware.
- [x] Create standardized API responses and centralized error handling.
- [x] Build Auth UI (Login, Signup) & Dashboard shell.

## Entities
- [x] Users
- [x] RoleHistory
- [x] Departments
- [x] Categories
- [x] Assets
- [x] Allocations
- [x] Transfers
- [ ] Bookings
- [ ] Maintenance
- [ ] Audits
- [ ] Notifications
- [ ] Activity Logs

## Screens (10 Core)
- [x] 1. Auth (Login & Signup)
- [x] 2. Organization Setup (Employee Directory completed, Departments & Categories pending)
- [ ] 3. Asset Registration & Directory
- [ ] 4. Asset Allocation & Transfer
- [ ] 5. Resource Booking (Calendar/List)
- [ ] 6. Maintenance Workflow
- [ ] 7. Audit Cycles
- [ ] 8. Dashboard
- [ ] 9. Notifications & Activity Log
- [ ] 10. Reports & Analytics

## Business Rules
- [x] Signup creates an Employee account ONLY; roles assigned by Admin.
- [ ] Block double-allocation (show "currently held by X" + offer Transfer Request).
- [ ] Resource booking overlap validation.
- [ ] Maintenance must be approved before status is "Under Maintenance"; resolution flips back to "Available".
- [ ] Audit Cycle discrepancies auto-generate a report; closing updates statuses.
- [ ] RBAC enforced on every API route.
- [ ] Every list/table screen needs loading, empty, and error states.

## Known Gaps
- None yet.
