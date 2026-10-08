import type { Prisma } from '@prisma/client'
import { env } from '../../lib/env.js'
import { formatQuoteFolio } from './quote-folio.js'
import { computeQuoteTotals, computeValidUntil, type QuoteTotals } from './quote-totals.js'

export const quoteDocumentInclude = {
  items: {
    include: { product: { include: { options: true } } },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.QuoteInclude

export type QuoteForDocument = Prisma.QuoteGetPayload<{ include: typeof quoteDocumentInclude }>

export type DocumentConfigEntry = {
  label: string
  type: 'COLOR' | 'TEXT' | 'FILE'
  value: string
  // Para COLOR: nombre de la opción elegida (p. ej. "Azul marino") si se encuentra
  choiceLabel?: string
}

export type QuoteDocumentLine = {
  itemId: number
  name: string
  quantity: number
  unitPrice: number
  configuration: DocumentConfigEntry[]
}

export type QuoteDocument = {
  folio: string
  rev: number
  quotedAt: Date
  validityDays: number
  validUntil: Date
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  adminMessage?: string | null
  lines: QuoteDocumentLine[]
  totals: QuoteTotals
}

const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const parseConfiguration = (
  raw: string,
  options: Array<{ id: number; choices: string }>
): DocumentConfigEntry[] => {
  const parsed = parseJson(raw)
  if (!Array.isArray(parsed)) return []
  return parsed.flatMap((entry): DocumentConfigEntry[] => {
    if (!entry || typeof entry !== 'object') return []
    const { optionId, label, type, value } = entry as Record<string, unknown>
    if (typeof label !== 'string' || typeof value !== 'string' || value.trim() === '') return []
    if (type !== 'COLOR' && type !== 'TEXT' && type !== 'FILE') return []
    let choiceLabel: string | undefined
    if (type === 'COLOR') {
      const option = options.find((opt) => opt.id === optionId)
      const choices = option ? parseJson(option.choices) : null
      if (Array.isArray(choices)) {
        const match = choices.find(
          (c): c is { label: string; value: string } =>
            !!c && typeof c === 'object' && (c as { value?: unknown }).value === value
        )
        if (match && typeof match.label === 'string') choiceLabel = match.label
      }
    }
    return [{ label, type, value, choiceLabel }]
  })
}

const snapshotName = (snapshot: string, fallback: string) => {
  const parsed = parseJson(snapshot)
  if (parsed && typeof parsed === 'object') {
    const name = (parsed as { name?: unknown }).name
    if (typeof name === 'string' && name.trim()) return name
  }
  return fallback
}

// Arma el documento que se renderiza. `priceOverrides` y `adminMessage` permiten
// previsualizar o emitir lo que el admin tiene en pantalla sin guardarlo antes.
export const buildQuoteDocument = (
  quote: QuoteForDocument,
  params: {
    rev: number
    quotedAt: Date
    priceOverrides?: Map<number, number>
    adminMessage?: string | null
  }
): QuoteDocument => {
  const lines = quote.items.map((item) => ({
    itemId: item.id,
    name: snapshotName(item.productSnapshot, item.product.name),
    quantity: item.quantity,
    unitPrice: params.priceOverrides?.get(item.id) ?? item.quotedUnitPrice ?? item.unitPrice,
    configuration: parseConfiguration(item.configuration, item.product.options),
  }))

  return {
    folio: formatQuoteFolio(quote.id),
    rev: params.rev,
    quotedAt: params.quotedAt,
    validityDays: env.QUOTE_VALIDITY_DAYS,
    validUntil: computeValidUntil(params.quotedAt, env.QUOTE_VALIDITY_DAYS),
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone,
    adminMessage: params.adminMessage === undefined ? quote.adminMessage : params.adminMessage,
    lines,
    totals: computeQuoteTotals(lines),
  }
}
