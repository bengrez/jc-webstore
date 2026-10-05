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

export const sendQuoteConfirmationToCustomer = async (input: {
  quoteId: number
  customerName: string
  customerEmail: string
  subtotal: number
  itemCount: number
}) => {
  const transporter = getTransport()
  if (!transporter) return false

  const from = env.SMTP_FROM ?? env.SMTP_USER
  const folio = formatQuoteFolio(input.quoteId)

  const text = [
    `Hola ${input.customerName},`,
    '',
    `Recibimos tu solicitud de cotización (${folio}).`,
    `Incluiste ${input.itemCount} producto${input.itemCount !== 1 ? 's' : ''} con un subtotal referencial de ${formatClp(input.subtotal)} + IVA.`,
    '',
    'Nuestro equipo revisará tu pedido y te contactaremos dentro de 24 horas hábiles.',
    '',
    `Puedes consultar el estado de tu cotización en cualquier momento:`,
    `https://confeccionesjuany.cl/cotizacion/${folio}`,
    '',
    'Gracias por confiar en Confecciones Juany Reyes.',
    '— Equipo Confecciones Juany Reyes',
  ].join('\n')

  await transporter.sendMail({
    to: input.customerEmail,
    from,
    subject: `Tu cotización ${folio} fue recibida`,
    text,
  })

  return true
}

export const sendFormalQuoteToCustomer = async (input: {
  quoteId: number
  customerName: string
  customerEmail: string
  adminMessage?: string | null
  quotedSubtotal: number
  pdfBuffer: Buffer
}) => {
  const transporter = getTransport()
  if (!transporter) return false

  const from = env.SMTP_FROM ?? env.SMTP_USER
  const folio = formatQuoteFolio(input.quoteId)
  const portalUrl = `https://confeccionesjuany.cl/cotizacion/${folio}`

  const lines = [
    `Hola ${input.customerName.split(' ')[0]},`,
    '',
    `Te enviamos tu cotización oficial (${folio}).`,
    '',
    ...(input.adminMessage ? [input.adminMessage, ''] : []),
    `Subtotal neto: ${formatClp(input.quotedSubtotal)} + IVA`,
    '',
    'Para aceptar o rechazar esta cotización, ingresa a:',
    portalUrl,
    '',
    'Gracias por confiar en Confecciones Juany Reyes.',
    '— Equipo Confecciones Juany Reyes',
  ]

  await transporter.sendMail({
    to: input.customerEmail,
    from,
    subject: `Tu cotización ${folio} está lista`,
    text: lines.join('\n'),
    attachments: [
      {
        filename: `${folio}.pdf`,
        content: input.pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })

  return true
}

export const sendCustomerResponseNotification = async (input: {
  quoteId: number
  customerName: string
  action: 'ACCEPTED' | 'REJECTED'
}) => {
  const transporter = getTransport()
  if (!transporter) return false

  const to = env.QUOTES_TO_EMAIL ?? env.SMTP_USER
  const from = env.SMTP_FROM ?? env.SMTP_USER
  const folio = formatQuoteFolio(input.quoteId)
  const verb = input.action === 'ACCEPTED' ? 'ACEPTÓ' : 'RECHAZÓ'

  await transporter.sendMail({
    to,
    from,
    subject: `${input.customerName} ${verb} la cotización ${folio}`,
    text: `${input.customerName} ha ${input.action === 'ACCEPTED' ? 'aceptado' : 'rechazado'} la cotización ${folio}.`,
  })

  return true
}

type ContactEmailInput = {
  name: string
  email: string
  phone?: string
  company?: string
  message: string
}

export const sendContactNotificationEmail = async (input: ContactEmailInput) => {
  const transporter = getTransport()
  if (!transporter) {
    console.warn('[mail] SMTP no configurado; se omite correo de contacto.')
    return false
  }

  const to = env.QUOTES_TO_EMAIL ?? env.SMTP_USER
  const from = env.SMTP_FROM ?? env.SMTP_USER

  const lines = [
    'Nuevo mensaje de contacto',
    '',
    `Nombre: ${input.name}`,
    `Email: ${input.email}`,
    input.phone ? `Teléfono: ${input.phone}` : undefined,
    input.company ? `Empresa: ${input.company}` : undefined,
    '',
    'Mensaje:',
    input.message,
  ].filter(Boolean)

  await transporter.sendMail({
    to,
    from,
    replyTo: input.email,
    subject: `Contacto web: ${input.name}`,
    text: lines.join('\n'),
  })

  return true
}
