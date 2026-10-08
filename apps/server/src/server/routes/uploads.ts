import { Router } from 'express'
import type { RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { requireAdminAuth } from '../middleware/admin-auth.js'

export const uploadsRouter = Router()

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024

// La extensión se decide por el tipo detectado, nunca por el nombre que manda el cliente:
// así no se puede subir un .html o .js que después se sirva desde nuestro dominio.
const FILE_TYPES: Array<{ ext: string; matches: (buf: Buffer) => boolean }> = [
  { ext: '.jpg', matches: (buf) => buf.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) },
  {
    ext: '.png',
    matches: (buf) =>
      buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: '.gif',
    matches: (buf) => ['GIF87a', 'GIF89a'].includes(buf.subarray(0, 6).toString('latin1')),
  },
  {
    ext: '.webp',
    matches: (buf) =>
      buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
      buf.subarray(8, 12).toString('latin1') === 'WEBP',
  },
  { ext: '.pdf', matches: (buf) => buf.subarray(0, 5).toString('latin1') === '%PDF-' },
]

const detectExtension = (buf: Buffer) => FILE_TYPES.find((type) => type.matches(buf))?.ext ?? null

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

const storeFile: RequestHandler = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'no_file', message: 'No se recibió ningún archivo.' })
  }

  const ext = detectExtension(req.file.buffer)
  if (!ext) {
    return res.status(400).json({
      error: 'invalid_file',
      message: 'Solo se aceptan imágenes JPG, PNG, WEBP, GIF o archivos PDF.',
    })
  }

  const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOADS_DIR, filename), req.file.buffer)

  res.json({ url: `/uploads/${filename}`, originalName: req.file.originalname })
}

uploadsRouter.post('/logo', requireAdminAuth, receiveFile, storeFile)

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
