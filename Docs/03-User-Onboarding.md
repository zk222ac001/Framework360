# 03 - User Onboarding

## Purpose

This document explains how new users are created in Framework360.

Seed data creates test users for local development. These users are useful for testing the application quickly, but the application also supports a real user onboarding flow.

The visible application flow is:

```text
Visitor requests demo -> Platform admin reviews request -> Platform admin activates request -> User account is created
```

---

## Step 1: Visitor opens Request Demo

A new visitor opens:

```text
/requestdemo
```

This is a public page. The visitor does not need to be logged in.

The visitor submits:

```text
Email
First name
Last name
Company name
Job title
Country
```

This form is used when a potential customer wants access to the platform.

---

## Step 2: Frontend submits the demo request

When the visitor submits the form, the frontend sends a request to:

```text
POST /demo-requests
```

The request body contains:

```text
email
firstName
lastName
companyName
jobTitle
country
```

At this stage, no user account is created yet.

Instead, the system creates a demo request record.

---

## Step 3: Backend creates pending demo request

The backend validates and normalizes the submitted data.

It checks whether there is already an active demo request for the same email.

If an active request already exists, the backend rejects the request.

If no active request exists, the backend creates a demo request with status:

```text
PENDING
```

Example demo request:

```text
Email: newuser@example.com
First name: Ali
Last name: Khan
Company: New Company ApS
Job title: IT Manager
Country: Denmark
Status: PENDING
```

---

## Step 4: Platform admin reviews request

A platform administrator logs in and opens:

```text
/admin
```

The `/admin` page is only available for users with:

```text
PLATFORM_ADMIN
```

The platform admin can see pending demo requests.

The admin decides whether to activate the request.

---

## Step 5: Platform admin activates request

When the admin activates a demo request, the frontend calls:

```text
POST /demo-requests/:id/activate
```

Only authenticated platform admins can use this endpoint.

---

## Step 6: Backend creates company and user

When a demo request is activated, the backend does the following:

```text
1. Finds the demo request by ID.
2. Checks that the request exists.
3. Checks that it has not already been activated.
4. Checks that no user already exists with the same email.
5. Generates a temporary password.
6. Hashes the temporary password.
7. Creates a company if needed.
8. Creates a new user.
9. Gives the user the CUSTOMER_ADMIN role.
10. Marks the user as active.
11. Sets mustChangePassword to true.
12. Connects the user to the company.
13. Marks the demo request as ACTIVATED.
14. Returns the new user and temporary password.
```

The created user is a company-level administrator.

Example created user:

```text
First name: Ali
Last name: Khan
Email: newuser@example.com
Role: CUSTOMER_ADMIN
Company: New Company ApS
Active: true
Must change password: true
```

---

## Step 7: New user logs in

The new user receives login information from the platform team.

The user opens:

```text
/login
```

The user enters:

```text
Email
Temporary password
```

Because `mustChangePassword` is true, the user should change password after first login.

The application has password change pages:

```text
/change-password
/settings/change-password
```

---

## Direct registration endpoint

The backend also has a direct registration endpoint:

```text
POST /auth/register
```

This endpoint expects:

```text
firstName
lastName
email
password
companyName
cvr
sector
country
```

This route directly creates:

```text
Company if needed
Customer admin user
Relevant company frameworks based on sector
```

However, the visible frontend routes include `/requestdemo` and `/login`, but not a public `/register` page. Therefore, the intended app UI flow appears to be the demo request activation flow.

---

## Summary

New user creation through the app works like this:

```text
1. Visitor opens /requestdemo.
2. Visitor submits contact and company information.
3. Backend stores a PENDING demo request.
4. Platform admin opens /admin.
5. Platform admin activates the request.
6. Backend creates the company if needed.
7. Backend creates a CUSTOMER_ADMIN user.
8. Backend generates a temporary password.
9. New user logs in.
10. New user changes password.
11. New user starts working with company compliance data.
```
