import crypto from 'node:crypto'

// 32 bytes aleatorios: el token, no el folio correlativo, es lo que autoriza la descarga.
export const generatePublicToken = () => crypto.randomBytes(32).toString('base64url')

export const tokensMatch = (expected: string | null | undefined, provided: unknown) => {
  if (!expected || typeof provided !== 'string' || provided.length === 0) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(provided)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
