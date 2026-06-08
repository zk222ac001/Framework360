/*
  Warnings:

  - You are about to drop the column `navn` on the `Bruger` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[virksomhedId,framework]` on the table `VirksomhedFramework` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fornavn` to the `Bruger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Bruger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Virksomhed` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "DemoRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "fornavn" TEXT NOT NULL,
    "efternavn" TEXT NOT NULL,
    "firmanavn" TEXT NOT NULL,
    "jobtitel" TEXT,
    "land" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "virksomhedId" INTEGER,
    "createdUserId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DemoRequest_virksomhedId_fkey" FOREIGN KEY ("virksomhedId") REFERENCES "Virksomhed" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Bruger" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "toEmail" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sentAt" DATETIME,
    "failedAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Bruger" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bruger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fornavn" TEXT NOT NULL,
    "efternavn" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rolle" TEXT NOT NULL DEFAULT 'USER',
    "erAktiv" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "sidsteLogin" DATETIME,
    "virksomhedId" INTEGER,
    "createdFromRequestId" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bruger_virksomhedId_fkey" FOREIGN KEY ("virksomhedId") REFERENCES "Virksomhed" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bruger_createdFromRequestId_fkey" FOREIGN KEY ("createdFromRequestId") REFERENCES "DemoRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bruger" ("createdAt", "efternavn", "email", "id", "password", "rolle", "virksomhedId") SELECT "createdAt", "efternavn", "email", "id", "password", "rolle", "virksomhedId" FROM "Bruger";
DROP TABLE "Bruger";
ALTER TABLE "new_Bruger" RENAME TO "Bruger";
CREATE UNIQUE INDEX "Bruger_email_key" ON "Bruger"("email");
CREATE UNIQUE INDEX "Bruger_createdFromRequestId_key" ON "Bruger"("createdFromRequestId");
CREATE TABLE "new_Virksomhed" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "navn" TEXT NOT NULL,
    "cvr" TEXT,
    "sektor" TEXT,
    "land" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Virksomhed" ("createdAt", "cvr", "id", "navn", "sektor") SELECT "createdAt", "cvr", "id", "navn", "sektor" FROM "Virksomhed";
DROP TABLE "Virksomhed";
ALTER TABLE "new_Virksomhed" RENAME TO "Virksomhed";
CREATE UNIQUE INDEX "Virksomhed_cvr_key" ON "Virksomhed"("cvr");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DemoRequest_createdUserId_key" ON "DemoRequest"("createdUserId");

-- CreateIndex
CREATE INDEX "DemoRequest_email_idx" ON "DemoRequest"("email");

-- CreateIndex
CREATE INDEX "DemoRequest_firmanavn_idx" ON "DemoRequest"("firmanavn");

-- CreateIndex
CREATE INDEX "Invitation_userId_type_idx" ON "Invitation"("userId", "type");

-- CreateIndex
CREATE INDEX "EmailLog_toEmail_idx" ON "EmailLog"("toEmail");

-- CreateIndex
CREATE INDEX "VirksomhedFramework_virksomhedId_idx" ON "VirksomhedFramework"("virksomhedId");

-- CreateIndex
CREATE UNIQUE INDEX "VirksomhedFramework_virksomhedId_framework_key" ON "VirksomhedFramework"("virksomhedId", "framework");
