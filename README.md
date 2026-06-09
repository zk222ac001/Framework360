# Framework360

## Overview

This project is a proof-of-concept (MVP) compliance platform developed as part of an exam project. The platform helps organizations gain an overview of relevant compliance frameworks, requirements, gaps, action plans, evidence, vendors, systems, business processes, and dependencies.

The solution consists of:

- Frontend (React + TypeScript)
- Backend (Node.js + Express)
- SQLite database (Prisma ORM)
- Docker Compose setup

---

# Requirements

The following software must be installed:

- Docker
- Docker Compose

No local Node.js installation is required when running the project through Docker.

---

# Running the Application

Open a terminal in the project root directory (where `docker-compose.yml` is located).

Build and start the application:

```bash
docker compose up --build
```

The application will be available at:

```text
Frontend: http://localhost:25173
Backend API: http://localhost:23000
```

The backend automatically runs Prisma database synchronization (`prisma db push`) when the container starts.

---

# Creating Demo/Test Data

After the containers have started, open a new terminal and execute:

```bash
docker compose exec backend npm run seed:dev
```

This command creates the demo users and sample data used during development.

If you want to completely reset the database and recreate all demo data:

```bash
docker compose exec backend npm run db:reset:dev
```

Warning: This command deletes all existing data in the development database.

---

# Test Accounts

The following accounts are created by the development seed.

## Platform Administrator

```text
Email: dev.admin@eucompliance.test
Password: DevAdmin123
Role: PLATFORM_ADMIN
```

## Customer Administrator

```text
Email: simon@test.dk
Password: Test1234
Role: CUSTOMER_ADMIN
Company: CyberPartners
CVR: 12345678
Sector: IT
Country: DK
```

## Demo User

```text
Email: demo@test.dk
Password: Test1234
Role: DEMO_USER
Company: Demo Company
CVR: 87654321
Sector: IT
Country: DK
```

# Accessing the Database with Prisma Studio

```bash
docker compose exec backend npx prisma studio --hostname 0.0.0.0
```

Prisma Studio:

```text
http://localhost:5555
```

# Quick Start Guide for Examiners

1. Extract the project archive.
2. Open a terminal in the project root directory.
3. Run:

```bash
docker compose up --build
```

4. Seed demo data:

```bash
docker compose exec backend npm run seed:dev
```

5. Open:

```text
http://localhost:25173
```
