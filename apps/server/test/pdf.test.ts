import { describe, expect, it } from 'vitest'
import { describeConfigEntry, renderQuotePdf } from '../src/server/lib/pdf.js'
import { configuredLine, makeDocument, plainLines, renderOptions } from './fixtures.js'
import { extractPdfText } from './pdf-text.js'

describe('renderQuotePdf', () => {
  it('renderiza 1 ítem con folio, fecha de quotedAt, validez y totales con IVA', async () => {
    const pdf = await renderQuotePdf(makeDocument([configuredLine]), renderOptions)
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')

    const { text, compact, numPages } = await extractPdfText(pdf)
    expect(numPages).toBe(1)
    expect(text).toContain('COT-000042')
    expect(text).toContain('Emisión original')
    // La fecha es quotedAt (14 mar 2025), no la de hoy; la validez, 30 días corridos después
    expect(text).toContain('14 de marzo de 2025')
    expect(text).toContain('13 de abril de 2025')
    expect(text).toContain('Estola bordada Magna')
    // 40 × 18.990 = 759.600; IVA 144.324; total 903.924
    expect(compact).toContain('$759.600')
    expect(compact).toContain('$144.324')
    expect(compact).toContain('$903.924')
    expect(compact).toContain('IVA(19%)')
    expect(text).toContain('https://tienda.test/cotizacion/COT-000042')
  })

  it('renderiza las opciones COLOR, TEXT y FILE de cada ítem', async () => {
    const pdf = await renderQuotePdf(makeDocument([configuredLine]), renderOptions)
    const { text } = await extractPdfText(pdf)
    expect(text).toContain('Color de ribete: Azul ceremonial (#1F4FA0)')
    expect(text).toContain('Texto bordado: «Generación 2026»')
    expect(text).toContain('Logo institucional: archivo recibido (3f9a1c2b.png)')
  })

  it('renderiza 5 ítems en una sola página', async () => {
    const lines = [configuredLine, ...plainLines]
    const pdf = await renderQuotePdf(makeDocument(lines), renderOptions)
    const { text, compact, numPages } = await extractPdfText(pdf)
    expect(numPages).toBe(1)
    for (const line of lines) expect(text).toContain(line.name)
    // Neto 2.755.500; IVA 523.545; total 3.279.045
    expect(compact).toContain('$2.755.500')
    expect(compact).toContain('$523.545')
    expect(compact).toContain('$3.279.045')
  })

  it('pagina con muchos ítems y numera todas las páginas', async () => {
    const lines = Array.from({ length: 30 }, (_, i) => ({ ...configuredLine, itemId: i + 1, name: `Producto ${i + 1}` }))
    const pdf = await renderQuotePdf(makeDocument(lines), renderOptions)
    const { pages, numPages } = await extractPdfText(pdf)
    expect(numPages).toBeGreaterThan(1)
    pages.forEach((page, i) => expect(page).toContain(`Página ${i + 1} de ${numPages}`))
    expect(pages.join(' ')).toContain('Producto 30')
  })

  it('una opción de texto enorme no deja páginas vacías ni corta los montos', async () => {
    const huge = { ...configuredLine, configuration: [{ label: 'Texto', type: 'TEXT' as const, value: 'x'.repeat(5000) }] }
    const pdf = await renderQuotePdf(makeDocument([huge]), renderOptions)
    const { pages, numPages } = await extractPdfText(pdf)
    expect(numPages).toBe(1)
    expect(pages[0]).toContain('Estola bordada Magna')
    expect(pages[0]).toContain('…')
  })

  it('muestra la revisión y el mensaje del admin', async () => {
    const pdf = await renderQuotePdf(
      makeDocument([configuredLine], { rev: 2, adminMessage: 'Incluye bordado del logo.' }),
      renderOptions
    )
    const { text } = await extractPdfText(pdf)
    expect(text).toContain('Revisión 2')
    expect(text).toContain('COT-000042-rev2')
    expect(text).toContain('Incluye bordado del logo.')
  })

  it('marca la vista previa como no válida', async () => {
    const pdf = await renderQuotePdf(makeDocument([configuredLine]), { ...renderOptions, preview: true })
    const { text } = await extractPdfText(pdf)
    expect(text).toContain('VISTA PREVIA')
    expect(text).toContain('no válida como cotización')
  })
})

describe('describeConfigEntry', () => {
  it('usa el valor si el color no tiene nombre', () => {
    expect(describeConfigEntry({ label: 'Color', type: 'COLOR', value: '#C9A961' })).toBe('#C9A961')
  })
  it('decodifica el nombre del archivo', () => {
    expect(describeConfigEntry({ label: 'Logo', type: 'FILE', value: '/uploads/mi%20logo.png' })).toBe(
      'archivo recibido (mi logo.png)'
    )
  })
})
