# Gym Management Backend - How it Works

This document explains the technical implementation, data storage, and operational flow of the backend system.

## 1. Technology Stack
- **Runtime**: Node.js (v24+)
- **Framework**: Express.js (v4.21)
- **Database Layer**: Prisma ORM (Object-Relational Mapping)
- **Database**: SQLite (Local file-based database)
- **Security**: JWT (JSON Web Tokens) for authentication, `bcryptjs` for password hashing.

## 2. Where Data is Stored
For ease of setup and local development, the system currently uses **SQLite**.
- **Database File**: `backend/prisma/dev.db`
- **What is stored**: 
  - Admin credentials (hashed)
  - Member profiles
  - Membership plans
  - Subscription records
  - Payment history
  - Attendance logs

> [!NOTE]
> To upgrade to **PostgreSQL** in production, you only need to update the `DATABASE_URL` in `backend/.env` and change the provider in `schema.prisma`.

## 3. Step-by-Step: How it Works

### A. Authentication Flow
1. **Login**: The frontend sends an email and password to `POST /api/auth/login`.
2. **Verification**: The backend finds the user in the database and compares the provided password with the stored hash using `bcrypt`.
3. **Token Issuance**: If valid, the backend creates a JWT signed with a secret key. This token is returned to the frontend.
4. **Guarding**: For all subsequent requests (e.g., fetching members), the frontend sends this token in the `Authorization` header. The `auth` middleware verifies it before letting the request through.

### B. Member Directory Flow
1. **Fetching**: When you open `members.html`, a JavaScript function `fetchMembers()` is called.
2. **API Request**: It calls `GET /api/members` with the JWT token.
3. **Database Query**: Prisma fetches all member records from `dev.db`, including their latest membership status.
4. **Rendering**: The frontend clears the "mock" rows and dynamically creates new HTML rows for each member returned by the API.

### D. Member Account Automation
1. **Creation**: When an admin adds a member, the system creates a `User` record with `role: "member"`.
2. **Access Code**: The last 6 digits of the member's phone number are hashed and stored as their initial password.
3. **Portal Login**: Members use their email and this 6-digit code at `user-login.html`.
4. **Personal Stats**: The `GET /api/user/profile` route retrieves data *only* for the authenticated member.

## 4. Running the Backend
1. Go to the `backend/` directory.
2. Run `npm run dev` to start the server with auto-refresh (via nodemon).
3. The server runs on `http://localhost:5000`.
