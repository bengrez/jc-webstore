import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { env } from '../../lib/env.js'
import { prisma } from '../../lib/prisma.js'
import { formatQuoteFolio } from '../lib/quote-folio.js'
import { sendCustomerResponseNotification } from '../lib/mailer.js'
import { resolveRevisionPath } from '../lib/quote-storage.js'
import { tokensMatch } from '../lib/quote-token.js'

export const quotePortalRouter = Router()

quotePortalRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    // Los tests (vitest y e2e) consultan el portal muchas veces desde la misma IP
    skip: () => env.NODE_ENV === 'test',
  })
)

// El portal es público y los folios son correlativos: ver, descargar y responder exigen el
// token del link del correo. Sin token, con uno inválido o ajeno, 404 como si no existiera.
const NOT_FOUND = { error: 'not_found', message: 'Cotización no encontrada.' }

const parseFolio = (folio: string): number | null => {
  const match = folio.match(/^COT-(\d+)$/i)
  if (!match) return null
  return Number(match[1])
}

quotePortalRouter.get('/quotes/:folio', async (req, res) => {
  const quoteId = parseFolio(req.params.folio)
  if (!quoteId) {
    return res.status(400).json({ error: 'invalid_folio', message: 'Folio no válido.' })
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      items: {
        include: { product: true },
      },
      notes: {
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
      },
      revisions: {
        where: { sentAt: { not: null } },
        orderBy: { rev: 'desc' },
        take: 1,
      },
    },
  })

  if (!quote || !tokensMatch(quote.publicToken, req.query.t)) {
    return res.status(404).json(NOT_FOUND)
  }

  const latest = quote.revisions[0]

  const items = quote.items.map((item) => {
    let configuration: Array<{ label: string; type: string; value: string }> = []
    try {
      const parsed = JSON.parse(item.configuration)
      if (Array.isArray(parsed)) configuration = parsed
    } catch {
      // ignore
    }

    return {
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      quotedUnitPrice: item.quotedUnitPrice ?? null,
      image: JSON.parse(item.product.images)[0] ?? null,
      configuration,
    }
  })

  res.json({
    folio: formatQuoteFolio(quote.id),
    status: quote.status,
    customerName: quote.customerName.split(' ')[0],
    subtotal: quote.subtotal,
    adminMessage: quote.adminMessage ?? null,
    // El PDF se descarga con el token del correo; aquí sólo se informa que existe
    pdfAvailable: Boolean(latest),
    formal: latest
      ? {
          rev: latest.rev,
          issuedAt: latest.issuedAt.toISOString(),
          validUntil: latest.validUntil.toISOString(),
          netAmount: latest.netAmount,
          ivaAmount: latest.ivaAmount,
          totalAmount: latest.totalAmount,
        }
      : null,
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    items,
    notes: quote.notes.map((note) => ({
      body: note.body,
      createdAt: note.createdAt.toISOString(),
    })),
  })
})

// Descarga del PDF vigente. Exige el token del correo: sin token, con uno ajeno o sin
// emisión, responde 404 igual que un folio inexistente para no revelar nada.
quotePortalRouter.get('/quotes/:folio/pdf', async (req, res) => {
  const notFound = () => res.status(404).json({ error: 'not_found', message: 'Documento no encontrado.' })
  const quoteId = parseFolio(req.params.folio)
  if (!quoteId) return notFound()

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      publicToken: true,
      revisions: { where: { sentAt: { not: null } }, orderBy: { rev: 'desc' }, take: 1 },
    },
  })
  if (!quote || !tokensMatch(quote.publicToken, req.query.t)) return notFound()

  const latest = quote.revisions[0]
  const fullPath = latest ? resolveRevisionPath(latest.filePath) : null
  if (!latest || !fullPath) return notFound()

  res.setHeader('Cache-Control', 'private, no-store')
  res.download(fullPath, latest.filePath, (error) => {
    if (error) {
      console.error(`[portal] no se pudo servir ${latest.filePath}`, error)
      if (!res.headersSent) notFound()
    }
  })
})

quotePortalRouter.post('/quotes/:folio/respond', async (req, res) => {
  const quoteId = parseFolio(req.params.folio)
  if (!quoteId) {
    return res.status(400).json({ error: 'invalid_folio', message: 'Folio no válido.' })
  }

  const parsed = z
    .object({ action: z.enum(['ACCEPT', 'REJECT']), token: z.string().optional() })
    .safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error' })
  }

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } })
  if (!quote || !tokensMatch(quote.publicToken, parsed.data.token)) return res.status(404).json(NOT_FOUND)

  const newStatus = parsed.data.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED'
  // Condicionado al estado: dos respuestas simultáneas no se pisan
  const { count } = await prisma.quote.updateMany({
    where: { id: quoteId, status: 'QUOTED' },
    data: { status: newStatus },
  })
  if (count === 0) {
    return res.status(409).json({
      error: 'invalid_status',
      message: 'Solo se puede responder a cotizaciones en estado Cotizada.',
    })
  }

  sendCustomerResponseNotification({
    quoteId,
    customerName: quote.customerName,
    action: newStatus,
  }).catch(() => {/* non-fatal */})

  res.json({ ok: true, status: newStatus })
})
