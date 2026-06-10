# 06 - Evidence Management

## Purpose

This document explains how evidence, systems, vendors, business processes, and dependencies work together in Framework360.

Evidence management is important because compliance is not only about saying that a company follows rules. The company must be able to prove it.

In simple words:

```text
Requirement says what must be done.
Evidence proves that it was done.
```

---

## What is evidence?

Evidence is proof that a company satisfies a compliance requirement.

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
Audit report
Approval record
```

Evidence can be linked to frameworks, requirements, systems, vendors, and business processes.

---

## Evidence page

The user can open:

```text
/evidence
```

This page gives an overview of available compliance evidence.

The user can use it to understand:

```text
Which evidence exists?
Which evidence is missing?
Which requirement does the evidence support?
Which evidence needs review?
Which evidence is connected to systems or vendors?
```

---

## Example evidence record

Example:

```text
Evidence title: Asset inventory spreadsheet
File name: Asset_Inventory.xlsx
Linked framework: ISO 27001
Linked requirement: Asset inventory
Linked system: Microsoft 365
Status: Uploaded
Review date: 1 year from now
Owner: IT Manager
```

This means the uploaded file supports the ISO 27001 asset inventory requirement.

---

## Why evidence matters

Without evidence, a company may say:

```text
We are compliant.
```

But during an audit, the company must prove it.

Framework360 helps the company answer:

```text
Where is the proof?
Which requirement does this proof support?
Who owns the evidence?
When was it last reviewed?
Is the evidence still valid?
```

---

## Systems

The user can open:

```text
/systems
```

Systems are important applications, services, or technical platforms used by the company.

Examples:

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

System: HR System
Owner: HR Department
Purpose: Employee records and onboarding
Data type: Employee personal data
Criticality: High
```

Systems matter because compliance requirements often apply to systems that store or process data.

Example:

```text
GDPR applies because CRM and HR systems may contain personal data.
ISO 27001 applies because these systems are information assets that must be protected.
```

---

## Vendors

The user can open:

```text
/vendors
```

Vendors are external companies or service providers used by the company.

Examples:

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

Vendor: Payroll Provider
Service: Payroll processing
Risk level: Medium
Data processed: Employee salary and tax information
Contract needed: Data processing agreement
```

Vendors matter because the company may depend on external providers for systems, data processing, or critical services.

---

## Business processes

The user can open:

```text
/business-processes
```

A business process describes an important company activity.

Examples:

```text
Process: Employee onboarding
Department: HR
Systems used: Microsoft 365, HR System
Data involved: Employee personal data
Compliance relevance: GDPR

Process: Customer support
Department: Support
Systems used: CRM, ticket system
Data involved: Customer names, emails, support history
Compliance relevance: GDPR, ISO 27001

Process: Incident response
Department: IT Security
Systems used: Monitoring tools, ticket system, Microsoft 365
Data involved: Security logs and incident reports
Compliance relevance: ISO 27001, NIS2
```

Business processes matter because compliance is connected to real business activities.

---

## Dependencies

The user can open:

```text
/dependencies
```

Dependencies show relationships between business processes, systems, vendors, and controls.

Example:

```text
Business Process: Customer Support
Depends on: CRM system
CRM system depends on: Cloud hosting vendor
Cloud hosting vendor depends on: Vendor contract and security controls
```

Dependencies help answer impact questions:

```text
If a vendor fails, which systems are affected?
If a system fails, which business processes are affected?
If a process is critical, which vendors and systems must be reviewed?
Which evidence is needed for the dependency?
```

---

## How evidence connects everything

Framework360 is useful because it connects evidence to the real company environment.

Example relationship:

```text
Framework: ISO 27001
Requirement: Asset inventory
Evidence: Asset_Inventory.xlsx
System: Microsoft 365
Vendor: Microsoft
Business process: Employee onboarding
Dependency: HR process depends on Microsoft 365
```

This makes evidence more meaningful.

The company does not only upload a file. It understands what the file proves and what it is connected to.

---

## Example complete evidence flow

### Step 1: A requirement exists

```text
Framework: ISO 27001
Requirement: Maintain asset inventory
```

### Step 2: A gap is found

```text
Gap: No updated system inventory exists
```

### Step 3: User registers systems

```text
Microsoft 365
CRM
HR System
Cloud hosting platform
```

### Step 4: User registers vendors

```text
Microsoft
Cloud hosting provider
Payroll provider
```

### Step 5: User creates evidence

```text
Evidence: Asset_Inventory.xlsx
```

### Step 6: User links evidence

```text
Evidence linked to:
- ISO 27001
- Asset inventory requirement
- Microsoft 365
- CRM
- HR System
```

### Step 7: Requirement status improves

```text
Status changes from Missing to Evidence uploaded or Implemented
```

---

## Why relationship mapping is important

Relationship mapping helps the company understand compliance impact.

Example:

```text
Vendor: Microsoft
System: Microsoft 365
Business processes: HR onboarding, internal communication
Frameworks: GDPR, ISO 27001
Evidence: Data processing agreement, access control policy, asset inventory
```

This allows the company to answer:

```text
Which vendors support critical systems?
Which systems process personal data?
Which processes depend on high-risk vendors?
Which compliance requirements are connected to this system?
Which evidence proves that controls are in place?
```

---

## Simple summary

Evidence management in Framework360 works like this:

```text
Systems show what technology the company uses.
Vendors show who provides services.
Business processes show what the company does.
Dependencies show how everything is connected.
Evidence proves that compliance requirements are fulfilled.
```

Together, they create a complete compliance picture:

```text
Requirement -> System -> Vendor -> Business Process -> Evidence -> Audit readiness
```
