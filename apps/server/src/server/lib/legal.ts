import { z } from 'zod'

// Versión vigente del aviso de privacidad y los términos de cotización. Debe coincidir con
// apps/web/src/data/legal.ts (lo comprueba test/legal.test.ts). Al cambiar el texto de los documentos
// se cambia la versión, y cada cotización o mensaje guarda la que aceptó quien lo envió.
export const LEGAL_VERSION = '2026-10-08-borrador'

const legalAcceptanceSchema = z.object({
  accepted: z.literal(true),
  version: z.string().max(64),
})

export type LegalCheck =
  | { ok: true; version: string; acceptedAt: Date }
  | { ok: false; status: 400; body: { error: string; message: string } }

export const checkLegalAcceptance = (value: unknown): LegalCheck => {
  const parsed = legalAcceptanceSchema.safeParse(value)
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      body: {
        error: 'legal_not_accepted',
        message: 'Debes aceptar el aviso de privacidad y los términos de la cotización.',
      },
    }
  }
  // Una pestaña abierta antes de un cambio de los documentos aceptaría un texto que ya no rige
  if (parsed.data.version !== LEGAL_VERSION) {
    return {
      ok: false,
      status: 400,
      body: {
        error: 'legal_version_mismatch',
        message: 'El aviso de privacidad o los términos cambiaron. Recarga la página y vuelve a aceptarlos.',
      },
    }
  }
  return { ok: true, version: parsed.data.version, acceptedAt: new Date() }
}
