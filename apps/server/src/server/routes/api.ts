import { Router } from 'express'
import { productsRouter } from './products.js'
import { quotesRouter } from './quotes.js'
import { adminRouter } from './admin.js'

export const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true })
})

apiRouter.use('/products', productsRouter)
apiRouter.use('/quotes', quotesRouter)
apiRouter.use('/admin', adminRouter)
