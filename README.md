# AssetFlow ERP

AssetFlow is a modern, enterprise-grade Asset and Resource Management System (ERP). It provides a centralized command center to track, allocate, and manage physical assets, software licenses, human resources, and organizational departments.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- TypeScript

### Installation

1. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Configuration:**
   - Create a `.env` file in the `backend` directory with your `MONGO_URI`, `JWT_SECRET`, and `SMTP_` credentials.
   - Create a `.env.local` in the root directory for Next.js variables if needed.

4. **Start Development Servers:**
   - **Backend:** `cd backend && npm run dev`
   - **Frontend:** `npm run dev`

---

## 👑 First Admin Setup

Since AssetFlow utilizes strict Role-Based Access Control (RBAC), normal signups from the web interface will always default to the `EMPLOYEE` role.

To initialize your system, you must create the first `ADMIN` account using the database seeder:

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run the seeder script:
   ```bash
   npx ts-node src/config/seeders/defaultAdminSeeder.ts
   ```
3. By default, this creates an admin with:
   - **Email:** `admin@assetflow.com` (unless `DEFAULT_ADMIN_EMAIL` is set in your `.env`)
   - **Password:** `admin123` (unless `DEFAULT_ADMIN_PASSWORD` is set in your `.env`)
4. Login to the application via `http://localhost:3000/login` using these credentials to gain full access to the ERP Dashboard.

---

## 🔐 Authentication Module

### Overview
The Authentication module handles secure user registration, login, token management, and role-based access control. It uses Next.js (App Router), Redux Toolkit, Axios, Node.js, Express, MongoDB, and JSON Web Tokens (JWT).

### Auth Flow
1. **Signup**: User submits details -> Backend hashes password, sets role to `EMPLOYEE` -> Returns User & Tokens -> Frontend stores access token in Redux, redirects to Dashboard.
2. **Login**: User submits credentials -> Backend validates -> Returns User & Tokens (Refresh token set in HTTP-only cookie).
3. **Session Rehydration**: On app load, `useAuth` hook fetches `/api/auth/me`. If access token is expired, the Axios interceptor automatically calls `/api/auth/refresh` to get a new access token using the HTTP-only refresh token cookie.
4. **Logout**: User clicks logout -> Backend clears refresh token -> Frontend clears Redux state and redirects to `/login`.

### JWT Lifecycle
- **Access Token**: Short-lived (15 minutes). Returned in JSON response body and stored in Redux state (in-memory). Sent as `Bearer` token in Authorization header.
- **Refresh Token**: Long-lived (7 days). Stored securely as an HTTP-only, SameSite cookie by the backend.
- Refresh tokens are hashed in the database (SHA-256 via bcrypt) for added security.

---

## 🗺️ Roadmap & Features

### Core Setup & Authentication [COMPLETED]
- [x] Initialize Next.js, Redux, Tailwind, shadcn/ui.
- [x] Set up Express, MongoDB, Mongoose.
- [x] Implement User schema with roles (Admin, Asset Manager, Department Head, Employee).
- [x] Develop auth flows (Signup, Login, Refresh Token, Forgot Password).
- [x] Implement JWT authentication & RBAC middleware.
- [x] Create standardized API responses and centralized error handling.
- [x] Build Auth UI (Login, Signup) & Dashboard shell.

### Entities
- [x] Users
- [x] RoleHistory
- [x] Departments
- [x] Categories
- [x] Assets
- [x] Allocations
- [x] Transfers
- [x] Bookings
- [ ] Maintenance
- [x] Audits
- [ ] Notifications
- [ ] Activity Logs

### Screens
- [x] 1. Auth (Login & Signup)
- [x] 2. Organization Setup (Employee Directory, Departments & Categories)
- [ ] 3. Asset Registration & Directory
- [ ] 4. Asset Allocation & Transfer
- [x] 5. Resource Booking (Calendar/List)
- [ ] 6. Maintenance Workflow
- [x] 7. Audit Cycles
- [x] 8. Dashboard
- [ ] 9. Notifications & Activity Log
- [x] 10. Reports & Analytics

### Business Rules
- [x] Signup creates an Employee account ONLY; roles assigned by Admin.
- [ ] Block double-allocation (show "currently held by X" + offer Transfer Request).
- [x] Resource booking overlap validation.
- [ ] Maintenance must be approved before status is "Under Maintenance"; resolution flips back to "Available".
- [x] Audit Cycle discrepancies auto-generate a report; closing updates statuses.
- [ ] RBAC enforced on every API route.
- [ ] Every list/table screen needs loading, empty, and error states.
