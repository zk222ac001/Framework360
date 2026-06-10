# How Framework360 System Works

## 1. Project overview

Framework360 is a compliance management web application. It helps a company understand:

- Which compliance frameworks apply to the company
- What requirements the company must follow
- Where the company has compliance gaps
- What actions are needed to close those gaps
- What evidence is available to prove compliance
- Which systems, vendors, business processes, and dependencies are connected to compliance work

In simple words, Framework360 helps a company move from unclear compliance work to an organized overview of requirements, risks, tasks, and evidence.

---

## 2. Main parts of the application

The application has three main technical parts:

```text
Frontend  -> What the user sees in the browser
Backend   -> The API/server that handles business logic
Database  -> Where users, companies, frameworks, evidence, tasks, and other data are stored
```

The project uses:

```text
React + TypeScript  -> Frontend
Node.js + Express   -> Backend
SQLite + Prisma ORM -> Database
Docker Compose      -> Running the full system locally
```

General request flow:

```text
User
  ↓
Browser frontend
  ↓
Backend API
  ↓
Database
  ↓
Backend API response
  ↓
Frontend updates the screen
```

---

## 3. What problem does Framework360 solve?

Companies often need to follow different compliance frameworks such as GDPR, ISO 27001, or NIS2. Without a system, this can become confusing because requirements, documents, evidence, systems, vendors, and tasks may be spread across emails, spreadsheets, and folders.

Framework360 helps by connecting everything in one place:

```text
Framework -> Requirement -> Gap -> Action -> Evidence -> Approval -> Compliance progress
```

Example:

```text
Framework: ISO 27001
Requirement: Maintain an asset inventory
Gap: No updated asset inventory exists
Action: Create updated asset inventory
Evidence: Asset_Inventory.xlsx
Status: In progress or completed
```

---

## 4. User roles in the system

The system has different user roles. From the demo/test data, these roles exist:

### Platform Administrator

```text
Email: dev.admin@eucompliance.test
Password: DevAdmin123
Role: PLATFORM_ADMIN
```

The platform administrator manages the platform and can activate demo requests.

### Customer Administrator

```text
Email: simon@test.dk
Password: Test1234
Role: CUSTOMER_ADMIN
Company: CyberPartners
CVR: 12345678
Sector: IT
Country: DK
```

The customer administrator belongs to a company and manages that company’s compliance information.

### Demo User

```text
Email: demo@test.dk
Password: Test1234
Role: DEMO_USER
Company: Demo Company
CVR: 87654321
Sector: IT
Country: DK
```

The demo user is used for testing and demonstration.

---

## 5. How a user logs in

A user opens the application and goes to the login page.

Example login information:

```text
Email: simon@test.dk
Password: Test1234
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

### Backend login process

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

## 6. What information is returned after login?

After successful login, the backend returns user and company information.

Example response structure:

```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "firstName": "Simon",
    "lastName": "...",
    "email": "simon@test.dk",
    "role": "CUSTOMER_ADMIN",
    "isActive": true,
    "mustChangePassword": false,
    "onboardingCompleted": false,
    "companyId": "...",
    "company": {
      "name": "CyberPartners",
      "cvr": "12345678",
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

## 7. How the browser stays logged in

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

## 8. How the application checks the current user

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

## 9. Protected pages

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

---

## 10. What the user achieves after login

After login, the system knows:

```text
This is the user.
This user belongs to this company.
This user has this role.
This user can access this company’s compliance data.
```

For example:

```text
User: Simon
Company: CyberPartners
Role: CUSTOMER_ADMIN
Sector: IT
Country: DK
```

The user can now access company-specific compliance features such as:

```text
Dashboard overview
Compliance frameworks
Requirements
Gaps
Action plans
Evidence
Vendors
Systems
Business processes
Dependencies
Audit findings
Workflow approvals
Vendor risk
AI compliance copilot
```

---

## 11. Demo scenario: CyberPartners uses Framework360

Imagine this company:

```text
Company: CyberPartners
Sector: IT
Country: Denmark
CVR: 12345678
User: Simon
Role: CUSTOMER_ADMIN
```

Simon logs in with:

```text
Email: simon@test.dk
Password: Test1234
```

After login, Simon reaches the dashboard.

The dashboard gives an overview like:

```text
Company: CyberPartners
Frameworks: GDPR, ISO 27001, NIS2
Open gaps: 8
Missing evidence: 3
Pending actions: 5
High-risk vendors: 2
```

This is the starting point for compliance work.

---

## 12. How frameworks work

A compliance framework is a set of rules or requirements.

Examples:

```text
GDPR      -> Personal data protection
ISO 27001 -> Information security management
NIS2      -> Cybersecurity obligations
```

Because CyberPartners is in the IT sector, the system can suggest frameworks that may be relevant.

Example:

```text
Company sector: IT
Recommended frameworks: GDPR, ISO 27001, NIS2
```

The user can open a framework assessment page:

```text
/frameworks/:code
```

Example:

```text
/frameworks/ISO27001
```

On this page, the user can see requirements and their status.

Example:

```text
Requirement: Access control policy
Status: Partially implemented

Requirement: Asset inventory
Status: Missing

Requirement: Incident response procedure
Status: Implemented
```

---

## 13. How gaps work

A gap means something required is missing or incomplete.

Example:

```text
Framework: ISO 27001
Requirement: Asset inventory
Expected: The company must maintain a list of important IT assets
Current status: Missing
Gap: No updated asset inventory exists
Risk: High
```

In simple words:

```text
The rule says the company needs an asset inventory.
The company does not have an updated asset inventory.
Framework360 marks this as a compliance gap.
```

The value is that the company can clearly see:

```text
What is missing?
Why is it important?
How serious is it?
What should be done next?
```

---

## 14. How actions work

After a gap is found, the user can create an action plan.

Example action:

```text
Action title: Create updated asset inventory
Description: List all critical systems, owners, vendors, and business processes.
Responsible person: IT Manager
Due date: 30 June 2026
Priority: High
Status: Open
```

This turns a compliance problem into practical work.

Instead of only saying:

```text
We are missing asset inventory.
```

The system helps define:

```text
Who will fix it?
What must be done?
When must it be done?
What evidence is needed?
Which requirement does it support?
```

---

## 15. How systems work

The user can go to:

```text
/systems
```

Here the company can register important IT systems.

Example systems:

```text
System: Microsoft 365
Owner: IT Department
Purpose: Email, documents, collaboration
Data type: Personal data, business documents
Criticality: High

System: CRM
Owner: Sales Department
Purpose: Customer management
Data type: Customer contact information
Criticality: Medium
```

Systems are important because compliance requirements often apply to the systems that store or process data.

Example:

```text
GDPR applies because Microsoft 365 and CRM may contain personal data.
ISO 27001 applies because these systems are information assets that must be protected.
```

---

## 16. How vendors work

The user can go to:

```text
/vendors
```

Here the company can register vendors and third-party providers.

Example vendors:

```text
Vendor: Microsoft
Service: Microsoft 365
Risk level: High
Data processed: Personal data
Contract needed: Data processing agreement

Vendor: AWS
Service: Cloud hosting
Risk level: High
Data processed: Application and customer data
Contract needed: Security agreement
```

Vendors matter because a company may depend on external providers for important systems or data processing.

Framework360 helps connect:

```text
Vendor -> System -> Business Process -> Compliance Requirement -> Evidence
```

Example:

```text
Microsoft supports Microsoft 365.
Microsoft 365 supports HR onboarding and internal communication.
Microsoft 365 contains employee personal data.
Therefore, GDPR evidence may be needed.
```

---

## 17. How business processes work

The user can go to:

```text
/business-processes
```

Here the company can register business processes.

Example:

```text
Process: Employee onboarding
Department: HR
Systems used: Microsoft 365, HR system
Data involved: Employee personal data
Compliance relevance: GDPR
```

Another example:

```text
Process: Customer support
Department: Support
Systems used: CRM, ticket system
Data involved: Customer names, emails, support history
Compliance relevance: GDPR, ISO 27001
```

Business processes matter because compliance is connected to real company activities.

The company needs to know:

```text
Which processes use personal data?
Which systems support those processes?
Which vendors support those systems?
Which compliance requirements apply?
```

---

## 18. How dependencies work

The user can go to:

```text
/dependencies
```

Dependencies show relationships between systems, vendors, and business processes.

Example:

```text
Business Process: Customer Support
Depends on: CRM system
CRM system depends on: AWS hosting
AWS hosting depends on: Vendor contract and security controls
```

This helps the company understand risk impact.

Example:

```text
If AWS has a problem, which system is affected?
Which business process is affected?
Which compliance requirement is affected?
```

---

## 19. How evidence works

The user can go to:

```text
/evidence
```

Evidence means proof that the company is meeting a requirement.

Examples of evidence:

```text
Access control policy PDF
Risk assessment document
Vendor contract
Data processing agreement
Incident response procedure
Screenshot of system settings
Training completion report
Asset inventory spreadsheet
```

Example evidence entry:

```text
Evidence title: Asset inventory spreadsheet
Linked framework: ISO 27001
Linked requirement: Asset inventory
Linked system: Microsoft 365
Status: Uploaded
Review date: 1 year from now
```

Evidence matters because it is not enough to say:

```text
We are compliant.
```

The company must prove it.

Framework360 helps answer:

```text
Which evidence do we have?
Which requirement does it support?
Which evidence is missing?
When should evidence be reviewed again?
```

---

## 20. How audit findings work

The user can go to:

```text
/findings
```

Audit findings show issues discovered during review or audit.

Example finding:

```text
Finding: No formal vendor risk review for Microsoft 365
Severity: Medium
Related framework: ISO 27001
Related vendor: Microsoft
Recommended action: Perform vendor security review and upload evidence
```

This helps the company prepare for internal and external audits.

---

## 21. How workflows and approvals work

The user can go to:

```text
/workflows
```

Workflows help manage approvals.

Example:

```text
Evidence uploaded: Incident Response Policy
Waiting for approval from: Compliance Manager
Status: Pending approval
```

This allows someone to review whether uploaded evidence is correct and acceptable.

---

## 22. How vendor risk works

The user can go to:

```text
/vendor-risk
```

Vendor risk helps the company understand risks from external providers.

Example:

```text
Vendor: AWS
Risk: High
Reason:
- Hosts important systems
- Processes customer data
- Requires security agreement
- Requires regular review
```

This helps identify which vendors are most critical and require more attention.

---

## 23. How AI Compliance Copilot works

The user can go to:

```text
/copilot
```

The AI Compliance Copilot helps users understand compliance work.

Example question:

```text
What evidence do I need for ISO 27001 asset inventory?
```

Example answer:

```text
You should provide an asset inventory showing system name, owner, classification, criticality, vendor, and review date.
```

The copilot helps users who are unsure what a requirement means or what evidence is needed.

---

## 24. Complete demo story

CyberPartners logs into Framework360.

The system knows CyberPartners is an IT company in Denmark.

Because of that, the system suggests relevant frameworks like GDPR, ISO 27001, and NIS2.

Simon opens the dashboard and sees that ISO 27001 has missing requirements.

He opens the ISO 27001 assessment page and sees that Asset Inventory is missing.

He creates an action:

```text
Create updated asset inventory
```

Then he goes to Systems and adds:

```text
Microsoft 365
CRM
AWS-hosted application
```

He goes to Vendors and adds:

```text
Microsoft
AWS
```

He goes to Business Processes and connects Microsoft 365 to:

```text
HR onboarding
Internal communication
```

He goes to Evidence and uploads an asset inventory document.

Now the ISO 27001 requirement can move from:

```text
Missing
```

to:

```text
Evidence uploaded
```

or:

```text
In progress
```

Later, an auditor or compliance manager can review and approve the evidence.

Now CyberPartners has a better compliance overview.

---

## 25. What the user submits

The user may submit different information depending on the part of the app.

### Login

```text
Email
Password
Remember me option
```

### Demo request

```text
Email
First name
Last name
Company name
Job title
Country
```

### Company/profile information

```text
Company name
CVR
Sector
Country
First name
Last name
Email
Password
```

### Compliance work

```text
Framework selections
Requirement answers/statuses
Systems
Vendors
Business processes
Dependencies
Evidence documents
Actions/tasks
Audit findings
Workflow approvals
```

---

## 26. What the user achieves

By using Framework360, the user achieves:

```text
A clear compliance dashboard
Knowledge of relevant frameworks
Overview of missing requirements
Action plans to fix gaps
Evidence connected to requirements
System and vendor risk overview
Business process mapping
Audit preparation
Workflow and approval tracking
Better compliance progress visibility
```

Before using the system, compliance may be unclear and spread across many files.

After using the system, the company has one place where compliance work is organized.

---

## 27. How new users are created

Seed data creates test users for development. These users are useful for testing the application quickly.

However, in the real application flow, new users are created through the demo request process.

### Step 1: Visitor opens Request Demo

The visitor goes to:

```text
/requestdemo
```

The visitor submits:

```text
Email
First name
Last name
Company name
Job title
Country
```

### Step 2: Backend creates a demo request

The frontend sends the request to:

```text
POST /demo-requests
```

The backend creates a demo request with status:

```text
PENDING
```

At this stage, a user account is not created yet.

### Step 3: Platform admin reviews the request

The platform admin logs in:

```text
Email: dev.admin@eucompliance.test
Password: DevAdmin123
Role: PLATFORM_ADMIN
```

The admin opens:

```text
/admin
```

The admin can see pending demo requests.

### Step 4: Platform admin activates the request

The admin activates the request.

The frontend calls:

```text
POST /demo-requests/:id/activate
```

The backend then:

```text
1. Finds the demo request.
2. Checks it is not already activated.
3. Checks no user already exists with the same email.
4. Generates a temporary password.
5. Hashes the temporary password.
6. Creates a company if needed.
7. Creates a new user.
8. Sets the user role to CUSTOMER_ADMIN.
9. Sets mustChangePassword to true.
10. Marks the demo request as ACTIVATED.
11. Returns the user and temporary password.
```

### Step 5: New user logs in

The new user receives login information:

```text
Email: user email from request
Password: temporary generated password
```

Then the user logs in through:

```text
/login
```

Because `mustChangePassword` is true, the user should change password after first login.

---

## 28. Direct registration endpoint

The backend also has a direct registration endpoint:

```text
POST /auth/register
```

This route expects:

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

This endpoint directly creates:

```text
Company if needed
Customer admin user
Relevant company frameworks based on sector
```

However, the visible frontend routes include `/requestdemo` and `/login`, but not a public `/register` page. Therefore, the intended app UI flow appears to be:

```text
Visitor requests demo -> Platform admin activates -> User account is created
```

---

## 29. Simple summary

Framework360 works like this:

```text
1. A company/user requests access.
2. A platform admin activates the request.
3. The system creates a company and user account.
4. The user logs in.
5. The system knows the user, company, and role.
6. The user sees relevant frameworks and compliance overview.
7. The user identifies missing requirements.
8. The user creates actions to fix gaps.
9. The user adds systems, vendors, business processes, and dependencies.
10. The user uploads evidence.
11. Evidence and actions support compliance progress.
12. The company becomes better prepared for audits and compliance reviews.
```

Very simple explanation:

```text
Framework360 turns compliance confusion into organized work.
```

Instead of having documents, vendors, systems, and tasks scattered everywhere, the system connects them together:

```text
Company -> Frameworks -> Requirements -> Gaps -> Actions -> Evidence -> Audit readiness
```
