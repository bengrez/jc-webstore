-- Subtotal referencial de la solicitud, que antes se perdía al enviar la cotización formal.
ALTER TABLE "Quote" ADD COLUMN "referenceSubtotal" INTEGER NOT NULL DEFAULT 0;

-- Marca de «Cotizada» a mano (enviada por fuera del sistema).
ALTER TABLE "Quote" ADD COLUMN "externallyQuotedAt" DATETIME;

-- Backfill: el subtotal original se recalcula desde los precios de catálogo de cada línea,
-- también para las cotizaciones ya enviadas cuyo `subtotal` quedó sobrescrito.
UPDATE "Quote" SET "referenceSubtotal" = (
  SELECT COALESCE(SUM("unitPrice" * "quantity"), 0) FROM "QuoteItem" WHERE "QuoteItem"."quoteId" = "Quote"."id"
);

-- Cotizaciones anteriores a 20261008170000 no tienen token y el portal las exige: se les asigna
-- uno aleatorio de 256 bits (hex). Los nuevos se generan en el server (base64url).
UPDATE "Quote" SET "publicToken" = lower(hex(randomblob(32))) WHERE "publicToken" IS NULL;
