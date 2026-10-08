-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "adminMessage" TEXT;
ALTER TABLE "Quote" ADD COLUMN "quotedAt" DATETIME;

-- AlterTable
ALTER TABLE "QuoteItem" ADD COLUMN "quotedUnitPrice" INTEGER;
