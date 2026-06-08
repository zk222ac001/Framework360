/*
  Warnings:

  - You are about to drop the column `frameworkRequirementId` on the `FrameworkEvidence` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FrameworkRequirement" ADD COLUMN "exampleEvidence" TEXT;
ALTER TABLE "FrameworkRequirement" ADD COLUMN "implementationGuide" TEXT;
ALTER TABLE "FrameworkRequirement" ADD COLUMN "riskIfMissing" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FrameworkEvidence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "answerId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedByUserId" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FrameworkEvidence_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "FrameworkRequirementAnswer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FrameworkEvidence_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "Bruger" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FrameworkEvidence" ("answerId", "createdAt", "description", "filePath", "fileType", "filename", "id", "size", "uploadedByUserId") SELECT "answerId", "createdAt", "description", "filePath", "fileType", "filename", "id", "size", "uploadedByUserId" FROM "FrameworkEvidence";
DROP TABLE "FrameworkEvidence";
ALTER TABLE "new_FrameworkEvidence" RENAME TO "FrameworkEvidence";
CREATE INDEX "FrameworkEvidence_answerId_idx" ON "FrameworkEvidence"("answerId");
CREATE INDEX "FrameworkEvidence_uploadedByUserId_idx" ON "FrameworkEvidence"("uploadedByUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
