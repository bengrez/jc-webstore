-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "publicToken" TEXT;

-- CreateTable
CREATE TABLE "QuoteRevision" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" INTEGER NOT NULL,
    "rev" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "ivaAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "issuedAt" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "adminUserId" INTEGER NOT NULL,
    CONSTRAINT "QuoteRevision_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteRevision_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "QuoteRevision_adminUserId_idx" ON "QuoteRevision"("adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRevision_quoteId_rev_key" ON "QuoteRevision"("quoteId", "rev");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_publicToken_key" ON "Quote"("publicToken");

