import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { sendQuoteNotificationEmail } from '../lib/mailer.js'
import { formatAvailabilityLabel } from '../lib/product.js'
import { formatQuoteFolio } from '../lib/quote-folio.js'

export const quotesRouter = Router()

quotesRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

const createQuoteSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    phone: z.string().trim().optional().nullable(),
    message: z.string().trim().optional().nullable(),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        quantity: z.number().int().positive().max(10_000),
      })
    )
    .min(1),
})

quotesRouter.post('/', async (req, res) => {
  const parsed = createQuoteSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const productIds = Array.from(new Set(parsed.data.items.map((item) => item.productId)))
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  })
  const productMap = new Map(products.map((product) => [product.id, product]))

  const missing = productIds.filter((id) => !productMap.has(id))
  if (missing.length > 0) {
    return res.status(400).json({
      error: 'products_not_found',
      message: 'Algunos productos ya no están disponibles.',
      missing,
    })
  }

  const consolidated = new Map<string, number>()
  for (const item of parsed.data.items) {
    const prev = consolidated.get(item.productId) ?? 0
    consolidated.set(item.productId, prev + item.quantity)
  }

  const quoteItems = Array.from(consolidated.entries()).map(([productId, quantity]) => {
    const product = productMap.get(productId)
    if (!product) {
      throw new Error(`Producto no encontrado: ${productId}`)
    }

    return {
      product,
      productId,
      quantity,
      unitPrice: product.price,
      productSnapshot: JSON.stringify({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        images: product.images,
        tags: product.tags,
        specs: product.specs,
        personalization: product.personalization,
        minOrder: product.minOrder,
        leadTime: product.leadTime,
        availability: product.availability,
        badge: product.badge,
        sampleEligible: product.sampleEligible,
      }),
    }
  })

  const subtotal = quoteItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.quote.create({
      data: {
        customerName: parsed.data.customer.name,
        customerEmail: parsed.data.customer.email,
        customerPhone: parsed.data.customer.phone || null,
        customerMessage: parsed.data.customer.message || null,
        subtotal,
        status: 'NEW',
        items: {
          create: quoteItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            productSnapshot: item.productSnapshot,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return created
  })

  const emailSent = await sendQuoteNotificationEmail({
    quoteId: quote.id,
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone,
    customerMessage: quote.customerMessage,
    items: quote.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      category: item.product.category,
      leadTime: item.product.leadTime,
      minOrder: item.product.minOrder,
      availability: formatAvailabilityLabel(item.product.availability),
    })),
    subtotal: quote.subtotal,
  }).catch((error) => {
    console.error('[mail] failed to send quote email', error)
    return false
  })

  res.status(201).json({
    id: quote.id,
    folio: formatQuoteFolio(quote.id),
    status: quote.status,
    emailSent,
  })
})
