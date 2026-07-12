# Authentication Module

## Overview
The Authentication module handles secure user registration, login, token management, and role-based access control for AssetFlow ERP. It uses a modern stack with Next.js (App Router), Redux Toolkit, Axios, Node.js, Express, MongoDB, and JSON Web Tokens (JWT).

## Folder Structure

### Backend
- `src/config`: MongoDB connection (`db.ts`)
- `src/controllers`: Request handlers (`auth.controller.ts`)
- `src/middleware`: Auth, Role, Error, Rate Limiter, Validation middlewares
- `src/models`: Mongoose schemas (`User.ts`)
- `src/routes`: API endpoints (`auth.routes.ts`)
- `src/services`: Business logic and DB calls (`auth.service.ts`)
- `src/utils`: Standardized API responses and logger
- `src/validators`: Zod validation schemas (`auth.validator.ts`)

### Frontend
- `app/(auth)/*`: Public authentication pages (Login, Signup, Forgot Password, Reset Password)
- `app/(dashboard)/*`: Protected dashboard layout and page
- `hooks/useAuth.ts`: Custom hook for fetching current user state
- `services/api.ts`: Axios instance with request/response interceptors for automatic token refresh
- `store/authSlice.ts`: Redux slice for managing user state

## Auth Flow
1. **Signup**: User submits details -> Backend hashes password, sets role to `EMPLOYEE` -> Returns User & Tokens -> Frontend stores access token in Redux, redirects to Dashboard.
2. **Login**: User submits credentials -> Backend validates -> Returns User & Tokens (Refresh token set in HTTP-only cookie).
3. **Session Rehydration**: On app load, `useAuth` hook fetches `/api/auth/me`. If access token is expired, the Axios interceptor automatically calls `/api/auth/refresh` to get a new access token using the HTTP-only refresh token cookie.
4. **Logout**: User clicks logout -> Backend clears refresh token -> Frontend clears Redux state and redirects to `/login`.

## JWT Lifecycle
- **Access Token**: Short-lived (15 minutes). Returned in JSON response body and stored in Redux state (in-memory). Sent as `Bearer` token in Authorization header.
- **Refresh Token**: Long-lived (7 days). Stored securely as an HTTP-only, SameSite cookie by the backend. When the access token expires, the frontend sends the cookie to `/api/auth/refresh` to obtain a new access token.
- Refresh tokens are hashed in the database (SHA-256 via bcrypt) for added security in case of DB leak.

## User Schema (MongoDB)
- `firstName`: String, required
- `lastName`: String, required
- `email`: String, required, unique
- `passwordHash`: String, required (never returned in responses)
- `phone`: String, optional
- `role`: Enum (`ADMIN`, `ASSET_MANAGER`, `DEPARTMENT_HEAD`, `EMPLOYEE`), defaults to `EMPLOYEE`
- `status`: Enum (`ACTIVE`, `INACTIVE`), defaults to `ACTIVE`
- `isEmailVerified`: Boolean
- `failedLoginAttempts`: Number
- `refreshTokenHash`: String

## API Reference

### POST /api/auth/signup
Registers a new user (forces EMPLOYEE role).
**Request**: `{ "firstName": "John", "lastName": "Doe", "email": "john@test.com", "password": "password123" }`
**Response**: `{ "success": true, "message": "User created...", "data": { "user": {...}, "accessToken": "..." } }`

### POST /api/auth/login
Authenticates user and returns tokens.
**Request**: `{ "email": "john@test.com", "password": "password123" }`
**Response**: `{ "success": true, "message": "Login successful", "data": { "user": {...}, "accessToken": "..." } }`

### POST /api/auth/refresh
Issues a new access token using the refresh token cookie.
**Request**: `Cookie: refreshToken=...`
**Response**: `{ "success": true, "message": "Token refreshed", "data": { "accessToken": "..." } }`

### POST /api/auth/logout
Logs out the user and clears the refresh token.
**Request**: `Cookie: refreshToken=...`
**Response**: `{ "success": true, "message": "Logged out successfully" }`

### POST /api/auth/forgot-password
Initiates the password reset flow.
**Request**: `{ "email": "john@test.com" }`
**Response**: `{ "success": true, "message": "If the email is registered..." }`

### POST /api/auth/reset-password/:token
Resets the user's password.
**Request**: `{ "password": "newpassword123" }`
**Response**: `{ "success": true, "message": "Password has been reset successfully." }`

### GET /api/auth/me
Returns current user's profile based on access token.
**Request**: `Authorization: Bearer <accessToken>`
**Response**: `{ "success": true, "message": "User profile fetched", "data": { ...user_details } }`
