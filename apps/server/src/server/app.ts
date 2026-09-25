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

  // Serve uploaded files (logos, etc.). Solo tipos permitidos: si alguna vez llegó otro
  // archivo al disco, no se sirve como HTML/JS desde nuestro dominio.
  const uploadsDir = path.resolve(process.cwd(), 'uploads')
  const allowedUploadExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'])
  app.use(
    '/uploads',
    (req, res, next) => {
      if (!allowedUploadExtensions.has(path.extname(req.path).toLowerCase())) {
        return res.status(404).end()
      }
      next()
    },
    express.static(uploadsDir, { dotfiles: 'deny', index: false })
  )

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), '../web/dist')
    app.use(express.static(distDir))
    app.get('/{*splat}', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }

  app.use(errorHandler)

  return app
}
