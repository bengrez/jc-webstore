-- ContactMessage ya lo crea 20260316180907_add_contact_message_and_public_notes (WIP).
-- El PR #8 traía otra migración que volvía a crear la tabla; se reemplaza por esta, que
-- sólo agrega lo nuevo del PR #8: la marca de atendido y el índice por fecha.
ALTER TABLE "ContactMessage" ADD COLUMN "handled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
