import { Router } from 'express'
import { productsRouter } from './products.js'
import { quotesRouter } from './quotes.js'
import { adminRouter } from './admin.js'
import { uploadsRouter } from './uploads.js'
import { contactRouter } from './contact.js'

export const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true })
})

apiRouter.use('/products', productsRouter)
apiRouter.use('/quotes', quotesRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/uploads', uploadsRouter)
apiRouter.use('/contact', contactRouter)
