-- CreateTable
CREATE TABLE "Control" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "severity" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FrameworkControl" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "framework" TEXT NOT NULL,
    "controlId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FrameworkControl_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VirksomhedControl" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "virksomhedId" INTEGER NOT NULL,
    "controlId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "score" INTEGER,
    "kommentar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VirksomhedControl_virksomhedId_fkey" FOREIGN KEY ("virksomhedId") REFERENCES "Virksomhed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VirksomhedControl_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FrameworkControl_framework_idx" ON "FrameworkControl"("framework");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkControl_framework_controlId_key" ON "FrameworkControl"("framework", "controlId");

-- CreateIndex
CREATE UNIQUE INDEX "VirksomhedControl_virksomhedId_controlId_key" ON "VirksomhedControl"("virksomhedId", "controlId");
