-- Subtotal referencial de la solicitud, que antes se perdía al enviar la cotización formal.
ALTER TABLE "Quote" ADD COLUMN "referenceSubtotal" INTEGER NOT NULL DEFAULT 0;

-- Marca de «Cotizada» a mano (enviada por fuera del sistema).
ALTER TABLE "Quote" ADD COLUMN "externallyQuotedAt" DATETIME;

-- Backfill: el subtotal original se recalcula desde los precios de catálogo de cada línea,
-- también para las cotizaciones ya enviadas cuyo `subtotal` quedó sobrescrito.
UPDATE "Quote" SET "referenceSubtotal" = (
  SELECT COALESCE(SUM("unitPrice" * "quantity"), 0) FROM "QuoteItem" WHERE "QuoteItem"."quoteId" = "Quote"."id"
);
