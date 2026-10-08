import { z } from 'zod'

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional())
const optionalEmail = z.preprocess(emptyToUndefined, z.string().email().optional())

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1).default('file:./dev.db'),
    JWT_SECRET: z.string().min(32),
    SMTP_USER: optionalEmail,
    SMTP_PASS: optionalString,
    SMTP_FROM: optionalString,
    QUOTES_TO_EMAIL: optionalEmail,
    // URL pública del sitio: links del portal en correos y PDF (antes escrita a mano en el código)
    PUBLIC_SITE_URL: z
      .preprocess(emptyToUndefined, z.string().url().default('http://localhost:5173'))
      .transform((value) => value.replace(/\/+$/, '')),
    // Carpeta de PDFs emitidos; relativa al cwd del server, igual que `uploads`
    QUOTES_STORAGE_DIR: z.preprocess(emptyToUndefined, z.string().default('storage/quotes')),
    // `outbox` escribe los correos como JSON en MAIL_OUTBOX_DIR en vez de enviarlos (sólo dev/test)
    MAIL_TRANSPORT: z.enum(['smtp', 'outbox']).default('smtp'),
    MAIL_OUTBOX_DIR: z.preprocess(emptyToUndefined, z.string().default('storage/outbox')),
  })
  .refine((value) => !(value.NODE_ENV === 'production' && value.MAIL_TRANSPORT === 'outbox'), {
    message: 'MAIL_TRANSPORT=outbox no se permite en producción.',
    path: ['MAIL_TRANSPORT'],
  })

export const env = envSchema.parse(process.env)

if (env.NODE_ENV === 'production' && env.PUBLIC_SITE_URL.includes('localhost')) {
  console.warn('[env] PUBLIC_SITE_URL apunta a localhost en producción; los links del portal no funcionarán.')
}
