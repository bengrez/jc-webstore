import { Router } from 'express'
import { productsRouter } from './products.js'
import { quotesRouter } from './quotes.js'
import { adminRouter } from './admin.js'
import { uploadsRouter } from './uploads.js'
import { contactRouter } from './contact.js'
import { quotePortalRouter } from './quote-portal.js'
import { env } from '../../lib/env.js'
import { LEGAL_VERSION } from '../lib/legal.js'
import { IVA_RATE } from '../lib/quote-totals.js'

export const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// Datos que muestran el aviso de privacidad y los términos de la cotización
apiRouter.get('/legal', (_req, res) => {
  res.json({
    version: LEGAL_VERSION,
    quoteValidityDays: env.QUOTE_VALIDITY_DAYS,
    ivaPercent: Math.round(IVA_RATE * 100),
  })
})

apiRouter.use('/products', productsRouter)
apiRouter.use('/quotes', quotesRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/uploads', uploadsRouter)
apiRouter.use('/contact', contactRouter)
apiRouter.use('/portal', quotePortalRouter)
