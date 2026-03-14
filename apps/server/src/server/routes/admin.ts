import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import {
  availabilityLabelToEnum,
  formatAvailabilityLabel,
  productToAdminResponse,
} from '../lib/product.js'
import { formatQuoteFolio } from '../lib/quote-folio.js'
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
    },
  })

  if (!quote) {
    return res.status(404).json({ error: 'not_found' })
  }

  res.json({
    id: quote.id,
    folio: formatQuoteFolio(quote.id),
    status: quote.status,
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone,
    customerMessage: quote.customerMessage,
    subtotal: quote.subtotal,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
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

  const updated = await prisma.quote.update({
    where: { id },
    data: { status: parsed.data.status },
  })

  res.json({
    id: updated.id,
    folio: formatQuoteFolio(updated.id),
    status: updated.status,
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
    },
    include: {
      adminUser: { select: { email: true } },
    },
  })

  res.status(201).json({
    id: created.id,
    body: created.body,
    createdAt: created.createdAt,
    authorEmail: created.adminUser.email,
  })
})

