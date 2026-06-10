# 04 - Compliance Workflow

## Purpose

This document explains how compliance work flows through Framework360 from dashboard overview to actions and progress tracking.

Framework360 is designed to help a company answer these questions:

```text
Which compliance frameworks apply to us?
Which requirements are missing?
What actions should we take?
Who is responsible?
What evidence proves completion?
How much progress have we made?
```

---

## Main compliance journey

A typical compliance journey looks like this:

```text
Company logs in
  ↓
Dashboard shows compliance overview
  ↓
User opens a framework
  ↓
User reviews requirements
  ↓
System or user identifies gaps
  ↓
User creates actions
  ↓
User links systems, vendors, processes, and evidence
  ↓
Evidence is reviewed or approved
  ↓
Compliance progress improves
```

---

## Dashboard

After login, the user usually starts at:

```text
/dashboard
```

The dashboard is the main overview page.

It helps the user quickly understand the company’s compliance situation.

Example dashboard information:

```text
Company: CyberPartners
Frameworks: GDPR, ISO 27001, NIS2
Open gaps: 8
Missing evidence: 3
Pending actions: 5
High-risk vendors: 2
```

The dashboard gives the user a quick answer to:

```text
Are we doing well?
What is missing?
What needs attention first?
```

---

## Example company scenario

Imagine this company:

```text
Company: CyberPartners
Sector: IT
Country: Denmark
Role using the system: CUSTOMER_ADMIN
```

Because the company is in the IT sector, the system may recommend frameworks such as:

```text
GDPR
ISO 27001
NIS2
```

The user opens the dashboard and sees that ISO 27001 has missing requirements.

The user then opens the framework assessment page and starts reviewing the missing items.

---

## Compliance objects in the workflow

Framework360 connects several important compliance objects:

```text
Frameworks
Requirements
Gaps
Actions
Evidence
Systems
Vendors
Business processes
Dependencies
Audit findings
Approvals
```

These objects work together.

Example:

```text
Framework: ISO 27001
Requirement: Asset inventory
Gap: No updated asset inventory exists
Action: Create updated asset inventory
System: Microsoft 365
Vendor: Microsoft
Evidence: Asset_Inventory.xlsx
Status: In progress
```

---

## Actions

An action is a practical task created to fix a problem or improve compliance.

Example action:

```text
Action title: Create updated asset inventory
Description: List all critical systems, owners, vendors, and business processes.
Responsible person: IT Manager
Due date: 30 June 2026
Priority: High
Status: Open
```

Actions help the company move from problem identification to real work.

Without actions, a gap only says what is wrong.

With actions, the company knows:

```text
Who will fix it?
What must be done?
When must it be done?
How important is it?
What evidence should be added?
```

---

## Status tracking

Compliance work usually moves through statuses.

Example statuses:

```text
Missing
Open
In progress
Evidence uploaded
Pending approval
Approved
Completed
```

Example flow:

```text
Requirement is missing
  ↓
Action is created
  ↓
Responsible person works on action
  ↓
Evidence is uploaded
  ↓
Evidence is reviewed
  ↓
Requirement status improves
```

---

## Practical example

### Step 1: User sees a gap

```text
Requirement: Incident response procedure
Status: Missing
Risk: High
```

### Step 2: User creates an action

```text
Action: Write and approve incident response procedure
Owner: Security Manager
Due date: 2026-06-30
Priority: High
```

### Step 3: User uploads evidence

```text
Evidence: Incident_Response_Procedure.pdf
Linked requirement: Incident response procedure
Linked framework: ISO 27001
```

### Step 4: Evidence is reviewed

```text
Review status: Approved
```

### Step 5: Compliance status improves

```text
Requirement status: Implemented
```

---

## What the user achieves

By following the compliance workflow, the user achieves:

```text
Clear overview of compliance status
Visibility into missing requirements
Concrete action plans
Ownership of compliance tasks
Evidence linked to requirements
Better audit readiness
Improved compliance progress tracking
```

---

## Simple summary

Framework360 turns compliance work into a structured process:

```text
Find the requirement
Identify the gap
Create the action
Add the evidence
Review the result
Track progress
```
