import { z } from 'zod'

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional())
const optionalEmail = z.preprocess(emptyToUndefined, z.string().email().optional())
const optionalBoolean = z.preprocess(emptyToUndefined, z.enum(['true', 'false']).optional()).transform((value) =>
  value === undefined ? undefined : value === 'true'
)

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    // Interfaz donde escucha; vacío = todas. En staging, 127.0.0.1: sólo se entra por `tailscale serve`
    HOST: optionalString,
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
    // Días corridos de validez de cada cotización formal (desde quotedAt); vacío = 30
    QUOTE_VALIDITY_DAYS: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(365).default(30)),
    // Carpeta de PDFs emitidos; relativa al cwd del server, igual que `uploads`
    QUOTES_STORAGE_DIR: z.preprocess(emptyToUndefined, z.string().default('storage/quotes')),
    // `outbox` escribe los correos como JSON en MAIL_OUTBOX_DIR en vez de enviarlos (sólo dev/test)
    MAIL_TRANSPORT: z.enum(['smtp', 'outbox']).default('smtp'),
    MAIL_OUTBOX_DIR: z.preprocess(emptyToUndefined, z.string().default('storage/outbox')),
    // Archivos subidos (logos de clientes, imágenes de producto); relativa al cwd del server
    UPLOADS_DIR: z.preprocess(emptyToUndefined, z.string().default('uploads')),
    // Servir el build de la web (apps/web/dist) desde este server; por defecto sólo en producción
    SERVE_WEB_DIST: optionalBoolean,
    // Staging: build de producción con correo simulado (outbox). Ver .env.staging.example
    STAGING: optionalBoolean,
    // Detrás de un proxy (p. ej. `tailscale serve`): valor de `trust proxy` de Express, como `loopback`
    TRUST_PROXY: optionalString,
  })
  .refine((value) => !(value.NODE_ENV === 'production' && value.MAIL_TRANSPORT === 'outbox' && !value.STAGING), {
    message: 'MAIL_TRANSPORT=outbox no se permite en producción (sí en staging, con STAGING=true).',
    path: ['MAIL_TRANSPORT'],
  })

export const env = envSchema.parse(process.env)

if (env.NODE_ENV === 'production' && env.PUBLIC_SITE_URL.includes('localhost')) {
  console.warn('[env] PUBLIC_SITE_URL apunta a localhost en producción; los links del portal no funcionarán.')
}
