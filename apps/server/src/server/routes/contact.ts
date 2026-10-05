import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { sendContactNotificationEmail } from '../lib/mailer.js'

export const contactRouter = Router()

contactRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

const contactSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  message: z.string().trim().min(1),
})

contactRouter.post('/', async (req, res) => {
  const parsed = contactSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const contact = await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      message: parsed.data.message,
    },
  })

  const emailSent = await sendContactNotificationEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    company: parsed.data.company,
    message: parsed.data.message,
  }).catch((error) => {
    console.error('[mail] failed to send contact email', error)
    return false
  })

  res.status(201).json({ id: contact.id, emailSent })
})
