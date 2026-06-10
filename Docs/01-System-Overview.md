# 01 - System Overview

## Project overview

Framework360 is a compliance management web application. It helps a company understand:

- Which compliance frameworks apply to the company
- What requirements the company must follow
- Where the company has compliance gaps
- What actions are needed to close those gaps
- What evidence is available to prove compliance
- Which systems, vendors, business processes, and dependencies are connected to compliance work

In simple words, Framework360 helps a company move from unclear compliance work to an organized overview of requirements, risks, tasks, and evidence.

---

## Main technical parts

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

---

## General request flow

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

## What problem does Framework360 solve?

Companies often need to follow different compliance frameworks such as GDPR, ISO 27001, or NIS2. Without a system, this can become confusing because requirements, documents, evidence, systems, vendors, and tasks may be spread across emails, spreadsheets, and folders.

Framework360 connects everything in one place:

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

## Simple summary

Framework360 turns compliance confusion into organized work.

Instead of having documents, vendors, systems, and tasks scattered everywhere, the system connects them together:

```text
Company -> Frameworks -> Requirements -> Gaps -> Actions -> Evidence -> Audit readiness
```
