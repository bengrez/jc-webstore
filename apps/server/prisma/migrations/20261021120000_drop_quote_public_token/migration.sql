-- El portal público de cotizaciones se eliminó (2026-10-20): el token ya no autoriza nada.
-- SQLite no permite quitar una columna con índice único: se borra el índice primero.
DROP INDEX "Quote_publicToken_key";
ALTER TABLE "Quote" DROP COLUMN "publicToken";
