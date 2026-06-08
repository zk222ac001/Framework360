-- CreateTable
CREATE TABLE "FrameworkEvidence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "answerId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedByUserId" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frameworkRequirementId" INTEGER,
    CONSTRAINT "FrameworkEvidence_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "FrameworkRequirementAnswer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FrameworkEvidence_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "Bruger" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FrameworkEvidence_frameworkRequirementId_fkey" FOREIGN KEY ("frameworkRequirementId") REFERENCES "FrameworkRequirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FrameworkEvidence_answerId_idx" ON "FrameworkEvidence"("answerId");

-- CreateIndex
CREATE INDEX "FrameworkEvidence_uploadedByUserId_idx" ON "FrameworkEvidence"("uploadedByUserId");
