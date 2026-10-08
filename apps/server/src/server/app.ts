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
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          // Imágenes sólo de nuestro dominio (productos subidos, catálogo, marca). `data:` lo usa el
          // placeholder SVG de la vista previa de productos del admin. Nada de URLs externas.
          'img-src': ["'self'", 'data:'],
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
      // El token del portal (?t=) autoriza descargar el PDF: no se escribe en los logs
      const url = req.originalUrl.replace(/([?&]t=)[^&]*/g, '$1***')
      console.log(`[${req.method}] ${url} -> ${res.statusCode} (${duration}ms)`)
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
    // Express 5 (path-to-regexp v8) no acepta '*' sin nombre
    app.get('/{*splat}', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }

  app.use(errorHandler)

  return app
}
