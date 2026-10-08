import { Router } from 'express'
import type { RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { requireAdminAuth } from '../middleware/admin-auth.js'
import { detectExtension, IMAGE_EXTENSIONS } from '../lib/file-type.js'

export const uploadsRouter = Router()

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
})

const receiveFile: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'El archivo supera el máximo de 5 MB.'
          : 'No se pudo procesar el archivo.'
      return res.status(400).json({ error: 'invalid_file', message })
    }
    if (error) return next(error)
    next()
  })
}

// `imagesOnly`: las imágenes de producto no admiten PDF (no se pueden mostrar en el catálogo)
const storeFileOf = ({ imagesOnly }: { imagesOnly: boolean }): RequestHandler => async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'no_file', message: 'No se recibió ningún archivo.' })
  }

  const ext = detectExtension(req.file.buffer)
  if (!ext || (imagesOnly && !IMAGE_EXTENSIONS.has(ext))) {
    return res.status(400).json({
      error: 'invalid_file',
      message: imagesOnly
        ? 'Solo se aceptan imágenes JPG, PNG, WEBP o GIF.'
        : 'Solo se aceptan imágenes JPG, PNG, WEBP, GIF o archivos PDF.',
    })
  }

  const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOADS_DIR, filename), req.file.buffer)

  res.json({ url: `/uploads/${filename}`, originalName: req.file.originalname })
}

const storeFile = storeFileOf({ imagesOnly: false })
const storeImage = storeFileOf({ imagesOnly: true })

uploadsRouter.post('/logo', requireAdminAuth, receiveFile, storeFile)
// Imágenes de producto desde el admin: sólo imágenes
uploadsRouter.post('/product-image', requireAdminAuth, receiveFile, storeImage)

// Subida pública desde el configurador: limitada por IP para evitar abuso del disco.
uploadsRouter.post(
  '/customer-logo',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'rate_limited',
      message: 'Demasiados archivos subidos. Intenta nuevamente en unos minutos.',
    },
  }),
  receiveFile,
  storeFile
)
