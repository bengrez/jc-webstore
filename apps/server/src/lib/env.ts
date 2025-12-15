import { z } from 'zod'

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional())
const optionalEmail = z.preprocess(emptyToUndefined, z.string().email().optional())

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
  JWT_SECRET: z.string().min(32),
  SMTP_USER: optionalEmail,
  SMTP_PASS: optionalString,
  SMTP_FROM: optionalString,
  QUOTES_TO_EMAIL: optionalEmail,
})

export const env = envSchema.parse(process.env)
