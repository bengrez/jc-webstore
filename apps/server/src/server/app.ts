import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import fs from 'node:fs'
import path from 'node:path'
import rateLimit from 'express-rate-limit'
import { apiRouter } from './routes/api.js'
import { errorHandler } from './middleware/error-handler.js'

export const createApp = () => {
  const app = express()

  app.disable('x-powered-by')

  // Detrás de un reverse proxy (Nginx, Render, Railway) la IP del cliente llega en
  // X-Forwarded-For. Sin esto los rate limiters agrupan a todos los visitantes bajo
  // la IP del proxy. Solo en producción: en dev el header sería falsificable.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1)
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          // Las imágenes de producto viven en Unsplash; el default de helmet
          // ('self' data:) las bloquea y el catálogo queda sin fotos.
          'img-src': ["'self'", 'data:', 'https://images.unsplash.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
          'connect-src': ["'self'"],
        },
      },
    })
  )
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

  // Serve uploaded files (logos, etc.)
  const uploadsDir = path.resolve(process.cwd(), 'uploads')
  fs.mkdirSync(uploadsDir, { recursive: true })
  app.use('/uploads', express.static(uploadsDir))

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), '../web/dist')
    app.use(express.static(distDir))
    // Express 5 usa path-to-regexp v8: el comodín desnudo '*' lanza
    // "Missing parameter name" al arrancar. Requiere comodín nombrado.
    app.get('/*splat', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }

  app.use(errorHandler)

  return app
}
