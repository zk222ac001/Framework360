# 07 - Audit and Risk

## Purpose

This document explains how Framework360 supports audit preparation, audit findings, workflow approvals, and vendor risk management.

Audit and risk features help the company answer:

```text
Are we ready for an audit?
Which findings are still open?
Which evidence needs approval?
Which vendors create risk?
Which compliance areas need attention?
```

---

## Audit center

The user can open:

```text
/audit
```

The audit center is used to review compliance status and prepare for internal or external audits.

It may include information such as:

```text
Framework readiness
Evidence status
Open findings
Pending approvals
High-risk areas
Recent compliance activity
```

The audit center gives a high-level view of whether the company is ready to demonstrate compliance.

---

## Audit findings

The user can open:

```text
/findings
```

An audit finding is a problem, weakness, or missing item discovered during a review.

Example finding:

```text
Finding: No formal vendor risk review for Microsoft 365
Severity: Medium
Related framework: ISO 27001
Related vendor: Microsoft
Recommended action: Perform vendor security review and upload evidence
Status: Open
```

A finding helps the company understand what needs correction.

---

## Finding severity

Findings can have different severity levels.

Example severity levels:

```text
Low
Medium
High
Critical
```

Severity helps the company prioritize work.

Example:

```text
Critical finding: No incident response process exists
High finding: No vendor risk review for critical cloud provider
Medium finding: Evidence needs annual review
Low finding: Minor documentation update required
```

---

## From finding to action

A finding should lead to an action plan.

Example:

```text
Finding: Missing incident response procedure
Severity: High
```

Action:

```text
Action title: Create and approve incident response procedure
Owner: Security Manager
Due date: 30 June 2026
Priority: High
Required evidence: Incident_Response_Procedure.pdf
```

This makes audit findings actionable.

---

## Workflow approvals

The user can open:

```text
/workflows
```

Workflow approvals help manage review and approval of compliance work.

Example workflow:

```text
Evidence uploaded: Incident Response Policy
Submitted by: IT Manager
Waiting for approval from: Compliance Manager
Status: Pending approval
```

Approvals help ensure that uploaded evidence or completed actions are reviewed before being considered accepted.

---

## Approval statuses

Example workflow statuses:

```text
Draft
Submitted
Pending approval
Approved
Rejected
Needs changes
```

Example approval flow:

```text
User uploads evidence
  ↓
Evidence is submitted for approval
  ↓
Compliance manager reviews evidence
  ↓
Evidence is approved or rejected
  ↓
Requirement status is updated
```

---

## Evidence review example

```text
Framework: ISO 27001
Requirement: Incident response procedure
Evidence: Incident_Response_Procedure.pdf
Submitted by: IT Manager
Reviewer: Compliance Manager
Review result: Approved
```

After approval, the requirement may be marked as implemented or evidence approved.

---

## Vendor risk center

The user can open:

```text
/vendor-risk
```

Vendor risk management helps the company understand risk from external providers.

Example vendor risk record:

```text
Vendor: AWS
Service: Cloud hosting
Risk: High
Reason:
- Hosts important systems
- Processes customer data
- Requires security agreement
- Requires regular review
```

Vendor risk matters because external providers can affect security, privacy, availability, and compliance.

---

## Vendor risk examples

### High-risk vendor

```text
Vendor: Cloud hosting provider
Reason: Hosts production systems and customer data
Required evidence:
- Security agreement
- Data processing agreement
- Vendor risk assessment
- Availability and backup documentation
```

### Medium-risk vendor

```text
Vendor: Payroll provider
Reason: Processes employee salary data
Required evidence:
- Data processing agreement
- Access control confirmation
- Contract review
```

### Low-risk vendor

```text
Vendor: Office supplies provider
Reason: No critical systems or personal data processing
Required evidence:
- Basic vendor record
```

---

## How audit and risk connect to compliance

Audit and risk features connect to the rest of the system.

Example relationship:

```text
Vendor: Microsoft
System: Microsoft 365
Business process: Employee onboarding
Framework: GDPR and ISO 27001
Requirement: Vendor risk management
Evidence: Vendor risk assessment
Finding: Vendor review missing
Action: Complete Microsoft vendor review
Workflow: Evidence approval pending
```

This gives the company a complete view of risk and compliance impact.

---

## AI Compliance Copilot

The user can open:

```text
/copilot
```

The AI Compliance Copilot helps users understand compliance questions.

Example user question:

```text
What evidence do I need for ISO 27001 vendor risk management?
```

Example answer:

```text
You may need a vendor risk assessment, contract review, data processing agreement, security documentation, and evidence of periodic vendor review.
```

The copilot can help users understand requirements, evidence expectations, and next steps.

---

## Audit readiness

Audit readiness means the company is prepared to show that compliance work is under control.

Framework360 supports audit readiness by organizing:

```text
Frameworks
Requirements
Requirement statuses
Evidence
Systems
Vendors
Business processes
Dependencies
Findings
Actions
Approvals
```

An auditor or compliance manager can follow the chain:

```text
Framework requirement
  ↓
Company status
  ↓
Linked evidence
  ↓
Related systems and vendors
  ↓
Open findings or approved status
```

---

## Example audit scenario

An auditor asks:

```text
Can you prove that you manage vendor risk for critical vendors?
```

Framework360 can help answer:

```text
Critical vendor: AWS
Related system: Cloud hosting platform
Related business process: Customer application hosting
Framework: ISO 27001
Requirement: Supplier risk management
Evidence: AWS vendor risk assessment
Status: Approved
Last review date: 2026-05-01
Open findings: None
```

This is much better than searching manually through folders and emails.

---

## Simple summary

Audit and risk management in Framework360 works like this:

```text
Findings identify problems.
Actions fix findings.
Evidence proves completion.
Workflows approve evidence.
Vendor risk highlights third-party exposure.
Audit center shows readiness.
```

Together, these features help the company prepare for audits and manage compliance risk.
