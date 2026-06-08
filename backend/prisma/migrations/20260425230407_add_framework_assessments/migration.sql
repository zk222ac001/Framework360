/*
  Warnings:

  - You are about to drop the `Control` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FrameworkControl` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VirksomhedControl` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Control";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FrameworkControl";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VirksomhedControl";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "FrameworkDefinition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FrameworkSection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "frameworkDefinitionId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FrameworkSection_frameworkDefinitionId_fkey" FOREIGN KEY ("frameworkDefinitionId") REFERENCES "FrameworkDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FrameworkRequirement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sectionId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "order" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FrameworkRequirement_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FrameworkSection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyFrameworkAssessment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "virksomhedId" INTEGER NOT NULL,
    "frameworkDefinitionId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "score" REAL NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyFrameworkAssessment_virksomhedId_fkey" FOREIGN KEY ("virksomhedId") REFERENCES "Virksomhed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompanyFrameworkAssessment_frameworkDefinitionId_fkey" FOREIGN KEY ("frameworkDefinitionId") REFERENCES "FrameworkDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FrameworkRequirementAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assessmentId" INTEGER NOT NULL,
    "requirementId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNANSWERED',
    "note" TEXT,
    "answeredByUserId" INTEGER,
    "answeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FrameworkRequirementAnswer_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "CompanyFrameworkAssessment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FrameworkRequirementAnswer_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "FrameworkRequirement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FrameworkRequirementAnswer_answeredByUserId_fkey" FOREIGN KEY ("answeredByUserId") REFERENCES "Bruger" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkDefinition_code_key" ON "FrameworkDefinition"("code");

-- CreateIndex
CREATE INDEX "FrameworkSection_frameworkDefinitionId_idx" ON "FrameworkSection"("frameworkDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkSection_frameworkDefinitionId_order_key" ON "FrameworkSection"("frameworkDefinitionId", "order");

-- CreateIndex
CREATE INDEX "FrameworkRequirement_sectionId_idx" ON "FrameworkRequirement"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkRequirement_sectionId_order_key" ON "FrameworkRequirement"("sectionId", "order");

-- CreateIndex
CREATE INDEX "CompanyFrameworkAssessment_virksomhedId_idx" ON "CompanyFrameworkAssessment"("virksomhedId");

-- CreateIndex
CREATE INDEX "CompanyFrameworkAssessment_frameworkDefinitionId_idx" ON "CompanyFrameworkAssessment"("frameworkDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyFrameworkAssessment_virksomhedId_frameworkDefinitionId_key" ON "CompanyFrameworkAssessment"("virksomhedId", "frameworkDefinitionId");

-- CreateIndex
CREATE INDEX "FrameworkRequirementAnswer_assessmentId_idx" ON "FrameworkRequirementAnswer"("assessmentId");

-- CreateIndex
CREATE INDEX "FrameworkRequirementAnswer_requirementId_idx" ON "FrameworkRequirementAnswer"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkRequirementAnswer_assessmentId_requirementId_key" ON "FrameworkRequirementAnswer"("assessmentId", "requirementId");
