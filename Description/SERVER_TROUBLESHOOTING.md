# Troubleshooting Server Connection Errors

If you encounter a "Server connection error" or cannot log in, it typically means the frontend (website) cannot communicate with the backend (server).

## Common Causes & Fixes

### 1. The Backend Server is Not Running
The most common cause is that the Node.js server hasn't been started. The frontend depends on this server to authenticate users, fetch data, and process check-ins.

**How to fix:**
Open a terminal, navigate to the `backend` folder, and start the development server:
```bash
cd backend
npm run dev
```
You should see a message saying: `🚀 Server running on http://localhost:5000`

### 2. Accessing the Site Incorrectly
The site should be accessed through the backend server, NOT by directly opening the HTML files (e.g., `file:///C:/.../index.html`).

**How to fix:**
Once the backend is running, open your web browser and go to:
`http://localhost:5000`

### 3. Database Issues
If the server starts but you still get errors, the database might not be initialized properly.

**How to fix:**
In the `backend` folder, run the following commands to recreate the database and seed it with initial data:
```bash
npx prisma generate
npx prisma db push
node prisma/seed.js
```

## Recent Changes Made
To prevent connection issues when hosting or accessing from different devices, all API calls in the frontend files (`members.html`, `check-in.html`, `user-portal.html`) have been updated from hardcoded `http://localhost:5000/api/...` to use relative paths (`/api/...`). This ensures the frontend always communicates with the server that is currently hosting it.
