# 02 - Authentication

## User roles in the system

The system has different user roles.

### Platform Administrator

The platform administrator manages the platform and can activate demo requests.

```text
Role: PLATFORM_ADMIN
Purpose: Manage platform-level access and approve demo requests
```

### Customer Administrator

The customer administrator belongs to a company and manages that company’s compliance information.

```text
Role: CUSTOMER_ADMIN
Purpose: Manage company compliance data, frameworks, evidence, systems, vendors, and processes
```

### Compliance Manager

```text
Role: COMPLIANCE_MANAGER
Purpose: Manage compliance workflows for a customer company
```

### Evidence Contributor

```text
Role: EVIDENCE_CONTRIBUTOR
Purpose: Upload and maintain evidence for assigned compliance work
```

### Auditor

```text
Role: AUDITOR
Purpose: Review compliance information with limited operational access
```

For local seeded account credentials, run the development seed and check the project README:

```bash
docker compose exec backend npm run seed:dev
```

The development seed creates the base platform admin account plus local demo users for testing.

---

## How a user logs in

A user opens the application and goes to the login page.

The user enters:

```text
Email
Password
Remember me option
```

When the user clicks login, the frontend sends the login request to the backend:

```text
POST /auth/login
```

The submitted login information contains:

```text
email
password
rememberMe
```

---

## Backend login process

The backend performs these checks:

```text
1. Find the user by email.
2. Check whether the user exists.
3. Check whether the user is active.
4. Check whether the account uses a local password or SSO.
5. Compare the submitted password with the stored hashed password.
6. If the password is correct, update the last login time.
7. Create a JWT token.
8. Store the token in an authentication cookie.
9. Return the logged-in user information to the frontend.
```

The JWT token contains:

```text
userId
email
role
companyId
```

If `rememberMe` is selected, the login token lasts longer. Otherwise, it lasts for a shorter session.

---

## What information is returned after login?

After successful login, the backend returns user and company information.

Example response structure:

```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "role": "CUSTOMER_ADMIN",
    "isActive": true,
    "mustChangePassword": false,
    "onboardingCompleted": false,
    "companyId": "...",
    "company": {
      "name": "...",
      "cvr": "...",
      "sector": "IT",
      "country": "DK"
    }
  }
}
```

The frontend uses this information to understand:

```text
Who is logged in
Which company the user belongs to
What role the user has
Whether the user is active
Whether the user must change password
Whether onboarding is completed
Which company data should be displayed
```

---

## How the browser stays logged in

After login, the backend stores the JWT token in a cookie.

The frontend sends cookies automatically with future API requests.

So the flow becomes:

```text
User logs in
  ↓
Backend creates token
  ↓
Backend stores token in cookie
  ↓
Frontend sends cookie with future requests
  ↓
Backend knows which user is making the request
```

This is why the user does not need to enter email and password again on every page.

---

## How the application checks the current user

When the page refreshes, the frontend can ask the backend:

```text
GET /auth/me
```

This tells the frontend whether a user is already logged in.

The backend checks the authentication cookie and returns the current user.

This helps the frontend decide:

```text
Should the user stay inside the dashboard?
Should the user be redirected to login?
Which role does this user have?
Which company data should be loaded?
```

---

## Protected pages

Some pages are public, and some pages are protected.

### Public pages

Examples:

```text
/
/login
/requestdemo
/features
/pricing
/about
```

These pages can be visited without logging in.

### Protected pages

Examples:

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

These pages require login.

### Admin-only page

```text
/admin
```

This page is only for users with:

```text
PLATFORM_ADMIN
```
