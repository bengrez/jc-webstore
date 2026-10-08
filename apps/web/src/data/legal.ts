// Versión del aviso de privacidad y de los términos de la cotización. Debe coincidir con
// apps/server/src/server/lib/legal.ts (lo comprueba apps/server/test/legal.test.ts): cada
// cotización y cada mensaje guardan la versión que aceptó quien los envió.
export const LEGAL_VERSION = '2026-10-08-borrador'
export const LEGAL_UPDATED_AT = '8 de octubre de 2026'

export const PRIVACY_PATH = '/privacidad'
export const TERMS_PATH = '/terminos'

// Datos de la empresa: se completan con la clienta antes de publicar
export const COMPANY = {
  tradeName: 'Confecciones Juany Reyes',
  legalName: '[POR DEFINIR: razón social]',
  rut: '[POR DEFINIR: RUT de la empresa]',
  address: '[POR DEFINIR: dirección]',
  email: '[POR DEFINIR: correo de contacto]',
}

export type LegalInfo = { version: string; quoteValidityDays: number; ivaPercent: number }

// Valores por defecto del server, por si /api/legal no responde
export const DEFAULT_LEGAL_INFO: LegalInfo = { version: LEGAL_VERSION, quoteValidityDays: 30, ivaPercent: 19 }
