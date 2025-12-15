import { Router } from 'express'
import { prisma } from '../../lib/prisma.js'
import { productToPublicResponse } from '../lib/product.js'

export const productsRouter = Router()

productsRouter.get('/', async (req, res) => {
  const rawCategory = req.query.category
  const category =
    rawCategory === 'graduaciones' || rawCategory === 'marketing' ? rawCategory : undefined

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : null),
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(products.map(productToPublicResponse))
})

