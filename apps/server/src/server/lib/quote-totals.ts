export const IVA_RATE = 0.19
export const QUOTE_VALIDITY_DAYS = 30

export type QuoteTotals = {
  netAmount: number
  ivaAmount: number
  totalAmount: number
}

// Precios netos en CLP enteros; el IVA se redondea al peso sobre el neto total.
export const computeQuoteTotals = (
  lines: Array<{ quantity: number; unitPrice: number }>
): QuoteTotals => {
  const netAmount = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  const ivaAmount = Math.round(netAmount * IVA_RATE)
  return { netAmount, ivaAmount, totalAmount: netAmount + ivaAmount }
}

const TIME_ZONE = 'America/Santiago'

// Días corridos en el calendario de Chile, no 30 × 24 h: con el cambio de horario una suma
// en milisegundos puede caer en el día 29 o 31. Devuelve ese día a las 12:00 UTC
// (mañana en Chile), que se muestra con la misma fecha en America/Santiago.
export const computeValidUntil = (quotedAt: Date, days = QUOTE_VALIDITY_DAYS) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: 'numeric', day: 'numeric' })
      .formatToParts(quotedAt)
      .map((part) => [part.type, part.value])
  )
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + days, 12))
}
