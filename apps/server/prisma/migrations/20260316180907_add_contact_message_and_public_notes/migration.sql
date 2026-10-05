-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuoteNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" INTEGER NOT NULL,
    "adminUserId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteNote_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteNote_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuoteNote" ("adminUserId", "body", "createdAt", "id", "quoteId") SELECT "adminUserId", "body", "createdAt", "id", "quoteId" FROM "QuoteNote";
DROP TABLE "QuoteNote";
ALTER TABLE "new_QuoteNote" RENAME TO "QuoteNote";
CREATE INDEX "QuoteNote_quoteId_idx" ON "QuoteNote"("quoteId");
CREATE INDEX "QuoteNote_adminUserId_idx" ON "QuoteNote"("adminUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
