# AssetFlow — Enterprise Asset & Resource Management System

> **A centralized ERP platform for tracking, allocating, maintaining, auditing, and booking organizational assets and shared resources.**

AssetFlow is an Enterprise Asset & Resource Management System designed to replace manual asset tracking through spreadsheets and paper logs with a centralized digital workflow.

It provides structured asset lifecycles, employee and department management, asset allocation and transfers, shared-resource booking, maintenance approvals, audit cycles, notifications, and operational reporting.

---

## ✨ Key Features

- 🔐 Secure authentication and session handling
- 👥 Role-Based Access Control (RBAC)
- 🏢 Department management
- 👨‍💼 Employee directory and role management
- 🗂️ Asset category management
- 💻 Centralized asset registration and tracking
- 🔖 Auto-generated asset tags
- 📦 Asset allocation and transfer workflow
- 🔄 Asset return management
- 📅 Shared resource booking
- 🚫 Booking overlap prevention
- 🛠️ Maintenance request and approval workflow
- 🔍 Scheduled asset audit cycles
- ⚠️ Automatic discrepancy detection
- 🔔 Notifications for important operational events
- 📊 KPI dashboard and reports
- 📈 Asset utilization and maintenance analytics
- 📝 Activity and audit logs
- 🖼️ Asset photos and document support
- 🔎 Asset search and filtering

---

# 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js |
| UI | React, Tailwind CSS |
| Language | TypeScript |
| Code Quality | ESLint |
| Backend | Node.js, Express.js |
| Authentication | JWT |
| Database | PostgreSQL |
| ORM | Prisma |
| Architecture | Modular / REST API based |
| Development | Git, GitHub |

---

# 🏗️ System Architecture

```text
                         ASSETFLOW
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       ┌──────────────┐            ┌──────────────┐
       │   FRONTEND   │            │   BACKEND    │
       │              │   REST API │              │
       │   Next.js    │ ─────────► │ Node.js      │
       │   React      │            │ Express.js   │
       │ TypeScript   │            │ JWT Auth     │
       │ Tailwind CSS │            │              │
       └──────────────┘            └──────┬───────┘
                                          │
                                          ▼
                                  ┌──────────────┐
                                  │   Prisma ORM │
                                  └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │  PostgreSQL  │
                                  └──────────────┘
```

---

# 👥 User Roles

AssetFlow uses role-based workflows to prevent unauthorized role elevation.

## Admin

- Manage departments
- Manage asset categories
- Manage employee directory
- Assign/promote users to Department Head or Asset Manager
- Manage audit cycles
- View organization-wide analytics

## Asset Manager

- Register assets
- Allocate assets
- Approve transfers
- Approve maintenance requests
- Approve asset returns and condition check-in notes
- Manage audit discrepancy resolution

## Department Head

- View department assets
- Approve department allocation/transfer requests
- Book shared resources for the department

## Employee

- View assigned assets
- Book shared resources
- Raise maintenance requests
- Initiate asset return requests
- Initiate transfer requests

---

# 🔐 Authentication & Authorization

AssetFlow follows a secure account-creation model.

A newly registered user becomes an **Employee** by default. Users cannot select or assign privileged roles during signup.

Privileged roles are assigned by an Admin through the Employee Directory.

```text
                         SIGNUP
                           │
                           ▼
                  CREATE EMPLOYEE
                           │
                           ▼
                    ROLE = EMPLOYEE
                           │
                           ▼
                     LOGIN
                           │
                           ▼
                  JWT AUTHENTICATION
                           │
                           ▼
                    RBAC CHECK
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           ADMIN       MANAGER/HEAD    EMPLOYEE
             │             │             │
             ▼             ▼             ▼
        Admin Access   Assigned Access  Employee Access
```

---

# 🔄 Complete AssetFlow Business Flow

```text
                         LOGIN / SIGNUP
                                │
                                ▼
                         ROLE IDENTIFIED
                                │
                                ▼
                    ORGANIZATION SETUP
                                │
                 ┌──────────────┼──────────────┐
                 ▼              ▼              ▼
             Departments     Categories      Employees
                 │              │              │
                 └──────────────┼──────────────┘
                                │
                                ▼
                       REGISTER ASSET
                                │
                                ▼
                           AVAILABLE
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
          ALLOCATE            RESERVE          MAINTENANCE
             │                  │                  │
             ▼                  ▼                  ▼
         ALLOCATED           RESERVED       APPROVAL REQUIRED
             │                                     │
             │                               ┌─────┴─────┐
             │                               ▼           ▼
             │                           APPROVED     REJECTED
             │                               │
             │                               ▼
             │                       UNDER MAINTENANCE
             │                               │
             │                               ▼
             │                            RESOLVED
             │                               │
             └───────────────────────────────▼
                                         AVAILABLE
                                             │
                                             ▼
                                       AUDIT CYCLE
                                             │
                                  ┌──────────┼──────────┐
                                  ▼          ▼          ▼
                               VERIFIED   MISSING   DAMAGED
                                  │          │          │
                                  │          ▼          ▼
                                  │       DISCREPANCY REPORT
                                  │
                                  └──────────┬──────────┘
                                             ▼
                                       AUDIT CLOSED
                                             │
                                             ▼
                                   REPORTS & ANALYTICS
```

---

# 🏢 Organization Setup Flow

Organization master data is configured before normal asset operations.

```text
                         ADMIN
                           │
                           ▼
                  ORGANIZATION SETUP
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
       DEPARTMENTS      CATEGORIES      EMPLOYEES
            │              │              │
            ▼              ▼              ▼
        Create/Edit     Create/Edit    Manage Directory
        Activate/       Categories     Department
        Deactivate                    Role / Status
            │                              │
            └──────────────┬───────────────┘
                           ▼
                    SYSTEM MASTER DATA
```

### Department Management

Departments support:

- Create
- Edit
- Deactivate
- Department Head assignment
- Optional parent department
- Active / Inactive status

### Asset Categories

Examples:

```text
Electronics
Furniture
Vehicles
Equipment
```

Categories can support category-specific information where required.

### Employee Directory

Employee records include:

```text
Name
Email
Department
Role
Status
```

The Admin is the authority for assigning privileged roles.

---

# 📦 Asset Registration & Directory

The Asset Manager registers organizational assets centrally.

Each asset can contain:

- Asset name
- Category
- Asset Tag
- Serial Number
- Acquisition Date
- Acquisition Cost
- Condition
- Location
- Photo
- Documents
- Shared / Bookable flag

Asset tags are automatically generated.

Example:

```text
AF-0001
AF-0002
AF-0003
```

---

# 🔁 Asset Lifecycle

AssetFlow supports the following asset states:

```text
AVAILABLE
ALLOCATED
RESERVED
UNDER_MAINTENANCE
LOST
RETIRED
DISPOSED
```

Typical lifecycle transitions:

```text
                 ┌─────────────────────┐
                 │      AVAILABLE      │
                 └──────────┬──────────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
           ALLOCATED     RESERVED   MAINTENANCE
                │                       │
                │                       ▼
                │               UNDER_MAINTENANCE
                │                       │
                │                       ▼
                │                    RESOLVED
                │                       │
                └───────────────────────┘
                            │
                            ▼
                         AVAILABLE

AVAILABLE / ALLOCATED
          │
          ├────────────► LOST
          │
          ├────────────► RETIRED
          │
          └────────────► DISPOSED
```

Every asset maintains allocation and maintenance history.

---

# 📤 Asset Allocation Flow

Assets can be allocated to employees or departments.

```text
                     SELECT ASSET
                          │
                          ▼
                  CHECK ASSET STATUS
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
           AVAILABLE            ALREADY TAKEN
                │                   │
                ▼                   ▼
           ALLOCATE             BLOCK REQUEST
                │                   │
                ▼                   ▼
          Set Holder /         Show Current
          Department           Holder
                │                   │
                │                   ▼
                │             TRANSFER REQUEST
                │
                ▼
             ALLOCATED
```

### Double-Allocation Prevention

An asset that is already allocated cannot be allocated to another employee directly.

Example:

```text
Laptop AF-0114
       │
       ▼
Held by Priya
       │
       ▼
Raj requests same laptop
       │
       ▼
❌ Allocation Blocked
       │
       ▼
Transfer Request Offered
```

---

# 🔄 Asset Transfer Flow

```text
CURRENT HOLDER
      │
      ▼
TRANSFER REQUEST
      │
      ▼
REVIEW
      │
 ┌────┴────┐
 ▼         ▼
APPROVE   REJECT
 │         │
 ▼         ▼
RE-ALLOCATED  CLOSED
 │
 ▼
UPDATE HISTORY
```

Transfer workflow:

```text
Requested
    ↓
Approved
    ↓
Re-allocated
    ↓
History Updated
```

Approval can be handled by the appropriate Asset Manager or Department Head.

---

# ↩️ Asset Return Flow

```text
                    ALLOCATED ASSET
                           │
                           ▼
                     RETURN REQUEST
                           │
                           ▼
                    CONDITION CHECK
                           │
                           ▼
                  CHECK-IN NOTES
                           │
                           ▼
                         RETURN
                           │
                           ▼
                       AVAILABLE
```

Overdue allocations are automatically flagged when the Expected Return Date has passed.

```text
Expected Return Date
          │
          ▼
       Date Passed?
          │
     ┌────┴────┐
     ▼         ▼
    YES        NO
     │         │
     ▼         ▼
 OVERDUE     UPCOMING
     │
     ▼
Dashboard + Notification
```

---

# 📅 Shared Resource Booking

Shared resources such as rooms, vehicles, and equipment can be booked by time slot.

```text
                 SELECT RESOURCE
                        │
                        ▼
                  SELECT TIME SLOT
                        │
                        ▼
                 CHECK EXISTING
                    BOOKINGS
                        │
                 ┌──────┴──────┐
                 ▼             ▼
              OVERLAP        NO OVERLAP
                 │             │
                 ▼             ▼
              REJECT         CONFIRM
                 │             │
                 │             ▼
                 │          UPCOMING
                 │
                 ▼
              END
```

### Example

```text
Existing:
Room B2 → 09:00–10:00

New Request:
09:30–10:30
       │
       ▼
❌ Rejected — Overlap
```

```text
Existing:
Room B2 → 09:00–10:00

New Request:
10:00–11:00
       │
       ▼
✅ Accepted — No Overlap
```

### Booking States

```text
UPCOMING
ONGOING
COMPLETED
CANCELLED
```

Users can cancel or reschedule bookings, and reminder notifications can be generated before the booking begins.

---

# 🛠️ Maintenance Management

Maintenance requests must pass through approval before repair work starts.

```text
                     ASSET HOLDER
                          │
                          ▼
                  RAISE REQUEST
                          │
                 ┌────────┼────────┐
                 ▼        ▼        ▼
               Asset    Issue    Priority
                          │
                          ▼
                    ATTACH PHOTO
                          │
                          ▼
                       PENDING
                          │
                          ▼
                  ASSET MANAGER
                       REVIEW
                          │
                   ┌──────┴──────┐
                   ▼             ▼
                APPROVE       REJECT
                   │             │
                   ▼             ▼
          UNDER MAINTENANCE     CLOSED
                   │
                   ▼
           TECHNICIAN ASSIGNED
                   │
                   ▼
               IN PROGRESS
                   │
                   ▼
                RESOLVED
                   │
                   ▼
                AVAILABLE
```

### Maintenance State Flow

```text
PENDING
   ↓
APPROVED / REJECTED
   ↓
TECHNICIAN_ASSIGNED
   ↓
IN_PROGRESS
   ↓
RESOLVED
```

When maintenance is approved, the asset moves to:

```text
UNDER_MAINTENANCE
```

After resolution:

```text
UNDER_MAINTENANCE → AVAILABLE
```

Maintenance history is retained for each asset.

---

# 🔍 Asset Audit Flow

AssetFlow supports scheduled audit cycles.

```text
                     ADMIN
                       │
                       ▼
                 CREATE AUDIT
                    CYCLE
                       │
                       ▼
              DEFINE SCOPE
             Department / Location
                       │
                       ▼
               ASSIGN AUDITORS
                       │
                       ▼
                VERIFY ASSETS
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     VERIFIED        MISSING        DAMAGED
        │              │              │
        │              └──────┬───────┘
        │                     ▼
        │             DISCREPANCY REPORT
        │
        └──────────────┬───────────────┘
                       ▼
                 CLOSE AUDIT
                       │
                       ▼
              UPDATE ASSET STATUS
```

Auditors can mark assets as:

```text
VERIFIED
MISSING
DAMAGED
```

The system automatically generates discrepancy reports for flagged assets.

Confirmed missing assets can be marked as:

```text
LOST
```

Audit history is retained for each audit cycle.

---

# 🔔 Notifications & Activity Logs

The system keeps users informed about important operational events.

Examples:

- Asset assigned
- Maintenance approved
- Maintenance rejected
- Booking confirmed
- Booking cancelled
- Booking reminder
- Transfer approved
- Overdue return
- Audit discrepancy
- Important asset activity

All important actions are recorded in activity logs.

```text
USER ACTION
    │
    ▼
SYSTEM EVENT
    │
    ├──────────────► NOTIFICATION
    │
    └──────────────► ACTIVITY LOG
                           │
                           ├── Who
                           ├── What
                           └── When
```

---

# 📊 Dashboard & Analytics

The dashboard provides a real-time operational overview.

### KPI Cards

```text
┌─────────────────────────────────────────────┐
│ Assets Available     │ Assets Allocated     │
├──────────────────────┼──────────────────────┤
│ Maintenance Today    │ Active Bookings      │
├──────────────────────┼──────────────────────┤
│ Pending Transfers     │ Upcoming Returns     │
└─────────────────────────────────────────────┘
```

Overdue returns are highlighted separately from upcoming returns.

### Reports & Analytics

- Asset utilization trends
- Most-used assets
- Idle assets
- Maintenance frequency
- Maintenance by category
- Assets due for maintenance
- Assets nearing retirement
- Department-wise allocation
- Resource booking usage
- Booking peak periods
- Exportable reports

---

# 🔄 Overall Operational Flow

```text
                    ADMIN SETUP
                        │
                        ▼
          Departments / Categories / Employees
                        │
                        ▼
                ASSET REGISTRATION
                        │
                        ▼
                    AVAILABLE
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
      ALLOCATION      BOOKING      MAINTENANCE
          │             │             │
          ▼             ▼             ▼
       EMPLOYEE      RESOURCE      APPROVAL
       / DEPT        BOOKING           │
          │             │              ▼
          │             │         UNDER MAINTENANCE
          │             │              │
          │             │              ▼
          │             │           RESOLVED
          │             │              │
          └─────────────┼──────────────┘
                        │
                        ▼
                     RETURN
                        │
                        ▼
                    AVAILABLE
                        │
                        ▼
                   AUDIT CYCLE
                        │
                        ▼
               REPORTS / ANALYTICS
                        │
                        ▼
             NOTIFICATIONS / LOGS
```

---

# 🧩 Main Modules

```text
AssetFlow
│
├── Authentication
│
├── Organization
│   ├── Departments
│   ├── Categories
│   └── Employees
│
├── Asset Management
│   ├── Registration
│   ├── Directory
│   ├── Allocation
│   ├── Transfer
│   └── Return
│
├── Resource Booking
│
├── Maintenance
│
├── Audits
│
├── Notifications
│
├── Activity Logs
│
└── Reports & Analytics
```

---

# 📁 Project Structure

```text
assetflow-odoo/
│
├── app/
│   ├── ...                    # Next.js App Router
│   └── ...
│
├── public/
│   └── ...                    # Static assets
│
├── backend/
│   ├── ...                    # Node.js / Express API
│   └── ...
│
├── prisma/
│   └── ...                    # Prisma schema and database configuration
│
├── package.json
├── tsconfig.json
├── eslint.config.*
├── tailwind.config.*
└── README.md
```

---

# ⚙️ Environment Configuration

Create a local environment file according to the project's environment configuration.

Typical backend configuration includes:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your_jwt_secret
```

> Never commit real credentials, JWT secrets, or other sensitive environment variables to Git.

---

# 🚀 Getting Started

## Prerequisites

Install:

- Node.js
- npm
- PostgreSQL
- Git

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd assetflow-odoo
```

---

## 2. Install Dependencies

```bash
npm install
```

If the backend is maintained as a separate Node.js application:

```bash
cd backend
npm install
```

---

## 3. Configure Environment Variables

Create the required `.env` files and configure the database and authentication secrets.

---

## 4. Database Setup

Configure PostgreSQL and the Prisma connection.

Run the applicable Prisma database command used by the project:

```bash
npx prisma generate
```

Then synchronize the database schema as required by the development environment.

---

## 5. Start the Application

Start the Next.js application:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

Start the Express backend according to the backend package configuration.

---

# 🧪 Development Workflow

```text
Clone Repository
      │
      ▼
Install Dependencies
      │
      ▼
Configure Environment
      │
      ▼
Start PostgreSQL
      │
      ▼
Generate Prisma Client
      │
      ▼
Start Backend
      │
      ▼
Start Next.js Frontend
      │
      ▼
Login
      │
      ▼
Organization Setup
      │
      ▼
Manage Assets
      │
      ▼
Allocation / Booking / Maintenance
      │
      ▼
Audits
      │
      ▼
Reports & Notifications
```

---

# 📌 Project Scope

AssetFlow focuses on **asset and resource management**.

The platform covers:

- Organization setup
- Employee management
- Asset lifecycle management
- Asset allocation
- Asset transfers
- Asset returns
- Shared resource booking
- Maintenance workflows
- Asset audits
- Notifications
- Activity logs
- Reports and analytics

The system does **not** focus on purchasing, invoicing, or accounting workflows.

---

# 📋 Implementation Status

The project development is organized around the following modules:

```text
Authentication
    ↓
Employee Management
    ↓
Department Management
    ↓
Asset Categories
    ↓
Asset Registration
    ↓
Asset Allocation & Transfer
    ↓
Resource Booking
    ↓
Maintenance
    ↓
Audits
    ↓
Reports & Analytics
    ↓
Notifications & Activity Logs
```

Authentication and the core employee-management foundation are implemented first, followed by the organization and asset-management modules.

---

# 🎯 AssetFlow in One Line

> **AssetFlow centralizes the complete lifecycle of organizational assets and shared resources — from registration and allocation to maintenance, auditing, returns, and reporting.**
