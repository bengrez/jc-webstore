import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import nodemailer from 'nodemailer'
import type { SendMailOptions } from 'nodemailer'
import { env } from '../../lib/env.js'
import { formatClp } from './currency.js'
import { formatQuoteFolio } from './quote-folio.js'
import { portalUrl } from './site.js'

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

type Mailer = { sendMail: (mail: SendMailOptions) => Promise<unknown> }

// `outbox` (sólo dev/test, ver env.ts) guarda cada correo como JSON en MAIL_OUTBOX_DIR,
// con adjuntos en base64, para probar el flujo sin un SMTP real.
const createOutboxMailer = (): Mailer => {
  const transporter = nodemailer.createTransport({ jsonTransport: true })
  return {
    sendMail: async (mail) => {
      const info = (await transporter.sendMail(mail)) as { message: string }
      const dir = path.resolve(process.cwd(), env.MAIL_OUTBOX_DIR)
      await fs.mkdir(dir, { recursive: true })
      const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.json`
      await fs.writeFile(path.join(dir, name), info.message)
      return info
    },
  }
}

const getTransport = (): Mailer | null => {
  if (env.MAIL_TRANSPORT === 'outbox') return createOutboxMailer()
  if (!env.SMTP_USER || !env.SMTP_PASS) return null
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    // Sin timeouts un Gmail caído deja la petición colgada ~2 min
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
}

const senderAddress = () => env.SMTP_FROM ?? env.SMTP_USER ?? 'Confecciones Juany Reyes <no-reply@localhost>'
const adminInbox = () => env.QUOTES_TO_EMAIL ?? env.SMTP_USER

export class MailNotConfiguredError extends Error {
  constructor() {
    super('El correo no está configurado (SMTP_USER/SMTP_PASS).')
  }
}

export const sendQuoteNotificationEmail = async (input: QuoteEmailInput) => {
  const transporter = getTransport()
  if (!transporter) {
    console.warn('[mail] SMTP_USER/SMTP_PASS no configurados; se omite envío de correo.')
    return false
  }

  const to = adminInbox()
  const from = senderAddress()
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

  const from = senderAddress()
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
    portalUrl(folio),
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

// Lanza MailNotConfiguredError si no hay transporte y propaga el error del SMTP:
// quien llama decide qué hacer, nunca se da por enviado en silencio.
export const sendFormalQuoteToCustomer = async (input: {
  folio: string
  rev: number
  customerName: string
  customerEmail: string
  adminMessage?: string | null
  netAmount: number
  ivaAmount: number
  totalAmount: number
  validUntil: Date
  publicToken: string
  pdfBuffer: Buffer
  pdfFileName: string
}) => {
  const transporter = getTransport()
  if (!transporter) throw new MailNotConfiguredError()

  const link = portalUrl(input.folio, input.publicToken)
  const validUntil = input.validUntil.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Santiago',
  })
  const firstName = input.customerName.trim().split(/\s+/)[0] || input.customerName

  const lines = [
    `Hola ${firstName},`,
    '',
    input.rev > 0
      ? `Te enviamos la revisión ${input.rev} de tu cotización ${input.folio}. Reemplaza a la versión anterior.`
      : `Te enviamos tu cotización oficial (${input.folio}).`,
    '',
    ...(input.adminMessage ? [input.adminMessage, ''] : []),
    `Subtotal neto: ${formatClp(input.netAmount)}`,
    `IVA (19 %): ${formatClp(input.ivaAmount)}`,
    `Total: ${formatClp(input.totalAmount)}`,
    `Válida hasta el ${validUntil}.`,
    '',
    'Adjuntamos el PDF. También puedes descargarlo y aceptar o rechazar la cotización en:',
    link,
    '',
    'Gracias por confiar en Confecciones Juany Reyes.',
    '— Equipo Confecciones Juany Reyes',
  ]

  await transporter.sendMail({
    to: input.customerEmail,
    from: senderAddress(),
    subject:
      input.rev > 0
        ? `Tu cotización ${input.folio} (revisión ${input.rev}) está lista`
        : `Tu cotización ${input.folio} está lista`,
    text: lines.join('\n'),
    attachments: [
      {
        filename: input.pdfFileName,
        content: input.pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })
}

export const sendCustomerResponseNotification = async (input: {
  quoteId: number
  customerName: string
  action: 'ACCEPTED' | 'REJECTED'
}) => {
  const transporter = getTransport()
  if (!transporter) return false

  const to = adminInbox()
  const from = senderAddress()
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

  const to = adminInbox()
  const from = senderAddress()

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
