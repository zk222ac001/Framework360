# 05 - Frameworks and Gaps

## Purpose

This document explains how Framework360 handles compliance frameworks, requirements, assessments, and gaps.

A framework is a structured set of compliance rules or controls that a company may need to follow.

Examples:

```text
GDPR      -> Personal data protection
ISO 27001 -> Information security management
NIS2      -> Cybersecurity obligations
```

---

## What is a compliance framework?

A compliance framework is a collection of requirements.

Each requirement explains what the company should do to meet a legal, security, privacy, or operational obligation.

Example:

```text
Framework: ISO 27001
Requirement: Maintain an inventory of information assets
Meaning: The company should know which important systems, data, and assets it owns or uses
```

Another example:

```text
Framework: GDPR
Requirement: Protect personal data
Meaning: The company must know where personal data is stored and how it is processed
```

---

## Framework recommendation

Framework360 can recommend frameworks based on company information such as sector.

Example company:

```text
Company: CyberPartners
Sector: IT
Country: Denmark
```

Possible recommended frameworks:

```text
GDPR
ISO 27001
NIS2
```

Why these frameworks may be relevant:

```text
GDPR applies because the company may process personal data.
ISO 27001 applies because the company needs information security controls.
NIS2 may apply because IT and digital service companies can be affected by cybersecurity regulation.
```

---

## Framework selection

The user may choose frameworks during onboarding or from the application.

Example pages:

```text
/onboarding/frameworks
/frameworks/add
```

A selected framework becomes part of the company compliance scope.

In simple words:

```text
The company tells the system which frameworks it wants to track.
```

---

## Framework assessment

A user can open a framework assessment page.

Example route:

```text
/frameworks/:code
```

Example:

```text
/frameworks/ISO27001
```

The assessment page shows the requirements for that framework.

Example requirement list:

```text
Requirement: Access control policy
Status: Partially implemented

Requirement: Asset inventory
Status: Missing

Requirement: Incident response procedure
Status: Implemented
```

The user reviews each requirement and checks whether the company is compliant.

---

## Requirement statuses

A requirement can have different statuses.

Example statuses:

```text
Not started
Missing
Partially implemented
Implemented
Evidence uploaded
Approved
Not applicable
```

These statuses help the company understand progress.

Example:

```text
Requirement: Asset inventory
Status: Missing
```

This means the company has not yet provided enough proof or work for that requirement.

---

## What is a gap?

A gap means the company does not currently meet a requirement, or the requirement is only partially fulfilled.

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
The rule says the company needs something.
The company does not have it yet.
That missing part is a gap.
```

---

## Gap examples

### Example 1: Missing asset inventory

```text
Framework: ISO 27001
Requirement: Asset inventory
Problem: Company does not have an updated list of systems and assets
Gap: Missing asset inventory
Suggested action: Create and maintain an asset inventory
Evidence needed: Asset inventory document or system export
```

### Example 2: Missing vendor review

```text
Framework: ISO 27001
Requirement: Supplier risk management
Problem: Company uses cloud vendors but has not reviewed vendor risks
Gap: Missing vendor security review
Suggested action: Review key vendors and document risks
Evidence needed: Vendor risk assessment report
```

### Example 3: Missing privacy documentation

```text
Framework: GDPR
Requirement: Document personal data processing
Problem: Company does not know where all personal data is processed
Gap: Missing processing overview
Suggested action: Map systems and business processes that use personal data
Evidence needed: Data processing register
```

---

## From gap to action

A gap should not remain only as a problem.

Framework360 helps turn gaps into actions.

Example:

```text
Gap: No updated asset inventory exists
```

This becomes an action:

```text
Action title: Create updated asset inventory
Owner: IT Manager
Due date: 30 June 2026
Priority: High
Status: Open
```

This gives the company a clear plan for fixing the gap.

---

## From action to evidence

After the responsible person completes the action, evidence should be added.

Example:

```text
Action: Create updated asset inventory
Evidence: Asset_Inventory.xlsx
Linked requirement: ISO 27001 asset inventory
Status: Evidence uploaded
```

This shows that the company has taken action and can prove it.

---

## Why framework assessments are useful

Framework assessments help the company answer:

```text
Which requirements apply to us?
Which requirements are already implemented?
Which requirements are missing?
Which gaps are high risk?
Which evidence proves compliance?
Which actions should we prioritize?
```

Without assessment, compliance work may be unclear.

With assessment, the company gets a structured overview.

---

## Example end-to-end flow

```text
1. Company selects ISO 27001.
2. User opens the ISO 27001 assessment page.
3. User reviews the Asset Inventory requirement.
4. The requirement is marked as Missing.
5. Framework360 shows this as a gap.
6. User creates an action to create an asset inventory.
7. IT Manager completes the asset inventory.
8. User uploads Asset_Inventory.xlsx as evidence.
9. Requirement status changes to Evidence uploaded or Implemented.
10. Compliance progress improves.
```

---

## Simple summary

Framework360 handles frameworks and gaps like this:

```text
Framework tells the company what rules apply.
Requirements explain what must be done.
Assessment checks current status.
Gaps show what is missing.
Actions define how to fix the gaps.
Evidence proves the work was completed.
```
