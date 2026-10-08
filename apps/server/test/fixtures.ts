import type { QuoteDocument, QuoteDocumentLine } from '../src/server/lib/quote-document.js'
import { computeQuoteTotals, computeValidUntil } from '../src/server/lib/quote-totals.js'

// Fecha lejana a la de hoy, para que el test detecte si el PDF usara `new Date()`
export const QUOTED_AT = new Date('2025-03-14T15:00:00Z')

export const configuredLine: QuoteDocumentLine = {
  itemId: 1,
  name: 'Estola bordada Magna',
  quantity: 40,
  unitPrice: 18990,
  configuration: [
    { label: 'Color de ribete', type: 'COLOR', value: '#1F4FA0', choiceLabel: 'Azul ceremonial' },
    { label: 'Texto bordado', type: 'TEXT', value: 'Generación 2026' },
    { label: 'Logo institucional', type: 'FILE', value: '/uploads/3f9a1c2b.png' },
  ],
}

export const plainLines: QuoteDocumentLine[] = [
  { itemId: 2, name: 'Polera piqué corporativa', quantity: 120, unitPrice: 8490, configuration: [] },
  { itemId: 3, name: 'Tazón cerámico', quantity: 50, unitPrice: 3990, configuration: [] },
  { itemId: 4, name: 'Birrete con borla', quantity: 40, unitPrice: 6990, configuration: [] },
  { itemId: 5, name: 'Bolsa tote algodón', quantity: 200, unitPrice: 2490, configuration: [] },
]

export const makeDocument = (lines: QuoteDocumentLine[], overrides: Partial<QuoteDocument> = {}): QuoteDocument => ({
  folio: 'COT-000042',
  rev: 0,
  quotedAt: QUOTED_AT,
  validUntil: computeValidUntil(QUOTED_AT),
  customerName: 'Cliente de Prueba',
  customerEmail: 'cliente@example.com',
  customerPhone: '+56 9 0000 0000',
  adminMessage: null,
  lines,
  totals: computeQuoteTotals(lines),
  ...overrides,
})

export const renderOptions = {
  siteUrl: 'https://tienda.test',
  portalUrl: 'https://tienda.test/cotizacion/COT-000042',
}
