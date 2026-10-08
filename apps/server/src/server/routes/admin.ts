import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import type { QuoteStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import {
  availabilityLabelToEnum,
  formatAvailabilityLabel,
  productToAdminResponse,
} from '../lib/product.js'
import { env } from '../../lib/env.js'
import { formatQuoteFolio } from '../lib/quote-folio.js'
import { renderQuotePdf } from '../lib/pdf.js'
import { MailNotConfiguredError, sendFormalQuoteToCustomer } from '../lib/mailer.js'
import { buildQuoteDocument, quoteDocumentInclude } from '../lib/quote-document.js'
import {
  RevisionFileExistsError,
  nextFreeRev,
  removeRevisionPdf,
  resolveRevisionPath,
  revisionFileName,
  sha256Hex,
  writeRevisionPdf,
} from '../lib/quote-storage.js'
import { generatePublicToken } from '../lib/quote-token.js'
import { portalUrl } from '../lib/site.js'
import {
  clearAdminSessionCookie,
  createAdminSessionToken,
  requireAdminAuth,
  setAdminSessionCookie,
} from '../middleware/admin-auth.js'

export const adminRouter = Router()

adminRouter.post(
  '/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  async (req, res) => {
    const parsed = z
      .object({
        email: z.string().trim().email(),
        password: z.string().min(1),
      })
      .safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    })

    if (!admin) {
      return res.status(401).json({ error: 'invalid_credentials' })
    }

    const ok = await bcrypt.compare(parsed.data.password, admin.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: 'invalid_credentials' })
    }

    const token = createAdminSessionToken(admin.id)
    setAdminSessionCookie(res, token)

    return res.json({ ok: true })
  }
)

adminRouter.post('/logout', (req, res) => {
  clearAdminSessionCookie(res)
  res.json({ ok: true })
})

adminRouter.get('/me', requireAdminAuth, async (req, res) => {
  const admin = await prisma.adminUser.findUnique({
    where: { id: req.adminUserId },
    select: { id: true, email: true },
  })

  if (!admin) {
    clearAdminSessionCookie(res)
    return res.status(401).json({ error: 'unauthorized' })
  }

  res.json(admin)
})

adminRouter.use(requireAdminAuth)

adminRouter.get('/products', async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true'

  const products = await prisma.product.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { updatedAt: 'desc' },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
  })

  res.json(products.map(productToAdminResponse))
})

const productInputSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  category: z.enum(['graduaciones', 'marketing']),
  price: z.number().int().positive(),
  images: z.array(z.string().trim().min(1)).min(1),
  tags: z.array(z.string().trim().min(1)).min(1),
  specs: z.array(z.string().trim().min(1)).min(1),
  personalization: z.string().trim().min(1),
  minOrder: z.string().trim().min(1),
  leadTime: z.string().trim().min(1),
  availability: z.enum(['Disponible', 'A pedido']),
  badge: z.string().trim().min(1).optional().nullable(),
  sampleEligible: z.boolean(),
  stockNote: z.string().trim().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
})

adminRouter.post('/products', async (req, res) => {
  const parsed = productInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const availability = availabilityLabelToEnum(parsed.data.availability)
  if (!availability) {
    return res.status(400).json({ error: 'validation_error', message: 'Disponibilidad inválida.' })
  }

  const created = await prisma.product.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      price: parsed.data.price,
      images: JSON.stringify(parsed.data.images),
      tags: JSON.stringify(parsed.data.tags),
      specs: JSON.stringify(parsed.data.specs),
      personalization: parsed.data.personalization,
      minOrder: parsed.data.minOrder,
      leadTime: parsed.data.leadTime,
      availability,
      badge: parsed.data.badge ?? null,
      sampleEligible: parsed.data.sampleEligible,
      stockNote: parsed.data.stockNote ?? null,
      isActive: parsed.data.isActive ?? true,
    },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
  })

  res.status(201).json(productToAdminResponse(created))
})

adminRouter.put('/products/:id', async (req, res) => {
  const parsed = productInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const availability = availabilityLabelToEnum(parsed.data.availability)
  if (!availability) {
    return res.status(400).json({ error: 'validation_error', message: 'Disponibilidad inválida.' })
  }

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      price: parsed.data.price,
      images: JSON.stringify(parsed.data.images),
      tags: JSON.stringify(parsed.data.tags),
      specs: JSON.stringify(parsed.data.specs),
      personalization: parsed.data.personalization,
      minOrder: parsed.data.minOrder,
      leadTime: parsed.data.leadTime,
      availability,
      badge: parsed.data.badge ?? null,
      sampleEligible: parsed.data.sampleEligible,
      stockNote: parsed.data.stockNote ?? null,
      isActive: parsed.data.isActive ?? true,
    },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
  })

  res.json(productToAdminResponse(updated))
})

adminRouter.delete('/products/:id', async (req, res) => {
  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
  })

  res.json(productToAdminResponse(updated))
})

// Product options CRUD
const productOptionSchema = z.object({
  type: z.enum(['COLOR', 'TEXT', 'FILE']),
  label: z.string().trim().min(1),
  required: z.boolean().default(false),
  choices: z
    .array(z.object({ label: z.string().trim().min(1), value: z.string().trim().min(1) }))
    .default([]),
  sortOrder: z.number().int().default(0),
})

adminRouter.get('/products/:id/options', async (req, res) => {
  const options = await prisma.productOption.findMany({
    where: { productId: req.params.id },
    orderBy: { sortOrder: 'asc' },
  })

  res.json(
    options.map((opt) => ({
      id: opt.id,
      type: opt.type,
      label: opt.label,
      required: opt.required,
      choices: (() => {
        try {
          return JSON.parse(opt.choices)
        } catch {
          return []
        }
      })(),
      sortOrder: opt.sortOrder,
    }))
  )
})

adminRouter.post('/products/:id/options', async (req, res) => {
  const parsed = productOptionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) {
    return res.status(404).json({ error: 'not_found' })
  }

  const created = await prisma.productOption.create({
    data: {
      productId: req.params.id,
      type: parsed.data.type,
      label: parsed.data.label,
      required: parsed.data.required,
      choices: JSON.stringify(parsed.data.choices),
      sortOrder: parsed.data.sortOrder,
    },
  })

  res.status(201).json({
    id: created.id,
    type: created.type,
    label: created.label,
    required: created.required,
    choices: parsed.data.choices,
    sortOrder: created.sortOrder,
  })
})

adminRouter.put('/products/:id/options/:optId', async (req, res) => {
  const optId = Number(req.params.optId)
  if (!Number.isFinite(optId) || optId <= 0) {
    return res.status(400).json({ error: 'validation_error', message: 'ID inválido.' })
  }

  const parsed = productOptionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const option = await prisma.productOption.findUnique({
    where: { id: optId },
  })
  if (!option || option.productId !== req.params.id) {
    return res.status(404).json({ error: 'not_found' })
  }

  const updated = await prisma.productOption.update({
    where: { id: optId },
    data: {
      type: parsed.data.type,
      label: parsed.data.label,
      required: parsed.data.required,
      choices: JSON.stringify(parsed.data.choices),
      sortOrder: parsed.data.sortOrder,
    },
  })

  res.json({
    id: updated.id,
    type: updated.type,
    label: updated.label,
    required: updated.required,
    choices: parsed.data.choices,
    sortOrder: updated.sortOrder,
  })
})

adminRouter.delete('/products/:id/options/:optId', async (req, res) => {
  const optId = Number(req.params.optId)
  if (!Number.isFinite(optId) || optId <= 0) {
    return res.status(400).json({ error: 'validation_error', message: 'ID inválido.' })
  }

  const option = await prisma.productOption.findUnique({ where: { id: optId } })
  if (!option || option.productId !== req.params.id) {
    return res.status(404).json({ error: 'not_found' })
  }

  await prisma.productOption.delete({ where: { id: optId } })
  res.json({ ok: true })
})

adminRouter.get('/quotes', async (req, res) => {
  const status =
    req.query.status === 'NEW' ||
    req.query.status === 'IN_REVIEW' ||
    req.query.status === 'QUOTED' ||
    req.query.status === 'ACCEPTED' ||
    req.query.status === 'REJECTED'
      ? req.query.status
      : undefined

  const quotes = await prisma.quote.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true } },
    },
  })

  res.json(
    quotes.map((quote) => ({
      id: quote.id,
      folio: formatQuoteFolio(quote.id),
      status: quote.status,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      subtotal: quote.subtotal,
      externallyQuotedAt: quote.externallyQuotedAt,
      itemsCount: quote._count.items,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    }))
  )
})

adminRouter.get('/quotes/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'validation_error', message: 'ID inválido.' })
  }

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
        orderBy: { id: 'asc' },
      },
      notes: {
        include: {
          adminUser: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      revisions: {
        include: { adminUser: { select: { email: true } } },
        orderBy: { rev: 'desc' },
      },
    },
  })

  if (!quote) {
    return res.status(404).json({ error: 'not_found' })
  }

  const folio = formatQuoteFolio(quote.id)

  res.json({
    id: quote.id,
    folio,
    status: quote.status,
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone,
    customerMessage: quote.customerMessage,
    adminMessage: quote.adminMessage,
    quotedAt: quote.quotedAt,
    externallyQuotedAt: quote.externallyQuotedAt,
    subtotal: quote.subtotal,
    referenceSubtotal: quote.referenceSubtotal,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    // Link con token para compartir con el cliente; sólo existe tras la primera emisión
    customerPortalUrl: quote.publicToken && quote.revisions.length > 0 ? portalUrl(folio, quote.publicToken) : null,
    revisions: quote.revisions.map((revision) => ({
      rev: revision.rev,
      fileName: revision.filePath,
      sha256: revision.sha256,
      netAmount: revision.netAmount,
      ivaAmount: revision.ivaAmount,
      totalAmount: revision.totalAmount,
      validUntil: revision.validUntil,
      issuedAt: revision.issuedAt,
      sentAt: revision.sentAt,
      issuedBy: revision.adminUser.email,
    })),
    items: quote.items.map((item) => {
      let configuration: unknown[] = []
      try {
        const parsed = JSON.parse(item.configuration)
        if (Array.isArray(parsed)) configuration = parsed
      } catch {
        // ignore
      }
      return {
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        quotedUnitPrice: item.quotedUnitPrice,
        productId: item.productId,
        productName: item.product.name,
        productCategory: item.product.category,
        productLeadTime: item.product.leadTime,
        productMinOrder: item.product.minOrder,
        productAvailability: formatAvailabilityLabel(item.product.availability),
        productBadge: item.product.badge,
        productSnapshot: item.productSnapshot,
        configuration,
      }
    }),
    notes: quote.notes.map((note) => ({
      id: note.id,
      body: note.body,
      isPublic: note.isPublic,
      createdAt: note.createdAt,
      authorEmail: note.adminUser.email,
    })),
  })
})

adminRouter.patch('/quotes/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'validation_error', message: 'ID inválido.' })
  }

  const parsed = z
    .object({
      status: z.enum(['NEW', 'IN_REVIEW', 'QUOTED', 'ACCEPTED', 'REJECTED']),
    })
    .safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  // «Cotizada» a mano sin emisión enviada desde el sistema (p. ej. por WhatsApp): se permite,
  // pero queda marcada y con una nota interna para que el admin lo distinga.
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.quote.findUniqueOrThrow({
      where: { id },
      select: { status: true, externallyQuotedAt: true, _count: { select: { revisions: { where: { sentAt: { not: null } } } } } },
    })
    const markExternal =
      parsed.data.status === 'QUOTED' &&
      current.status !== 'QUOTED' &&
      current._count.revisions === 0 &&
      !current.externallyQuotedAt
    if (markExternal) {
      await tx.quoteNote.create({
        data: {
          quoteId: id,
          adminUserId: req.adminUserId!,
          body: 'Marcada como «Cotizada» a mano: la cotización se envió por fuera del sistema (sin PDF emitido aquí).',
        },
      })
    }
    return tx.quote.update({
      where: { id },
      data: { status: parsed.data.status, ...(markExternal && { externallyQuotedAt: new Date() }) },
    })
  })

  res.json({
    id: updated.id,
    folio: formatQuoteFolio(updated.id),
    status: updated.status,
    externallyQuotedAt: updated.externallyQuotedAt,
    updatedAt: updated.updatedAt,
  })
})

adminRouter.post('/quotes/:id/notes', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'validation_error', message: 'ID inválido.' })
  }

  const parsed = z
    .object({
      body: z.string().trim().min(1),
      // Las notas públicas se muestran al cliente en el portal
      isPublic: z.boolean().default(false),
    })
    .safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const created = await prisma.quoteNote.create({
    data: {
      quoteId: id,
      adminUserId: req.adminUserId!,
      body: parsed.data.body,
      isPublic: parsed.data.isPublic,
    },
    include: {
      adminUser: { select: { email: true } },
    },
  })

  res.status(201).json({
    id: created.id,
    body: created.body,
    isPublic: created.isPublic,
    createdAt: created.createdAt,
    authorEmail: created.adminUser.email,
  })
})

// Mensajes del formulario de contacto (PR #8)
adminRouter.get('/messages', async (req, res) => {
  const pendingOnly = req.query.pending === 'true'

  const messages = await prisma.contactMessage.findMany({
    where: pendingOnly ? { handled: false } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  res.json(messages)
})

adminRouter.patch('/messages/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'validation_error', message: 'ID inválido.' })
  }

  const parsed = z.object({ handled: z.boolean() }).safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { handled: parsed.data.handled },
  })

  res.json(updated)
})

const parseQuoteId = (raw: string) => {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

const ISSUABLE_STATUSES = new Set<QuoteStatus>(['NEW', 'IN_REVIEW', 'QUOTED'])

// Precios en la query de la vista previa: `prices=12:15000,13:2000` (itemId:precioNeto)
const parsePriceOverrides = (raw: unknown): Map<number, number> | null => {
  const map = new Map<number, number>()
  if (raw === undefined || raw === '') return map
  if (typeof raw !== 'string') return null
  for (const pair of raw.split(',')) {
    const match = pair.trim().match(/^(\d+):(\d+)$/)
    if (!match) return null
    const [itemId, price] = [Number(match[1]), Number(match[2])]
    if (itemId <= 0 || price <= 0 || !Number.isSafeInteger(price)) return null
    map.set(itemId, price)
  }
  return map
}

const findQuoteForIssue = (id: number) =>
  prisma.quote.findUnique({
    where: { id },
    include: {
      ...quoteDocumentInclude,
      revisions: { select: { rev: true }, orderBy: { rev: 'desc' }, take: 1 },
    },
  })

// Vista previa: renderiza lo que el admin tiene en pantalla, sin guardar ni enviar nada.
adminRouter.get('/quotes/:id/pdf-preview', async (req, res) => {
  const id = parseQuoteId(req.params.id)
  if (!id) return res.status(400).json({ error: 'validation_error', message: 'ID inválido.' })

  const priceOverrides = parsePriceOverrides(req.query.prices)
  if (!priceOverrides) {
    return res.status(400).json({ error: 'validation_error', message: 'Precios inválidos.' })
  }
  const message = typeof req.query.message === 'string' ? req.query.message.trim() || null : undefined

  const quote = await findQuoteForIssue(id)
  if (!quote) return res.status(404).json({ error: 'not_found' })

  const itemIds = new Set(quote.items.map((item) => item.id))
  if ([...priceOverrides.keys()].some((itemId) => !itemIds.has(itemId))) {
    return res.status(400).json({ error: 'validation_error', message: 'Hay ítems que no pertenecen a esta cotización.' })
  }

  const folio = formatQuoteFolio(quote.id)
  const nextRev = await nextFreeRev(folio, quote.revisions[0] ? quote.revisions[0].rev + 1 : 0)
  const document = buildQuoteDocument(quote, {
    rev: nextRev,
    // Fecha que tendría si se envía ahora; la emitida usa quotedAt
    quotedAt: new Date(),
    priceOverrides,
    adminMessage: message,
  })
  const pdf = await renderQuotePdf(document, {
    siteUrl: env.PUBLIC_SITE_URL,
    portalUrl: portalUrl(document.folio),
    preview: true,
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${document.folio}-vista-previa.pdf"`)
  res.setHeader('Cache-Control', 'no-store')
  res.send(pdf)
})

// Emite una revisión: genera el PDF, lo guarda sin sobrescribir, lo envía y sólo si el
// correo salió registra la revisión y marca la cotización como QUOTED (en una transacción).
adminRouter.post('/quotes/:id/send-quote', async (req, res) => {
  const id = parseQuoteId(req.params.id)
  if (!id) return res.status(400).json({ error: 'validation_error', message: 'ID inválido.' })

  const parsed = z
    .object({
      adminMessage: z.string().trim().max(4000).optional().nullable(),
      items: z.array(
        z.object({
          itemId: z.number().int().positive(),
          quotedUnitPrice: z.number().int().positive(),
        })
      ),
    })
    .safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const quote = await findQuoteForIssue(id)
  if (!quote) return res.status(404).json({ error: 'not_found' })

  if (!ISSUABLE_STATUSES.has(quote.status)) {
    return res.status(409).json({
      error: 'invalid_status',
      message: 'Sólo se emiten cotizaciones nuevas, en revisión o ya cotizadas (re-emisión).',
    })
  }

  const itemIds = new Set(quote.items.map((item) => item.id))
  if (parsed.data.items.some((item) => !itemIds.has(item.itemId))) {
    return res.status(400).json({ error: 'validation_error', message: 'Hay ítems que no pertenecen a esta cotización.' })
  }

  const priceOverrides = new Map(parsed.data.items.map((item) => [item.itemId, item.quotedUnitPrice]))
  const adminMessage = parsed.data.adminMessage?.trim() || null
  // Salta números cuyo archivo ya existe (un envío que no se pudo registrar deja su PDF)
  const folio = formatQuoteFolio(quote.id)
  const rev = await nextFreeRev(folio, quote.revisions[0] ? quote.revisions[0].rev + 1 : 0)
  const issuedAt = new Date()
  const document = buildQuoteDocument(quote, { rev, quotedAt: issuedAt, priceOverrides, adminMessage })

  // El token se persiste antes de enviar para que el link del correo siempre funcione.
  // Cotizaciones anteriores a la migración no tienen token: se asigna sólo si sigue vacío
  // y se relee, para que dos envíos simultáneos usen el mismo.
  let publicToken = quote.publicToken
  if (!publicToken) {
    await prisma.quote.updateMany({ where: { id, publicToken: null }, data: { publicToken: generatePublicToken() } })
    publicToken = (await prisma.quote.findUniqueOrThrow({ where: { id }, select: { publicToken: true } })).publicToken!
  }

  const pdfBuffer = await renderQuotePdf(document, {
    siteUrl: env.PUBLIC_SITE_URL,
    portalUrl: portalUrl(document.folio),
  })
  const fileName = revisionFileName(document.folio, rev)

  try {
    await writeRevisionPdf(fileName, pdfBuffer)
  } catch (error) {
    if (error instanceof RevisionFileExistsError) {
      return res.status(409).json({
        error: 'revision_conflict',
        message: `Ya existe ${fileName}. Recarga la cotización antes de volver a emitir.`,
      })
    }
    throw error
  }

  try {
    await sendFormalQuoteToCustomer({
      folio: document.folio,
      rev,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      adminMessage,
      ...document.totals,
      validUntil: document.validUntil,
      publicToken,
      pdfBuffer,
      pdfFileName: fileName,
    })
  } catch (error) {
    // No se envió: el PDF no cuenta como emitido y la cotización no cambia de estado.
    await removeRevisionPdf(fileName)
    if (error instanceof MailNotConfiguredError) {
      return res.status(503).json({
        error: 'mail_not_configured',
        message: 'El correo no está configurado. La cotización NO se envió y no cambió de estado.',
      })
    }
    console.error(`[quotes] falló el envío de ${fileName}`, error)
    return res.status(502).json({
      error: 'mail_send_failed',
      message: 'No se pudo enviar el correo. La cotización NO se envió y no cambió de estado.',
    })
  }

  const sentAt = new Date()
  try {
    const updated = await prisma.$transaction(async (tx) => {
      for (const line of document.lines) {
        await tx.quoteItem.update({ where: { id: line.itemId }, data: { quotedUnitPrice: line.unitPrice } })
      }
      await tx.quoteRevision.create({
        data: {
          quoteId: id,
          rev,
          filePath: fileName,
          sha256: sha256Hex(pdfBuffer),
          netAmount: document.totals.netAmount,
          ivaAmount: document.totals.ivaAmount,
          totalAmount: document.totals.totalAmount,
          validUntil: document.validUntil,
          issuedAt,
          sentAt,
          adminUserId: req.adminUserId!,
        },
      })
      // El cliente pudo aceptar o rechazar mientras salía el correo: no se pisa su respuesta.
      const moved = await tx.quote.updateMany({
        where: { id, status: { in: [...ISSUABLE_STATUSES] } },
        data: { status: 'QUOTED' },
      })
      const row = await tx.quote.update({
        where: { id },
        data: { adminMessage, quotedAt: issuedAt, subtotal: document.totals.netAmount },
      })
      return { ...row, statusKept: moved.count === 0 }
    })

    res.json({
      id: updated.id,
      folio: document.folio,
      status: updated.status,
      quotedAt: updated.quotedAt,
      ...(updated.statusKept && {
        warning: `El cliente respondió mientras se enviaba: el estado sigue en ${updated.status}.`,
      }),
      rev,
      fileName,
      quotedSubtotal: document.totals.netAmount,
      ...document.totals,
      validUntil: document.validUntil,
      sentAt,
    })
  } catch (error) {
    // El correo ya salió: se conserva el PDF en disco para auditoría y se avisa al admin.
    console.error(`[quotes] ${fileName} se envió pero no se pudo registrar`, error)
    res.status(500).json({
      error: 'record_failed',
      message: `El correo con ${fileName} se envió, pero no se pudo registrar la emisión. El archivo se conserva; si vuelves a emitir, saldrá como la revisión siguiente.`,
    })
  }
})

adminRouter.get('/quotes/:id/revisions/:rev/pdf', async (req, res) => {
  const id = parseQuoteId(req.params.id)
  const rev = Number(req.params.rev)
  if (!id || !Number.isInteger(rev) || rev < 0) {
    return res.status(400).json({ error: 'validation_error', message: 'Parámetros inválidos.' })
  }

  const revision = await prisma.quoteRevision.findUnique({ where: { quoteId_rev: { quoteId: id, rev } } })
  const fullPath = revision ? resolveRevisionPath(revision.filePath) : null
  if (!revision || !fullPath) return res.status(404).json({ error: 'not_found' })

  res.setHeader('Cache-Control', 'no-store')
  res.download(fullPath, revision.filePath, (error) => {
    if (error && !res.headersSent) res.status(404).json({ error: 'not_found' })
  })
})
