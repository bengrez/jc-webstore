import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import crypto from 'node:crypto'
import { requireAdminAuth } from '../middleware/admin-auth.js'

export const uploadsRouter = Router()

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
])

const storage = multer.diskStorage({
  destination: path.resolve(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const name = crypto.randomBytes(16).toString('hex')
    cb(null, `${name}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de archivo no permitido.'))
    }
  },
})

uploadsRouter.post('/logo', requireAdminAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'no_file', message: 'No se recibió ningún archivo.' })
  }
  res.json({ url: `/uploads/${req.file.filename}`, originalName: req.file.originalname })
})

// Customer-facing logo upload (not admin-protected, used from configurator modal)
uploadsRouter.post('/customer-logo', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'no_file', message: 'No se recibió ningún archivo.' })
  }
  res.json({ url: `/uploads/${req.file.filename}`, originalName: req.file.originalname })
})
