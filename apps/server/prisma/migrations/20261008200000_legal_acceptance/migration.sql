-- Aceptación del aviso de privacidad y los términos de cotización (fecha y versión)
ALTER TABLE "Quote" ADD COLUMN "legalAcceptedAt" DATETIME;
ALTER TABLE "Quote" ADD COLUMN "legalVersion" TEXT;
ALTER TABLE "ContactMessage" ADD COLUMN "legalAcceptedAt" DATETIME;
ALTER TABLE "ContactMessage" ADD COLUMN "legalVersion" TEXT;
