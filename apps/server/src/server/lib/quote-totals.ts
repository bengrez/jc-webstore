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

export const computeValidUntil = (quotedAt: Date, days = QUOTE_VALIDITY_DAYS) =>
  new Date(quotedAt.getTime() + days * 24 * 60 * 60 * 1000)
