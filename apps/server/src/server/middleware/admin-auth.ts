import jwt from 'jsonwebtoken'
import type { RequestHandler, Response } from 'express'
import { env } from '../../lib/env.js'

const COOKIE_NAME = 'admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

export const createAdminSessionToken = (adminUserId: number) => {
  return jwt.sign({ sub: String(adminUserId) }, env.JWT_SECRET, { expiresIn: SESSION_TTL_SECONDS })
}

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: SESSION_TTL_SECONDS * 1000,
  path: '/',
})

export const setAdminSessionCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, getCookieOptions())
}

export const clearAdminSessionCookie = (res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

export const requireAdminAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload
    const adminUserId = Number(payload.sub)
    if (!Number.isFinite(adminUserId) || adminUserId <= 0) {
      return res.status(401).json({ error: 'unauthorized' })
    }

    req.adminUserId = adminUserId
    next()
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }
}

