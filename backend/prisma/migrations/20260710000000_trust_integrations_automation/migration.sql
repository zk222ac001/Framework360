-- Add integration, trust center, questionnaire, auditor portal, and evidence automation models.

CREATE TABLE "IntegrationConnection" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
  "authType" TEXT NOT NULL DEFAULT 'MANUAL',
  "config" JSONB,
  "lastSyncAt" TIMESTAMP(3),
  "lastSyncStatus" TEXT,
  "lastSyncMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrustCenterProfile" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "headline" TEXT,
  "overview" TEXT,
  "contactEmail" TEXT,
  "publishedSections" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrustCenterProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrustCenterDocument" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "profileId" TEXT,
  "evidenceId" TEXT,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'SECURITY',
  "description" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrustCenterDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SecurityQuestionnaire" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "requester" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SecurityQuestionnaire_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SecurityQuestionnaireQuestion" (
  "id" TEXT NOT NULL,
  "questionnaireId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'GENERAL',
  "answer" TEXT,
  "confidence" TEXT,
  "sourceRefs" JSONB,
  "status" TEXT NOT NULL DEFAULT 'UNANSWERED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SecurityQuestionnaireQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditorAccessGrant" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "scope" JSONB,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AuditorAccessGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvidenceCollectionJob" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "integrationConnectionId" TEXT,
  "name" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "schedule" TEXT NOT NULL DEFAULT 'MANUAL',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "lastRunAt" TIMESTAMP(3),
  "lastRunStatus" TEXT,
  "nextRunAt" TIMESTAMP(3),
  "config" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EvidenceCollectionJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvidenceCollectionRun" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "message" TEXT,
  "createdEvidenceCount" INTEGER NOT NULL DEFAULT 0,
  "logs" JSONB,

  CONSTRAINT "EvidenceCollectionRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationConnection_companyId_provider_key" ON "IntegrationConnection"("companyId", "provider");
CREATE UNIQUE INDEX "TrustCenterProfile_companyId_key" ON "TrustCenterProfile"("companyId");
CREATE UNIQUE INDEX "TrustCenterProfile_slug_key" ON "TrustCenterProfile"("slug");
CREATE UNIQUE INDEX "AuditorAccessGrant_companyId_email_key" ON "AuditorAccessGrant"("companyId", "email");

ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrustCenterProfile" ADD CONSTRAINT "TrustCenterProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrustCenterDocument" ADD CONSTRAINT "TrustCenterDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrustCenterDocument" ADD CONSTRAINT "TrustCenterDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TrustCenterProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SecurityQuestionnaire" ADD CONSTRAINT "SecurityQuestionnaire_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SecurityQuestionnaireQuestion" ADD CONSTRAINT "SecurityQuestionnaireQuestion_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "SecurityQuestionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditorAccessGrant" ADD CONSTRAINT "AuditorAccessGrant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceCollectionJob" ADD CONSTRAINT "EvidenceCollectionJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceCollectionJob" ADD CONSTRAINT "EvidenceCollectionJob_integrationConnectionId_fkey" FOREIGN KEY ("integrationConnectionId") REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EvidenceCollectionRun" ADD CONSTRAINT "EvidenceCollectionRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "EvidenceCollectionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
