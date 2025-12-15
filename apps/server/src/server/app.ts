import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import rateLimit from 'express-rate-limit'
import { apiRouter } from './routes/api.js'
import { errorHandler } from './middleware/error-handler.js'

export const createApp = () => {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.use((req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
      const duration = Date.now() - start
      console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`)
    })
    next()
  })

  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  )
  app.use('/api', apiRouter)

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), '../web/dist')
    app.use(express.static(distDir))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }

  app.use(errorHandler)

  return app
}
