import { describe, expect, it } from 'vitest'
import { computeQuoteTotals, computeValidUntil, IVA_RATE, QUOTE_VALIDITY_DAYS } from '../src/server/lib/quote-totals.js'
import { revisionFileName } from '../src/server/lib/quote-storage.js'

describe('computeQuoteTotals', () => {
  it('suma netos y agrega IVA del 19 %', () => {
    expect(IVA_RATE).toBe(0.19)
    expect(computeQuoteTotals([{ quantity: 10, unitPrice: 1000 }, { quantity: 2, unitPrice: 2500 }])).toEqual({
      netAmount: 15000,
      ivaAmount: 2850,
      totalAmount: 17850,
    })
  })

  it('redondea el IVA al peso sobre el neto total', () => {
    // 3 × 333 = 999 → IVA 189,81 → 190
    expect(computeQuoteTotals([{ quantity: 3, unitPrice: 333 }])).toEqual({
      netAmount: 999,
      ivaAmount: 190,
      totalAmount: 1189,
    })
    // 1 × 50 = 50 → IVA 9,5 → 10 (Math.round)
    expect(computeQuoteTotals([{ quantity: 1, unitPrice: 50 }]).ivaAmount).toBe(10)
  })

  it('sin ítems da cero', () => {
    expect(computeQuoteTotals([])).toEqual({ netAmount: 0, ivaAmount: 0, totalAmount: 0 })
  })
})

describe('computeValidUntil', () => {
  it('da 30 días desde quotedAt', () => {
    expect(QUOTE_VALIDITY_DAYS).toBe(30)
    const quotedAt = new Date('2026-10-08T15:00:00Z')
    expect(computeValidUntil(quotedAt).toISOString()).toBe('2026-11-07T15:00:00.000Z')
  })
})

describe('revisionFileName', () => {
  it('la primera emisión va sin sufijo y las siguientes con -revN', () => {
    expect(revisionFileName('COT-000042', 0)).toBe('COT-000042.pdf')
    expect(revisionFileName('COT-000042', 1)).toBe('COT-000042-rev1.pdf')
    expect(revisionFileName('COT-000042', 2)).toBe('COT-000042-rev2.pdf')
  })
})
