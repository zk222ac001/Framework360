# 08 - Developer Guide

## Purpose

This document gives a beginner-friendly developer overview of the Framework360 project.

It explains:

```text
How the project is organized
How frontend and backend communicate
How authentication works technically
How the database is used
How to run the application
How to seed demo data
How to test the application
Where to start reading the code
```

---

## Project structure

The project is organized into frontend, backend, database, Docker, and documentation areas.

Example structure:

```text
Framework360/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── features/
│   │   ├── layouts/
│   │   ├── router/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── app.js
│   │   ├── server.js
│   │   └── db.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   ├── seed.dev.js
│   │   ├── seed.prod.js
│   │   └── seed-data/
│   └── tests/
│
├── docker/
├── Docs/
├── docker-compose.yml
└── README.md
```

---

## Frontend overview

The frontend is built with React and TypeScript.

Main frontend responsibilities:

```text
Show pages and forms to the user
Handle routing between pages
Send API requests to the backend
Display backend responses
Handle login state and protected pages
```

Important frontend files:

```text
frontend/src/main.tsx
frontend/src/App.tsx
frontend/src/router/appRouter.tsx
frontend/src/api/http.ts
frontend/src/api/auth.ts
frontend/src/api/demoRequest.ts
frontend/src/features/
frontend/src/layouts/
frontend/src/components/ProtectedRoute.tsx
```

---

## Frontend entry point

The frontend starts from:

```text
frontend/src/main.tsx
```

This file mounts the React application into the browser page.

The general idea is:

```text
index.html contains a root element
React finds that root element
React renders the application inside it
```

---

## Frontend routing

Routes are configured in:

```text
frontend/src/router/appRouter.tsx
```

The router defines public, protected, and admin-only pages.

Public routes include:

```text
/
/login
/requestdemo
/features
/pricing
/about
```

Protected routes include:

```text
/dashboard
/audit
/findings
/evidence-campaigns
/workflows
/copilot
/vendor-risk
/vendors
/systems
/business-processes
/dependencies
/frameworks/add
/frameworks/:code
/settings
/evidence
```

Admin-only route:

```text
/admin
```

---

## API helper

The frontend uses a shared API helper in:

```text
frontend/src/api/http.ts
```

This helper is responsible for:

```text
Building backend API URLs
Sending requests
Including cookies
Sending JSON headers
Handling FormData uploads
Parsing responses
Throwing readable errors
```

The backend base URL is normally:

```text
http://localhost:23000
```

unless changed through an environment variable.

---

## Authentication frontend API

Authentication API functions are in:

```text
frontend/src/api/auth.ts
```

Important functions:

```text
login              -> Sends login credentials to backend
getMe              -> Gets currently logged-in user
logoutRequest      -> Logs out current user
changePassword     -> Changes current password
updateMyProfile    -> Updates first name and last name
updateMyEmail      -> Updates email address
```

---

## Demo request frontend API

Demo request functions are in:

```text
frontend/src/api/demoRequest.ts
```

Important functions:

```text
submitDemoRequest  -> Public user submits request demo form
getDemoRequests    -> Platform admin retrieves requests
activateDemoRequest -> Platform admin activates a request and creates user access
```

---

## Backend overview

The backend is built with Node.js and Express.

Main backend responsibilities:

```text
Expose API endpoints
Validate requests
Authenticate users
Authorize user roles
Read and write database data
Create users and companies
Manage compliance data
Return JSON responses to frontend
```

Important backend files:

```text
backend/src/server.js
backend/src/app.js
backend/src/db.js
backend/src/routes/
backend/src/middleware/
backend/src/validators/
backend/src/utils/
backend/prisma/schema.prisma
backend/prisma/seed.js
backend/tests/
```

---

## Backend server file

The backend server usually starts from:

```text
backend/src/server.js
```

This file starts the Express application and listens on a port.

Example concept:

```text
Import app
Choose port
Start listening
Print server started message
```

---

## Backend app file

The main Express app is configured in:

```text
backend/src/app.js
```

This file usually configures:

```text
CORS
JSON request parsing
Cookies
Routes
Error handling
```

It connects route files such as authentication, dashboard, demo requests, frameworks, evidence, and other feature routes.

---

## Database connection

The database connection is usually handled in:

```text
backend/src/db.js
```

This file creates and exports the Prisma client.

Prisma is used so backend code can query the database using JavaScript instead of writing raw SQL for every query.

Example concept:

```text
Backend route receives request
Route calls Prisma client
Prisma queries PostgreSQL
Route returns result to frontend
```

---

## Prisma

Prisma is the ORM used by the backend.

Important Prisma files:

```text
backend/prisma/schema.prisma
backend/prisma/seed.js
backend/prisma/seed.dev.js
backend/prisma/seed.prod.js
backend/prisma/seed-data/
```

The schema file defines database models such as users, companies, demo requests, frameworks, evidence, systems, vendors, and other records.

The base seed creates the platform administrator. The development seed adds local test users and demo companies. The production seed bootstraps the first platform administrator from production environment variables without overwriting existing user passwords.

---

## Authentication backend flow

Login endpoint:

```text
POST /auth/login
```

General backend flow:

```text
1. Read email, password, and rememberMe from request body.
2. Find user by normalized email.
3. Include company information.
4. Reject if user does not exist.
5. Reject if user is inactive.
6. Reject if user uses SSO and has no local password.
7. Compare submitted password with stored hashed password.
8. Update lastLogin.
9. Log successful login.
10. Create JWT token.
11. Store token in cookie.
12. Return user profile and company information.
```

---

## Authorization

Authentication answers:

```text
Who is this user?
```

Authorization answers:

```text
What is this user allowed to access?
```

Examples:

```text
Any logged-in user can access /dashboard.
Only PLATFORM_ADMIN can access /admin.
Customer users should only access their own company data.
```

---

## Running the application with Docker

The project is designed to run with Docker Compose.

From the project root directory, run:

```bash
docker compose up --build
```

The application should be available at:

```text
Frontend: http://localhost:25173
Backend API: http://localhost:23000
```

The backend automatically runs Prisma database synchronization when the container starts.

---

## Creating demo data

After the containers start, open a new terminal and run:

```bash
docker compose exec backend npm run seed:dev
```

This creates demo users and sample data for development.

The development seed creates the base platform admin account and the local demo accounts listed in the README.

To completely reset the development database and recreate demo data:

```bash
docker compose exec backend npm run db:reset:dev
```

Warning:

```text
This deletes existing development database data.
```

---

## Accessing Prisma Studio

Prisma Studio can be used to inspect database records visually.

Run:

```bash
docker compose exec backend npx prisma studio --hostname 0.0.0.0
```

Then open:

```text
http://localhost:5555
```

Use this to inspect tables such as users, companies, demo requests, frameworks, and evidence records.

---

## Manual testing checklist

### 1. Start application

```bash
docker compose up --build
```

Expected:

```text
Frontend opens on http://localhost:25173
Backend opens on http://localhost:23000
```

### 2. Seed demo data

```bash
docker compose exec backend npm run seed:dev
```

Expected:

```text
Demo users and sample company data are created.
```

### 3. Test login

Open:

```text
http://localhost:25173/login
```

Use a seeded test account from the README.

Expected:

```text
User logs in successfully and reaches protected application area.
```

### 4. Test protected route

Open:

```text
http://localhost:25173/dashboard
```

Expected:

```text
Logged-in user can access dashboard.
Logged-out user is redirected to login.
```

### 5. Test request demo

Open:

```text
http://localhost:25173/requestdemo
```

Submit a new demo request.

Expected:

```text
Demo request is created with PENDING status.
```

### 6. Test admin activation

Log in as a platform admin and open:

```text
http://localhost:25173/admin
```

Activate the demo request.

Expected:

```text
Company is created if needed.
CUSTOMER_ADMIN user is created.
Temporary password is generated.
Demo request status becomes ACTIVATED.
```

### 7. Test compliance pages

Open protected pages:

```text
/dashboard
/frameworks/add
/frameworks/:code
/evidence
/vendors
/systems
/business-processes
/dependencies
/audit
/findings
/workflows
/vendor-risk
/copilot
```

Expected:

```text
Pages load for authenticated users.
Company-specific data is displayed.
Unauthorized users cannot access restricted pages.
```

---

## Automated testing

Backend tests are located in:

```text
backend/tests/
```

The backend uses Jest configuration:

```text
backend/jest.config.js
```

Run tests from the backend container or backend directory depending on environment setup.

Example command inside Docker environment:

```bash
docker compose exec backend npm test
```

If tests fail, common reasons include:

```text
Database not initialized
Demo/test data missing
Environment variables missing
Docker containers not running
Prisma client not generated
```

---

## Suggested order for reading the code

For beginners, read the code in this order:

```text
1. README.md
2. frontend/src/router/appRouter.tsx
3. frontend/src/api/http.ts
4. frontend/src/api/auth.ts
5. frontend/src/api/demoRequest.ts
6. backend/src/server.js
7. backend/src/app.js
8. backend/src/db.js
9. backend/src/routes/auth.routes.js
10. backend/src/routes/demoRequest.routes.js
11. backend/prisma/schema.prisma
12. backend/prisma/seed.js
```

This order helps you understand:

```text
How the app runs
Which pages exist
How frontend talks to backend
How login works
How users are created
How data is stored
```

---

## Common beginner mistakes

### Docker not running

Make sure Docker Desktop or Docker Engine is running before using Docker Compose.

### Running command from wrong directory

Run Docker commands from the project root where `docker-compose.yml` exists.

### Forgetting seed data

If login fails with test users, seed data may not have been created.

Run:

```bash
docker compose exec backend npm run seed:dev
```

### Database needs reset

If data becomes inconsistent during testing, reset the development database:

```bash
docker compose exec backend npm run db:reset:dev
```

### Frontend cannot reach backend

Check that backend is running at:

```text
http://localhost:23000
```

Also check frontend API base URL configuration.

### Protected page redirects to login

This usually means the user is not logged in, the auth cookie is missing, or the session expired.

---

## Developer summary

Framework360 works technically like this:

```text
React frontend displays pages and forms.
Frontend sends API requests using apiFetch.
Express backend receives the requests.
Middleware validates input and checks authentication.
Routes execute business logic.
Prisma reads and writes data in PostgreSQL.
Backend returns JSON responses.
Frontend updates the UI.
```

Core flow:

```text
User action -> Frontend API call -> Backend route -> Prisma database query -> JSON response -> UI update
```

This is the basic pattern used throughout the application.
