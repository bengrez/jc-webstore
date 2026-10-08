import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AddressInfo } from 'node:net'
import { createServer, type Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// Sin SMTP real: los avisos por correo de cotizaciones y mensajes van a un mock
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail: vi.fn().mockResolvedValue({}) }) } }))

const { prisma } = await import('../src/lib/prisma.js')
const { createApp } = await import('../src/server/app.js')
const { LEGAL_VERSION } = await import('../src/server/lib/legal.js')

let server: Server
let baseUrl = ''

const post = (pathname: string, body: unknown) =>
  fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const quoteBody = (legal?: unknown) => ({
  customer: { name: 'Legal Prueba', email: 'legal@example.com' },
  items: [{ productId: 'legal-producto', quantity: 2, configuration: [] }],
  ...(legal === undefined ? {} : { legal }),
})

const contactBody = (legal?: unknown, extra: Record<string, unknown> = {}) => ({
  name: 'Legal Prueba',
  email: 'legal-contacto@example.com',
  message: 'Hola',
  ...extra,
  ...(legal === undefined ? {} : { legal }),
})

beforeAll(async () => {
  await prisma.product.create({
    data: {
      id: 'legal-producto',
      name: 'Producto legal',
      description: 'Producto de prueba',
      category: 'marketing',
      price: 1000,
      images: '["/catalog/x.jpg"]',
      personalization: 'Bordado',
      minOrder: 'MOQ 1',
      leadTime: '10 días',
      availability: 'DISPONIBLE',
      sampleEligible: false,
    },
  })
  server = createServer(createApp())
  await new Promise<void>((resolve) => server.listen(0, resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await prisma.$disconnect()
})

describe('aceptación del aviso de privacidad y los términos', () => {
  it('la web y el server usan la misma versión de los documentos', () => {
    const webLegal = fs.readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/src/data/legal.ts'),
      'utf8'
    )
    expect(webLegal.match(/export const LEGAL_VERSION = '([^']+)'/)?.[1]).toBe(LEGAL_VERSION)
  })

  it('GET /api/legal entrega la versión, la validez y el IVA que usa el PDF', async () => {
    const response = await fetch(`${baseUrl}/api/legal`)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ version: LEGAL_VERSION, quoteValidityDays: 30, ivaPercent: 19 })
  })

  it('una cotización sin aceptación, no aceptada o con otra versión se rechaza y no se guarda', async () => {
    const before = await prisma.quote.count()
    for (const [legal, error] of [
      [undefined, 'legal_not_accepted'],
      [{ accepted: false, version: LEGAL_VERSION }, 'legal_not_accepted'],
      [{ accepted: 'true', version: LEGAL_VERSION }, 'legal_not_accepted'],
      [{ accepted: true, version: '2020-01-01' }, 'legal_version_mismatch'],
    ] as const) {
      const response = await post('/api/quotes', quoteBody(legal))
      expect(response.status).toBe(400)
      const body = (await response.json()) as { error: string; message: string }
      expect(body.error).toBe(error)
      expect(body.message).toMatch(/privacidad/)
    }
    expect(await prisma.quote.count()).toBe(before)
  })

  it('una cotización aceptada guarda la fecha y la versión', async () => {
    const start = Date.now()
    const response = await post('/api/quotes', quoteBody({ accepted: true, version: LEGAL_VERSION }))
    expect(response.status).toBe(201)
    const { id } = (await response.json()) as { id: number }
    const quote = await prisma.quote.findUniqueOrThrow({ where: { id } })
    expect(quote.legalVersion).toBe(LEGAL_VERSION)
    expect(quote.legalAcceptedAt!.getTime()).toBeGreaterThanOrEqual(start - 1000)
    expect(quote.legalAcceptedAt!.getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('un mensaje de contacto sin aceptación se rechaza; aceptado guarda fecha y versión', async () => {
    const before = await prisma.contactMessage.count()
    const rejected = await post('/api/contact', contactBody())
    expect(rejected.status).toBe(400)
    expect(((await rejected.json()) as { error: string }).error).toBe('legal_not_accepted')
    const mismatch = await post('/api/contact', contactBody({ accepted: true, version: 'vieja' }))
    expect(((await mismatch.json()) as { error: string }).error).toBe('legal_version_mismatch')
    expect(await prisma.contactMessage.count()).toBe(before)

    const accepted = await post('/api/contact', contactBody({ accepted: true, version: LEGAL_VERSION }))
    expect(accepted.status).toBe(201)
    const stored = await prisma.contactMessage.findFirstOrThrow({
      where: { email: 'legal-contacto@example.com' },
      orderBy: { id: 'desc' },
    })
    expect(stored.legalVersion).toBe(LEGAL_VERSION)
    expect(stored.legalAcceptedAt).toBeInstanceOf(Date)
  })

  it('el honeypot sigue respondiendo 201 sin guardar nada, con o sin aceptación', async () => {
    const before = await prisma.contactMessage.count()
    const response = await post('/api/contact', contactBody(undefined, { website: 'http://spam.test' }))
    expect(response.status).toBe(201)
    expect(await prisma.contactMessage.count()).toBe(before)
  })
})
