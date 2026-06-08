-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bruger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fornavn" TEXT NOT NULL,
    "efternavn" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "authProvider" TEXT DEFAULT 'LOCAL',
    "providerId" TEXT,
    "rolle" TEXT NOT NULL DEFAULT 'USER',
    "erAktiv" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "sidsteLogin" DATETIME,
    "virksomhedId" INTEGER,
    "createdFromRequestId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bruger_virksomhedId_fkey" FOREIGN KEY ("virksomhedId") REFERENCES "Virksomhed" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bruger_createdFromRequestId_fkey" FOREIGN KEY ("createdFromRequestId") REFERENCES "DemoRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bruger" ("createdAt", "createdFromRequestId", "efternavn", "email", "erAktiv", "fornavn", "id", "mustChangePassword", "onboardingCompleted", "password", "rolle", "sidsteLogin", "updatedAt", "virksomhedId") SELECT "createdAt", "createdFromRequestId", "efternavn", "email", "erAktiv", "fornavn", "id", "mustChangePassword", "onboardingCompleted", "password", "rolle", "sidsteLogin", "updatedAt", "virksomhedId" FROM "Bruger";
DROP TABLE "Bruger";
ALTER TABLE "new_Bruger" RENAME TO "Bruger";
CREATE UNIQUE INDEX "Bruger_email_key" ON "Bruger"("email");
CREATE UNIQUE INDEX "Bruger_createdFromRequestId_key" ON "Bruger"("createdFromRequestId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
