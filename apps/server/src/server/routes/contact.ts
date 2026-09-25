import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { sendContactNotificationEmail } from '../lib/mailer.js'

export const contactRouter = Router()

contactRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'rate_limited',
      message: 'Demasiados mensajes enviados. Intenta nuevamente en unos minutos.',
    },
  })
)

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null)

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: optionalText(40),
  company: optionalText(160),
  message: z.string().trim().min(1).max(5000),
  // Honeypot: campo oculto en el formulario. Un humano lo deja vacío.
  website: z.string().optional(),
})

contactRouter.post('/', async (req, res) => {
  const parsed = contactSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const { website, ...data } = parsed.data
  if (website) {
    // Respondemos como si todo estuviera bien para no darle pistas al bot.
    return res.status(201).json({ ok: true })
  }

  const created = await prisma.contactMessage.create({ data })

  // El mensaje ya quedó guardado (visible en /admin/messages): el correo es solo un aviso,
  // así que no hacemos esperar al cliente por el SMTP.
  void sendContactNotificationEmail({ messageId: created.id, ...data }).catch((error) => {
    console.error('[mail] failed to send contact email', error)
  })

  res.status(201).json({ ok: true })
})
