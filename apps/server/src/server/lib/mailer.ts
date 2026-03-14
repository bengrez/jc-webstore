import nodemailer from 'nodemailer'
import { env } from '../../lib/env.js'
import { formatClp } from './currency.js'
import { formatQuoteFolio } from './quote-folio.js'

type ConfigEntry = { label: string; type: string; value: string }

type QuoteEmailInput = {
  quoteId: number
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  customerMessage?: string | null
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    category: string
    leadTime: string
    minOrder: string
    availability: string
    configuration?: ConfigEntry[]
  }>
  subtotal: number
}

const getTransport = () => {
  if (!env.SMTP_USER || !env.SMTP_PASS) return null
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })
}

export const sendQuoteNotificationEmail = async (input: QuoteEmailInput) => {
  const transporter = getTransport()
  if (!transporter) {
    console.warn('[mail] SMTP_USER/SMTP_PASS no configurados; se omite envío de correo.')
    return false
  }

  const to = env.QUOTES_TO_EMAIL ?? env.SMTP_USER
  const from = env.SMTP_FROM ?? env.SMTP_USER
  const folio = formatQuoteFolio(input.quoteId)

  const lines = [
    `Nueva solicitud de cotización (${folio})`,
    '',
    'Cliente',
    `- Nombre: ${input.customerName}`,
    `- Email: ${input.customerEmail}`,
    input.customerPhone ? `- Teléfono: ${input.customerPhone}` : undefined,
    input.customerMessage ? `- Mensaje: ${input.customerMessage}` : undefined,
    '',
    'Items',
    ...input.items.flatMap((item) => {
      const line = `- ${item.quantity} x ${item.name} (${formatClp(item.unitPrice)} + IVA) | ${item.availability} | ${item.leadTime} | ${item.minOrder}`
      const configLines =
        item.configuration && item.configuration.length > 0
          ? item.configuration.map((c) => `    ${c.label}: ${c.value}`)
          : []
      return [line, ...configLines]
    }),
    '',
    `Subtotal referencial: ${formatClp(input.subtotal)} + IVA`,
  ].filter(Boolean)

  await transporter.sendMail({
    to,
    from,
    replyTo: input.customerEmail,
    subject: `Nueva cotización ${folio}`,
    text: lines.join('\n'),
  })

  return true
}
