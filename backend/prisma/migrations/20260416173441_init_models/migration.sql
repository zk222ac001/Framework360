-- CreateTable
CREATE TABLE "Virksomhed" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "navn" TEXT NOT NULL,
    "cvr" TEXT,
    "sektor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VirksomhedFramework" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "virksomhedId" INTEGER NOT NULL,
    "framework" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VirksomhedFramework_virksomhedId_fkey" FOREIGN KEY ("virksomhedId") REFERENCES "Virksomhed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bruger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "navn" TEXT NOT NULL,
    "efternavn" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rolle" TEXT NOT NULL DEFAULT 'Bruger',
    "virksomhedId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bruger_virksomhedId_fkey" FOREIGN KEY ("virksomhedId") REFERENCES "Virksomhed" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Virksomhed_cvr_key" ON "Virksomhed"("cvr");

-- CreateIndex
CREATE UNIQUE INDEX "Bruger_email_key" ON "Bruger"("email");
