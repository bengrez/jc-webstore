import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { formatQuoteFolio } from '../lib/quote-folio.js'
import { sendCustomerResponseNotification } from '../lib/mailer.js'

export const quotePortalRouter = Router()

quotePortalRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

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
    },
  })

  if (!quote) {
    return res.status(404).json({ error: 'not_found', message: 'Cotización no encontrada.' })
  }

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
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    items,
    notes: quote.notes.map((note) => ({
      body: note.body,
      createdAt: note.createdAt.toISOString(),
    })),
  })
})

quotePortalRouter.post('/quotes/:folio/respond', async (req, res) => {
  const quoteId = parseFolio(req.params.folio)
  if (!quoteId) {
    return res.status(400).json({ error: 'invalid_folio', message: 'Folio no válido.' })
  }

  const parsed = z
    .object({ action: z.enum(['ACCEPT', 'REJECT']) })
    .safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error' })
  }

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } })
  if (!quote) return res.status(404).json({ error: 'not_found' })

  if (quote.status !== 'QUOTED') {
    return res.status(409).json({
      error: 'invalid_status',
      message: 'Solo se puede responder a cotizaciones en estado Cotizada.',
    })
  }

  const newStatus = parsed.data.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED'
  await prisma.quote.update({ where: { id: quoteId }, data: { status: newStatus } })

  sendCustomerResponseNotification({
    quoteId,
    customerName: quote.customerName,
    action: newStatus,
  }).catch(() => {/* non-fatal */})

  res.json({ ok: true, status: newStatus })
})
