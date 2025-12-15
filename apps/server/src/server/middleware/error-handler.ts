import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'

export const errorHandler = (error: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error('[server] unhandled error', error)

  if (res.headersSent) return next(error)

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return res.status(404).json({ error: 'not_found' })
  }

  res.status(500).json({
    error: 'internal_error',
    message: 'Ocurrió un error inesperado.',
  })
}
