-- CreateTable
CREATE TABLE "CompanyScope" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "employeeCount" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "processesPersonalData" BOOLEAN NOT NULL DEFAULT false,
    "handlesSensitiveData" BOOLEAN NOT NULL DEFAULT false,
    "acceptsCardPayments" BOOLEAN NOT NULL DEFAULT false,
    "usesAiSystems" BOOLEAN NOT NULL DEFAULT false,
    "servesFinancialCustomers" BOOLEAN NOT NULL DEFAULT false,
    "isDigitalServiceProvider" BOOLEAN NOT NULL DEFAULT false,
    "operatesCriticalInfrastructure" BOOLEAN NOT NULL DEFAULT false,
    "hasEuCustomers" BOOLEAN NOT NULL DEFAULT false,
    "usesCloudProviders" BOOLEAN NOT NULL DEFAULT false,
    "hasCriticalSuppliers" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyScope_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Virksomhed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "contactEmail" TEXT,
    "criticality" TEXT NOT NULL DEFAULT 'MEDIUM',
    "isCriticalSupplier" BOOLEAN NOT NULL DEFAULT false,
    "hasDpa" BOOLEAN NOT NULL DEFAULT false,
    "hasSla" BOOLEAN NOT NULL DEFAULT false,
    "hasSecurityReview" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT,
    "reviewDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vendor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Virksomhed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemAsset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "criticality" TEXT NOT NULL DEFAULT 'MEDIUM',
    "ownerDepartment" TEXT,
    "ownerUserId" INTEGER,
    "vendorId" INTEGER,
    "containsPersonalData" BOOLEAN NOT NULL DEFAULT false,
    "containsSensitiveData" BOOLEAN NOT NULL DEFAULT false,
    "internetExposed" BOOLEAN NOT NULL DEFAULT false,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "loggingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "monitoringEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rtoMinutes" INTEGER,
    "rpoMinutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SystemAsset_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Virksomhed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SystemAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "Bruger" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SystemAsset_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessProcess" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerDepartment" TEXT,
    "criticality" TEXT NOT NULL DEFAULT 'MEDIUM',
    "maxTolerableDowntimeMinutes" INTEGER,
    "manualWorkaroundAvailable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessProcess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Virksomhed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dependency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'OTHER',
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "failureImpact" TEXT,
    "manualWorkaroundAvailable" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dependency_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Virksomhed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommercialProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "trialEndsAt" DATETIME,
    "seatsLimit" INTEGER,
    "storageLimitMb" INTEGER,
    "licenseKeyHash" TEXT,
    "billingProvider" TEXT,
    "providerRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommercialProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Virksomhed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "content" TEXT,
    "ownerUserId" INTEGER,
    "approverUserId" INTEGER,
    "requirementId" INTEGER,
    "reviewDueAt" DATETIME,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Policy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Virksomhed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Policy_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "Bruger" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Policy_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "Bruger" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Policy_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "FrameworkRequirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrustCenterProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publicSlug" TEXT,
    "securityContact" TEXT,
    "summary" TEXT,
    "ndaRequired" BOOLEAN NOT NULL DEFAULT true,
    "showFrameworks" BOOLEAN NOT NULL DEFAULT true,
    "showVendors" BOOLEAN NOT NULL DEFAULT false,
    "showReports" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrustCenterProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Virksomhed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessReview" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "systemId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccessReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Virksomhed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccessReview_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "SystemAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessReviewItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessReviewId" INTEGER NOT NULL,
    "userId" INTEGER,
    "subjectName" TEXT NOT NULL,
    "subjectEmail" TEXT,
    "accessLevel" TEXT,
    "decision" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewerNote" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccessReviewItem_accessReviewId_fkey" FOREIGN KEY ("accessReviewId") REFERENCES "AccessReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccessReviewItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Bruger" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "assignedToUserId" INTEGER,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "dueAt" DATETIME,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Virksomhed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "Bruger" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyScope_companyId_key" ON "CompanyScope"("companyId");

-- CreateIndex
CREATE INDEX "Vendor_companyId_idx" ON "Vendor"("companyId");

-- CreateIndex
CREATE INDEX "SystemAsset_companyId_idx" ON "SystemAsset"("companyId");

-- CreateIndex
CREATE INDEX "SystemAsset_vendorId_idx" ON "SystemAsset"("vendorId");

-- CreateIndex
CREATE INDEX "SystemAsset_ownerUserId_idx" ON "SystemAsset"("ownerUserId");

-- CreateIndex
CREATE INDEX "BusinessProcess_companyId_idx" ON "BusinessProcess"("companyId");

-- CreateIndex
CREATE INDEX "Dependency_companyId_idx" ON "Dependency"("companyId");

-- CreateIndex
CREATE INDEX "Dependency_sourceType_sourceId_idx" ON "Dependency"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "Dependency_targetType_targetId_idx" ON "Dependency"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialProfile_companyId_key" ON "CommercialProfile"("companyId");

-- CreateIndex
CREATE INDEX "Policy_companyId_idx" ON "Policy"("companyId");

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");

-- CreateIndex
CREATE INDEX "Policy_reviewDueAt_idx" ON "Policy"("reviewDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrustCenterProfile_companyId_key" ON "TrustCenterProfile"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustCenterProfile_publicSlug_key" ON "TrustCenterProfile"("publicSlug");

-- CreateIndex
CREATE INDEX "AccessReview_companyId_idx" ON "AccessReview"("companyId");

-- CreateIndex
CREATE INDEX "AccessReview_systemId_idx" ON "AccessReview"("systemId");

-- CreateIndex
CREATE INDEX "AccessReview_status_idx" ON "AccessReview"("status");

-- CreateIndex
CREATE INDEX "AccessReview_dueDate_idx" ON "AccessReview"("dueDate");

-- CreateIndex
CREATE INDEX "AccessReviewItem_accessReviewId_idx" ON "AccessReviewItem"("accessReviewId");

-- CreateIndex
CREATE INDEX "AccessReviewItem_decision_idx" ON "AccessReviewItem"("decision");

-- CreateIndex
CREATE INDEX "Notification_companyId_idx" ON "Notification"("companyId");

-- CreateIndex
CREATE INDEX "Notification_assignedToUserId_idx" ON "Notification"("assignedToUserId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_dueAt_idx" ON "Notification"("dueAt");
