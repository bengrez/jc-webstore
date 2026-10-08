import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'
import { formatClp } from './currency.js'
import type { DocumentConfigEntry, QuoteDocument, QuoteDocumentLine } from './quote-document.js'
import { IVA_RATE } from './quote-totals.js'

// Paleta de marca (CONTEXT.md del proyecto)
const COLORS = {
  ivory: '#F4EFE6',
  ivorySoft: '#FAF7F1',
  navy: '#0E2647',
  navyIndustrial: '#3D5A80',
  gold: '#C9A961',
  dark: '#0E1A2B',
  muted: '#5B6577',
  rule: '#E4DCCB',
}

const PAGE = { width: 595.28, height: 841.89, marginX: 48, marginTop: 48, marginBottom: 72 }
const CONTENT_RIGHT = PAGE.width - PAGE.marginX
const CONTENT_WIDTH = CONTENT_RIGHT - PAGE.marginX
const TIME_ZONE = 'America/Santiago'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
// src/server/lib y dist/server/lib quedan a la misma profundidad de apps/server
const LOGO_PATH = path.resolve(moduleDir, '../../../assets/brand/logo-jr.png')

type FontSet = { serif: string; regular: string; semibold: string; bold: string }

const resolveFonts = (): { files: Record<string, string> | null; set: FontSet } => {
  try {
    const require = createRequire(import.meta.url)
    const files = {
      'DMSerif': require.resolve('@fontsource/dm-serif-display/files/dm-serif-display-latin-400-normal.woff'),
      'Inter': require.resolve('@fontsource/inter/files/inter-latin-400-normal.woff'),
      'Inter-SemiBold': require.resolve('@fontsource/inter/files/inter-latin-600-normal.woff'),
      'Inter-Bold': require.resolve('@fontsource/inter/files/inter-latin-700-normal.woff'),
    }
    return { files, set: { serif: 'DMSerif', regular: 'Inter', semibold: 'Inter-SemiBold', bold: 'Inter-Bold' } }
  } catch {
    console.warn('[pdf] fuentes de marca no encontradas; se usa Helvetica.')
    return {
      files: null,
      set: { serif: 'Times-Bold', regular: 'Helvetica', semibold: 'Helvetica-Bold', bold: 'Helvetica-Bold' },
    }
  }
}

const FONTS = resolveFonts()

const formatDate = (date: Date) =>
  date.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric', timeZone: TIME_ZONE })

const isHexColor = (value: string) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())

const fileNameFromUrl = (value: string) => {
  const last = value.split('/').pop() ?? value
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

export const describeConfigEntry = (entry: DocumentConfigEntry) => {
  switch (entry.type) {
    case 'COLOR':
      return entry.choiceLabel ? `${entry.choiceLabel} (${entry.value.toUpperCase()})` : entry.value
    case 'FILE':
      return `archivo recibido (${fileNameFromUrl(entry.value)})`
    default:
      return `«${entry.value}»`
  }
}

export type RenderQuotePdfOptions = {
  siteUrl: string
  portalUrl: string
  // Vista previa del admin: marca de agua y aviso de que no es válida
  preview?: boolean
}

export const renderQuotePdf = (quote: QuoteDocument, options: RenderQuotePdfOptions): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      bufferPages: true,
      margins: {
        top: PAGE.marginTop,
        bottom: PAGE.marginBottom,
        left: PAGE.marginX,
        right: PAGE.marginX,
      },
      info: {
        Title: `Cotización ${quote.folio}${quote.rev > 0 ? ` rev. ${quote.rev}` : ''}`,
        Author: 'Confecciones Juany Reyes',
        Subject: options.preview ? 'Vista previa de cotización' : 'Cotización formal',
        CreationDate: quote.quotedAt,
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    try {
      if (FONTS.files) {
        for (const [name, file] of Object.entries(FONTS.files)) doc.registerFont(name, file)
      }
      drawDocument(doc, quote, options)
      drawPageChrome(doc, quote, options)
      doc.end()
    } catch (error) {
      reject(error)
    }
  })

type Doc = PDFKit.PDFDocument
const F = FONTS.set
const pageBottom = () => PAGE.height - PAGE.marginBottom

const eyebrow = (doc: Doc, text: string, x: number, y: number, width: number, align: 'left' | 'right' = 'left') => {
  doc
    .font(F.semibold)
    .fontSize(7.5)
    .fillColor(COLORS.gold)
    .text(text.toUpperCase(), x, y, { width, align, characterSpacing: 1.6, lineBreak: false })
}

const drawDocument = (doc: Doc, quote: QuoteDocument, options: RenderQuotePdfOptions) => {
  // ── Banda de cabecera marfil con logo ──
  const bandHeight = 118
  doc.rect(0, 0, PAGE.width, bandHeight).fill(COLORS.ivory)
  doc.rect(0, bandHeight, PAGE.width, 2).fill(COLORS.gold)

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, PAGE.marginX, 20, { height: 78 })
  } else {
    doc.font(F.serif).fontSize(18).fillColor(COLORS.navy).text('Confecciones Juany Reyes', PAGE.marginX, 52)
  }

  const headX = 300
  const headW = CONTENT_RIGHT - headX
  eyebrow(doc, options.preview ? 'Cotización · vista previa' : 'Cotización', headX, 30, headW, 'right')
  doc
    .font(F.serif)
    .fontSize(28)
    .fillColor(COLORS.navy)
    .text(quote.folio, headX, 44, { width: headW, align: 'right', lineBreak: false })
  doc
    .font(F.regular)
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(quote.rev > 0 ? `Revisión ${quote.rev}` : 'Emisión original', headX, 80, {
      width: headW,
      align: 'right',
      lineBreak: false,
    })

  // ── Fechas y condición ──
  let y = bandHeight + 20
  const colW = CONTENT_WIDTH / 3
  const meta: Array<[string, string]> = [
    ['Fecha de emisión', formatDate(quote.quotedAt)],
    ['Válida hasta', formatDate(quote.validUntil)],
    ['Precios', `Netos + IVA ${Math.round(IVA_RATE * 100)} %`],
  ]
  meta.forEach(([label, value], i) => {
    const x = PAGE.marginX + colW * i
    eyebrow(doc, label, x, y, colW - 8)
    doc.font(F.semibold).fontSize(10.5).fillColor(COLORS.navy).text(value, x, y + 13, { width: colW - 8, lineBreak: false })
  })

  // ── Cliente ──
  y += 42
  doc.moveTo(PAGE.marginX, y).lineTo(CONTENT_RIGHT, y).lineWidth(0.6).strokeColor(COLORS.rule).stroke()
  y += 14
  eyebrow(doc, 'Preparada para', PAGE.marginX, y, CONTENT_WIDTH)
  doc.font(F.serif).fontSize(15).fillColor(COLORS.navy).text(quote.customerName, PAGE.marginX, y + 13, { width: CONTENT_WIDTH })
  const contact = [quote.customerEmail, quote.customerPhone].filter(Boolean).join('  ·  ')
  doc.font(F.regular).fontSize(9.5).fillColor(COLORS.muted).text(contact, PAGE.marginX, doc.y + 2, { width: CONTENT_WIDTH })

  // ── Tabla de ítems ──
  y = doc.y + 16
  y = drawTableHeader(doc, y)
  let pageTableTop = y
  quote.lines.forEach((line, index) => {
    const height = measureRow(doc, line)
    // Si la fila no cabe ni en una página nueva, se dibuja donde está en vez de dejar una vacía
    if (y + height > pageBottom() && y > pageTableTop) {
      doc.addPage()
      y = drawContinuationHeader(doc, quote)
      y = drawTableHeader(doc, y)
      pageTableTop = y
    }
    drawRow(doc, line, y, height, index)
    y += height
  })
  doc.moveTo(PAGE.marginX, y).lineTo(CONTENT_RIGHT, y).lineWidth(0.8).strokeColor(COLORS.navy).stroke()

  // ── Totales ──
  const totalsHeight = 92
  y += 14
  if (y + totalsHeight > pageBottom()) {
    doc.addPage()
    y = drawContinuationHeader(doc, quote)
  }
  y = drawTotals(doc, quote, y)

  // ── Mensaje del admin ──
  if (quote.adminMessage && quote.adminMessage.trim()) {
    y += 18
    doc.font(F.regular).fontSize(9.5)
    const textW = CONTENT_WIDTH - 16
    const msgHeight = doc.heightOfString(quote.adminMessage, { width: textW }) + 18
    if (y + Math.min(msgHeight, 160) > pageBottom()) {
      doc.addPage()
      y = drawContinuationHeader(doc, quote)
    }
    eyebrow(doc, 'Mensaje', PAGE.marginX + 16, y, textW)
    const startY = y
    doc.font(F.regular).fontSize(9.5).fillColor(COLORS.dark).text(quote.adminMessage, PAGE.marginX + 16, y + 13, { width: textW })
    // Si el mensaje cambió de página, la barra sólo marca la parte de la página actual
    const barTop = doc.y < startY ? PAGE.marginTop : startY
    doc.rect(PAGE.marginX, barTop, 2.5, doc.y - barTop).fill(COLORS.gold)
    y = doc.y
  }

  // ── Condiciones ──
  const conditions = [
    `Valores en pesos chilenos (CLP). Los precios unitarios son netos; el IVA (${Math.round(IVA_RATE * 100)} %) se suma al total.`,
    `Esta cotización es válida por ${quote.validityDays} días desde su emisión, hasta el ${formatDate(quote.validUntil)}.`,
    'No incluye despacho salvo que se indique en el mensaje. Plazos de producción sujetos a confirmación del diseño.',
    `Para aceptar o rechazar esta cotización, ingresa a ${options.portalUrl}`,
  ]
  doc.font(F.regular).fontSize(8.5)
  const condHeight = conditions.reduce((sum, c) => sum + doc.heightOfString(`•  ${c}`, { width: CONTENT_WIDTH }) + 3, 0) + 14
  y += 20
  if (y + condHeight > pageBottom()) {
    doc.addPage()
    y = drawContinuationHeader(doc, quote)
  }
  eyebrow(doc, 'Condiciones', PAGE.marginX, y, CONTENT_WIDTH)
  doc.y = y + 14
  for (const condition of conditions) {
    const isPortal = condition.includes(options.portalUrl)
    doc
      .font(F.regular)
      .fontSize(8.5)
      .fillColor(COLORS.muted)
      .text(`•  ${condition}`, PAGE.marginX, doc.y, {
        width: CONTENT_WIDTH,
        link: isPortal ? options.portalUrl : undefined,
      })
    doc.y += 3
  }
}

const COLS = {
  desc: { x: PAGE.marginX, w: 259 },
  qty: { x: PAGE.marginX + 259, w: 50 },
  unit: { x: PAGE.marginX + 309, w: 95 },
  total: { x: PAGE.marginX + 404, w: CONTENT_WIDTH - 404 },
}
const CELL_PAD = 8
const CONFIG_INDENT = 12

const drawTableHeader = (doc: Doc, y: number) => {
  const h = 24
  doc.rect(PAGE.marginX, y, CONTENT_WIDTH, h).fill(COLORS.navy)
  doc.font(F.semibold).fontSize(8).fillColor(COLORS.ivory)
  const ty = y + 8
  doc.text('DESCRIPCIÓN', COLS.desc.x + CELL_PAD, ty, { width: COLS.desc.w - CELL_PAD, characterSpacing: 1, lineBreak: false })
  doc.text('CANT.', COLS.qty.x, ty, { width: COLS.qty.w, align: 'center', characterSpacing: 1, lineBreak: false })
  doc.text('UNITARIO NETO', COLS.unit.x, ty, { width: COLS.unit.w - CELL_PAD, align: 'right', characterSpacing: 0.6, lineBreak: false })
  doc.text('TOTAL NETO', COLS.total.x, ty, { width: COLS.total.w - CELL_PAD, align: 'right', characterSpacing: 0.6, lineBreak: false })
  return y + h
}

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)
// Acotado para que una sola fila nunca supere una página
const configText = (entry: DocumentConfigEntry) =>
  `${truncate(entry.label, 60)}: ${truncate(describeConfigEntry(entry), 240)}`
const descTextWidth = COLS.desc.w - CELL_PAD * 2

const measureRow = (doc: Doc, line: QuoteDocumentLine) => {
  doc.font(F.semibold).fontSize(10)
  let h = CELL_PAD + doc.heightOfString(line.name, { width: descTextWidth })
  doc.font(F.regular).fontSize(8.5)
  for (const entry of line.configuration) {
    h += 3 + doc.heightOfString(configText(entry), { width: descTextWidth - CONFIG_INDENT })
  }
  return h + CELL_PAD + 2
}

const drawRow = (doc: Doc, line: QuoteDocumentLine, y: number, height: number, index: number) => {
  if (index % 2 === 1) doc.rect(PAGE.marginX, y, CONTENT_WIDTH, height).fill(COLORS.ivorySoft)
  doc.moveTo(PAGE.marginX, y + height).lineTo(CONTENT_RIGHT, y + height).lineWidth(0.4).strokeColor(COLORS.rule).stroke()

  const textX = COLS.desc.x + CELL_PAD
  doc.font(F.semibold).fontSize(10).fillColor(COLORS.navy).text(line.name, textX, y + CELL_PAD, { width: descTextWidth })
  let cy = doc.y
  for (const entry of line.configuration) {
    cy += 3
    if (entry.type === 'COLOR' && isHexColor(entry.value)) {
      doc.circle(textX + 4, cy + 5, 3.6).fillAndStroke(entry.value, COLORS.rule)
    } else {
      doc.rect(textX + 2, cy + 4, 3, 3).fill(COLORS.gold)
    }
    doc.font(F.regular).fontSize(8.5).fillColor(COLORS.muted).text(configText(entry), textX + CONFIG_INDENT, cy, {
      width: descTextWidth - CONFIG_INDENT,
    })
    cy = doc.y
  }

  const numY = y + CELL_PAD + 1
  doc.font(F.regular).fontSize(10).fillColor(COLORS.dark)
  doc.text(line.quantity.toLocaleString('es-CL'), COLS.qty.x, numY, { width: COLS.qty.w, align: 'center', lineBreak: false })
  doc.text(formatClp(line.unitPrice), COLS.unit.x, numY, { width: COLS.unit.w - CELL_PAD, align: 'right', lineBreak: false })
  doc.font(F.semibold).fillColor(COLORS.navy)
  doc.text(formatClp(line.unitPrice * line.quantity), COLS.total.x, numY, {
    width: COLS.total.w - CELL_PAD,
    align: 'right',
    lineBreak: false,
  })
}

const drawTotals = (doc: Doc, quote: QuoteDocument, y: number) => {
  const boxX = PAGE.marginX + 290
  const boxW = CONTENT_RIGHT - boxX
  const labelW = 110
  const row = (label: string, value: string, rowY: number) => {
    doc.font(F.regular).fontSize(10).fillColor(COLORS.muted).text(label, boxX, rowY, { width: labelW, lineBreak: false })
    doc.font(F.semibold).fontSize(10).fillColor(COLORS.dark).text(value, boxX + labelW, rowY, {
      width: boxW - labelW - CELL_PAD,
      align: 'right',
      lineBreak: false,
    })
  }
  row('Subtotal neto', formatClp(quote.totals.netAmount), y)
  row(`IVA (${Math.round(IVA_RATE * 100)} %)`, formatClp(quote.totals.ivaAmount), y + 18)

  const totalY = y + 42
  doc.rect(boxX, totalY, boxW, 38).fill(COLORS.dark)
  doc.rect(boxX, totalY, boxW, 2).fill(COLORS.gold)
  doc.font(F.semibold).fontSize(8).fillColor(COLORS.gold).text('TOTAL', boxX + 12, totalY + 15, { characterSpacing: 1.6, lineBreak: false })
  doc.font(F.serif).fontSize(18).fillColor(COLORS.ivory).text(formatClp(quote.totals.totalAmount), boxX, totalY + 9, {
    width: boxW - 12,
    align: 'right',
    lineBreak: false,
  })
  return totalY + 38
}

const drawContinuationHeader = (doc: Doc, quote: QuoteDocument) => {
  const y = PAGE.marginTop
  doc.font(F.serif).fontSize(14).fillColor(COLORS.navy).text(quote.folio, PAGE.marginX, y, { lineBreak: false })
  eyebrow(doc, 'Continuación', PAGE.marginX, y + 4, CONTENT_WIDTH, 'right')
  doc.moveTo(PAGE.marginX, y + 24).lineTo(CONTENT_RIGHT, y + 24).lineWidth(1).strokeColor(COLORS.gold).stroke()
  return y + 36
}

// Pie de página, numeración y marca de agua de vista previa en todas las páginas.
const drawPageChrome = (doc: Doc, quote: QuoteDocument, options: RenderQuotePdfOptions) => {
  const range = doc.bufferedPageRange()
  const host = (() => {
    try {
      return new URL(options.siteUrl).host
    } catch {
      return options.siteUrl
    }
  })()

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    // Escribir bajo el margen inferior agrega páginas si no se libera el margen
    const savedBottom = doc.page.margins.bottom
    doc.page.margins.bottom = 0

    if (options.preview) {
      doc.save()
      doc.rotate(-32, { origin: [PAGE.width / 2, PAGE.height / 2] })
      doc
        .font(F.serif)
        .fontSize(78)
        .fillColor(COLORS.gold)
        .fillOpacity(0.16)
        .text('VISTA PREVIA', 0, PAGE.height / 2 - 40, { width: PAGE.width, align: 'center', lineBreak: false })
      doc.restore()
      doc.fillOpacity(1)
    }

    const footerY = PAGE.height - 46
    doc.rect(0, footerY - 10, PAGE.width, 56).fill(COLORS.dark)
    doc.rect(0, footerY - 10, PAGE.width, 1.5).fill(COLORS.gold)
    doc.font(F.serif).fontSize(10).fillColor(COLORS.ivory).text('Confecciones Juany Reyes', PAGE.marginX, footerY + 4, { lineBreak: false })
    doc
      .font(F.regular)
      .fontSize(8)
      .fillColor(COLORS.gold)
      .text(host, PAGE.marginX, footerY + 18, { width: 200, lineBreak: false, link: options.siteUrl })
    const right = options.preview
      ? `Vista previa · no válida como cotización · Página ${i + 1} de ${range.count}`
      : `${quote.folio}${quote.rev > 0 ? `-rev${quote.rev}` : ''} · Página ${i + 1} de ${range.count}`
    doc.font(F.regular).fontSize(8).fillColor(COLORS.ivory).text(right, PAGE.marginX, footerY + 11, {
      width: CONTENT_WIDTH,
      align: 'right',
      lineBreak: false,
    })

    doc.page.margins.bottom = savedBottom
  }
}
