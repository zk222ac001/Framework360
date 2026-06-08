# EU Compliance Platform

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
Frontend: http://localhost:5173
Backend API: http://localhost:3000
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

This account has access to platform administration features.

---

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

This account represents a customer organization and can be used to explore the platform as a company administrator.

---

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

This account can be used for general testing and demonstration purposes.

---

# Accessing the Database with Prisma Studio

To inspect and edit the database through Prisma Studio, execute:

```bash
docker compose exec backend npx prisma studio --hostname 0.0.0.0
```

Prisma Studio will then be available at:

```text
http://localhost:5555
```

This allows direct inspection of all database tables and records.

---

# Stopping the Application

Stop all containers:

```bash
docker compose down
```

Stop all containers and remove volumes:

```bash
docker compose down -v
```

---

# Quick Start Guide for Examiners

1. Extract the project archive.
2. Open a terminal in the project root directory.
3. Start the application:

```bash
docker compose up --build
```

4. Open a second terminal and create demo data:

```bash
docker compose exec backend npm run seed:dev
```

5. Open the application:

```text
http://localhost:5173
```

6. Log in using one of the test accounts listed above.

7. (Optional) Open Prisma Studio:

```bash
docker compose exec backend npx prisma studio --hostname 0.0.0.0
```

and navigate to:

```text
http://localhost:5555
```

---

# Project Structure

```text
.
├── backend/
│   ├── prisma/
│   ├── src/
│   └── package.json
│
├── frontend/
│   ├── src/
│   └── package.json
│
├── docker/
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

# Notes

- The `node_modules` directories are intentionally excluded from the submission archive.
- Docker automatically installs all required dependencies.
- The project uses a local SQLite database for development and demonstration purposes.
- The platform is intended for demonstration and evaluation as part of the exam project.
