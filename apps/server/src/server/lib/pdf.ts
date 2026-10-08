import PDFDocument from 'pdfkit'
import { formatClp } from './currency.js'
import { formatQuoteFolio } from './quote-folio.js'

export type QuotePdfInput = {
  quoteId: number
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  adminMessage?: string | null
  items: Array<{
    name: string
    quantity: number
    quotedUnitPrice: number
  }>
  quotedSubtotal: number
}

export const generateQuotePdf = (input: QuotePdfInput): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const folio = formatQuoteFolio(input.quoteId)
    const date = new Date().toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const portalUrl = `https://confeccionesjuany.cl/cotizacion/${folio}`
    const IVA_RATE = 0.19

    // ── Header ──
    doc.fontSize(20).font('Helvetica-Bold').text('CONFECCIONES JUANY REYES', { align: 'center' })
    doc.fontSize(12).font('Helvetica').text('Cotización Oficial', { align: 'center' })
    doc.moveDown(0.5)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.5)

    // Folio + date
    doc.fontSize(10)
    doc.text(`Folio: ${folio}`, 50, doc.y, { continued: true })
    doc.text(`Fecha: ${date}`, { align: 'right' })
    doc.moveDown(0.5)

    // ── Customer info ──
    doc.font('Helvetica-Bold').text('Cliente')
    doc.font('Helvetica')
    doc.text(`Nombre: ${input.customerName}`)
    doc.text(`Email: ${input.customerEmail}`)
    if (input.customerPhone) doc.text(`Teléfono: ${input.customerPhone}`)
    doc.moveDown()

    // ── Admin message ──
    if (input.adminMessage) {
      doc.font('Helvetica-Bold').text('Mensaje')
      doc.font('Helvetica').text(input.adminMessage)
      doc.moveDown()
    }

    // ── Items table header ──
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold').fontSize(9)
    const tableTop = doc.y
    doc.text('Producto', 50, tableTop, { width: 230, continued: true })
    doc.text('Cant.', { width: 60, align: 'center', continued: true })
    doc.text('Precio unit.', { width: 105, align: 'right', continued: true })
    doc.text('Subtotal', { width: 100, align: 'right' })
    doc.moveDown(0.3)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.3)

    // ── Items rows ──
    doc.font('Helvetica').fontSize(9)
    for (const item of input.items) {
      const rowY = doc.y
      doc.text(item.name, 50, rowY, { width: 230, continued: true })
      doc.text(String(item.quantity), { width: 60, align: 'center', continued: true })
      doc.text(formatClp(item.quotedUnitPrice), { width: 105, align: 'right', continued: true })
      doc.text(formatClp(item.quotedUnitPrice * item.quantity), { width: 100, align: 'right' })
    }

    // ── Totals ──
    doc.moveDown(0.5)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.3)
    doc.font('Helvetica').fontSize(10)
    const iva = Math.round(input.quotedSubtotal * IVA_RATE)

    doc.text('Subtotal neto:', 350, doc.y, { width: 100, continued: true })
    doc.text(formatClp(input.quotedSubtotal), { width: 95, align: 'right' })
    doc.text('IVA (19%):', 350, doc.y, { width: 100, continued: true })
    doc.text(formatClp(iva), { width: 95, align: 'right' })
    doc.font('Helvetica-Bold')
    doc.text('Total estimado:', 350, doc.y, { width: 100, continued: true })
    doc.text(formatClp(input.quotedSubtotal + iva), { width: 95, align: 'right' })
    doc.moveDown()

    // ── Footer ──
    doc.font('Helvetica').fontSize(9).fillColor('#666666')
    doc.text('Para aceptar o rechazar esta cotización, visita:', { align: 'center' })
    doc.text(portalUrl, { align: 'center', link: portalUrl, underline: true })
    doc.moveDown(0.5)
    doc.text('Esta cotización es referencial. Los precios no incluyen envío.', { align: 'center' })

    doc.end()
  })
