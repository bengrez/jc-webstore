import fs from 'node:fs'
import path from 'node:path'
import type { AddressInfo } from 'node:net'
import { createServer, type Server } from 'node:http'
import bcrypt from 'bcryptjs'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }))
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail }) } }))

const { env } = await import('../src/lib/env.js')
const { prisma } = await import('../src/lib/prisma.js')
const { createApp } = await import('../src/server/app.js')
const { getQuotesStorageDir, sha256Hex } = await import('../src/server/lib/quote-storage.js')
const { computeValidUntil } = await import('../src/server/lib/quote-totals.js')
const { extractPdfText } = await import('./pdf-text.js')

const ADMIN = { email: 'admin@example.com', password: 'clave-de-prueba-123' }
let server: Server
let baseUrl = ''
let cookie = ''

const api = (pathname: string, init: RequestInit & { json?: unknown; admin?: boolean } = {}) => {
  const headers = new Headers(init.headers)
  if (init.json !== undefined) headers.set('Content-Type', 'application/json')
  if (init.admin) headers.set('Cookie', cookie)
  return fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  })
}

const createQuote = async () => {
  const response = await api('/api/quotes', {
    method: 'POST',
    json: {
      customer: { name: 'Ana Prueba', email: 'ana@example.com', phone: '+56 9 1111 1111' },
      items: [
        {
          productId: 'test-estola',
          quantity: 30,
          configuration: [
            { optionId: colorOptionId, label: 'Color', type: 'COLOR', value: '#1F4FA0' },
            { optionId: 0, label: 'Texto', type: 'TEXT', value: 'Generación 2026' },
            { optionId: 0, label: 'Logo', type: 'FILE', value: '/uploads/logo-cliente.png' },
          ],
        },
        { productId: 'test-polera', quantity: 10, configuration: [] },
      ],
    },
  })
  expect(response.status).toBe(201)
  const body = (await response.json()) as { id: number; folio: string; token: string }
  const items = await prisma.quoteItem.findMany({ where: { quoteId: body.id }, orderBy: { id: 'asc' } })
  return { ...body, items }
}

const sendQuote = (quoteId: number, items: Array<{ id: number }>, price = 20000, adminMessage = 'Mensaje de prueba') =>
  api(`/api/admin/quotes/${quoteId}/send-quote`, {
    method: 'POST',
    admin: true,
    json: { adminMessage, items: items.map((item) => ({ itemId: item.id, quotedUnitPrice: price })) },
  })

let colorOptionId = 0

beforeAll(async () => {
  await prisma.adminUser.create({
    data: { email: ADMIN.email, passwordHash: await bcrypt.hash(ADMIN.password, 4) },
  })
  const productBase = {
    description: 'Producto de prueba',
    images: '["/img.jpg"]',
    tags: '["test"]',
    specs: '["spec"]',
    personalization: 'Bordado',
    minOrder: 'MOQ 1',
    leadTime: '10 días',
    availability: 'DISPONIBLE' as const,
    sampleEligible: false,
  }
  await prisma.product.create({
    data: { ...productBase, id: 'test-estola', name: 'Estola de prueba', category: 'graduaciones', price: 15000 },
  })
  await prisma.product.create({
    data: { ...productBase, id: 'test-polera', name: 'Polera de prueba', category: 'marketing', price: 8000 },
  })
  const option = await prisma.productOption.create({
    data: {
      productId: 'test-estola',
      type: 'COLOR',
      label: 'Color',
      choices: JSON.stringify([{ label: 'Azul ceremonial', value: '#1F4FA0' }]),
    },
  })
  colorOptionId = option.id

  server = createServer(createApp())
  await new Promise<void>((resolve) => server.listen(0, resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  const login = await api('/api/admin/login', { method: 'POST', json: ADMIN })
  expect(login.status).toBe(200)
  cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await prisma.$disconnect()
})

beforeEach(() => {
  sendMail.mockReset()
  sendMail.mockResolvedValue({ messageId: 'ok' })
  env.SMTP_USER = 'taller@example.com'
  env.SMTP_PASS = 'app-password-de-prueba'
})

// Correos de cotización formal (con PDF adjunto); crear la cotización también envía avisos
const formalMails = () =>
  sendMail.mock.calls.map((call) => call[0]).filter((mail) => Array.isArray(mail.attachments))

const storedFiles = (folio: string) =>
  fs.existsSync(getQuotesStorageDir()) ? fs.readdirSync(getQuotesStorageDir()).filter((f) => f.startsWith(folio)) : []

describe('envío de la cotización formal', () => {
  it('genera un token no adivinable al crear la cotización y se lo entrega a quien la crea', async () => {
    const quote = await createQuote()
    const row = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })
    expect(row.publicToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(quote.token).toBe(row.publicToken)
    // El correo de confirmación al cliente trae el link con su token
    const confirmation = sendMail.mock.calls
      .map((call) => call[0])
      .find((mail) => mail.to === 'ana@example.com' && String(mail.subject).includes(quote.folio))
    expect(confirmation.text).toContain(`/cotizacion/${quote.folio}?t=${row.publicToken}`)
  })

  it('guarda el subtotal referencial de la solicitud y lo conserva al enviar', async () => {
    const quote = await createQuote()
    // 30 × 15.000 + 10 × 8.000 = 530.000 (precios de catálogo)
    expect((await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })).referenceSubtotal).toBe(530000)
    expect((await sendQuote(quote.id, quote.items, 20000)).status).toBe(200)
    const row = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })
    expect(row.subtotal).toBe(800000)
    expect(row.referenceSubtotal).toBe(530000)
    const detail = await (await api(`/api/admin/quotes/${quote.id}`, { admin: true })).json()
    expect(detail).toMatchObject({ subtotal: 800000, referenceSubtotal: 530000 })
  })

  it('la validez usa QUOTE_VALIDITY_DAYS', async () => {
    const quote = await createQuote()
    const previous = env.QUOTE_VALIDITY_DAYS
    env.QUOTE_VALIDITY_DAYS = 45
    try {
      expect((await sendQuote(quote.id, quote.items)).status).toBe(200)
    } finally {
      env.QUOTE_VALIDITY_DAYS = previous
    }
    const revision = await prisma.quoteRevision.findFirstOrThrow({ where: { quoteId: quote.id } })
    expect(revision.validUntil.toISOString()).toBe(computeValidUntil(revision.issuedAt, 45).toISOString())
    const pdf = fs.readFileSync(path.join(getQuotesStorageDir(), revision.filePath))
    expect((await extractPdfText(pdf)).text).toContain('válida por 45 días')
  })

  it('si el SMTP falla, no queda como enviada, no guarda revisión y el admin recibe el error', async () => {
    const quote = await createQuote()
    sendMail.mockImplementation(async (mail) => {
      if (mail.attachments) throw new Error('Connection timeout')
      return { messageId: 'ok' }
    })

    const response = await sendQuote(quote.id, quote.items)
    expect(response.status).toBe(502)
    expect(await response.json()).toMatchObject({ error: 'mail_send_failed' })

    const row = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id }, include: { items: true } })
    expect(row.status).toBe('NEW')
    expect(row.quotedAt).toBeNull()
    expect(row.items.every((item) => item.quotedUnitPrice === null)).toBe(true)
    expect(await prisma.quoteRevision.count({ where: { quoteId: quote.id } })).toBe(0)
    expect(storedFiles(quote.folio)).toEqual([])
  })

  it('sin SMTP configurado responde 503 y no marca como enviada', async () => {
    const quote = await createQuote()
    env.SMTP_USER = undefined
    env.SMTP_PASS = undefined

    const response = await sendQuote(quote.id, quote.items)
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ error: 'mail_not_configured' })
    expect(formalMails()).toEqual([])

    const row = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })
    expect(row.status).toBe('NEW')
    expect(await prisma.quoteRevision.count({ where: { quoteId: quote.id } })).toBe(0)
    expect(storedFiles(quote.folio)).toEqual([])
  })

  it('emite rev 0 sin sufijo y re-emite -rev1, -rev2 sin sobrescribir', async () => {
    const quote = await createQuote()

    const first = await sendQuote(quote.id, quote.items, 20000)
    expect(first.status).toBe(200)
    expect(await first.json()).toMatchObject({
      status: 'QUOTED',
      rev: 0,
      fileName: `${quote.folio}.pdf`,
      // 30 × 20.000 + 10 × 20.000 = 800.000; IVA 152.000
      netAmount: 800000,
      ivaAmount: 152000,
      totalAmount: 952000,
    })

    // El correo lleva el PDF adjunto y el link del portal con el token
    const mail = formalMails()[0]
    const token = (await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })).publicToken!
    expect(mail.to).toBe('ana@example.com')
    expect(mail.attachments[0].filename).toBe(`${quote.folio}.pdf`)
    expect(mail.text).toContain(`https://tienda.test/cotizacion/${quote.folio}?t=${token}`)
    expect(mail.text).not.toContain('confeccionesjuany.cl')

    const rev0Path = path.join(getQuotesStorageDir(), `${quote.folio}.pdf`)
    const rev0Sha = sha256Hex(fs.readFileSync(rev0Path))

    const second = await sendQuote(quote.id, quote.items, 25000)
    expect(second.status).toBe(200)
    expect(await second.json()).toMatchObject({ rev: 1, fileName: `${quote.folio}-rev1.pdf`, netAmount: 1000000 })
    const third = await sendQuote(quote.id, quote.items, 26000)
    expect(await third.json()).toMatchObject({ rev: 2, fileName: `${quote.folio}-rev2.pdf` })

    expect(storedFiles(quote.folio).sort()).toEqual([
      `${quote.folio}-rev1.pdf`,
      `${quote.folio}-rev2.pdf`,
      `${quote.folio}.pdf`,
    ])
    // El link del portal impreso en el PDF lleva el token (el portal lo exige)
    const rev0Text = await extractPdfText(fs.readFileSync(rev0Path))
    expect(rev0Text.links).toContain(`https://tienda.test/cotizacion/${quote.folio}?t=${token}`)
    expect(rev0Text.text).not.toContain(token)

    // La emisión original no se tocó
    expect(sha256Hex(fs.readFileSync(rev0Path))).toBe(rev0Sha)

    const revisions = await prisma.quoteRevision.findMany({ where: { quoteId: quote.id }, orderBy: { rev: 'asc' } })
    expect(revisions.map((r) => [r.rev, r.filePath])).toEqual([
      [0, `${quote.folio}.pdf`],
      [1, `${quote.folio}-rev1.pdf`],
      [2, `${quote.folio}-rev2.pdf`],
    ])
    for (const revision of revisions) {
      expect(revision.sentAt).not.toBeNull()
      expect(revision.adminUserId).toBeGreaterThan(0)
      expect(revision.validUntil.toISOString()).toBe(
        computeValidUntil(revision.issuedAt, env.QUOTE_VALIDITY_DAYS).toISOString()
      )
      expect(sha256Hex(fs.readFileSync(path.join(getQuotesStorageDir(), revision.filePath)))).toBe(revision.sha256)
    }
  })

  it('si quedó un PDF sin registrar (correo enviado, base caída), emite la revisión siguiente', async () => {
    const quote = await createQuote()
    fs.mkdirSync(getQuotesStorageDir(), { recursive: true })
    const orphan = path.join(getQuotesStorageDir(), `${quote.folio}.pdf`)
    fs.writeFileSync(orphan, 'huérfano')

    const response = await sendQuote(quote.id, quote.items)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ rev: 1, fileName: `${quote.folio}-rev1.pdf` })
    expect(fs.readFileSync(orphan, 'utf8')).toBe('huérfano')
  })

  it('no re-emite cotizaciones aceptadas o rechazadas', async () => {
    const quote = await createQuote()
    await prisma.quote.update({ where: { id: quote.id }, data: { status: 'ACCEPTED' } })
    const response = await sendQuote(quote.id, quote.items)
    expect(response.status).toBe(409)
    expect(formalMails()).toEqual([])
  })

  it('rechaza ítems de otra cotización', async () => {
    const a = await createQuote()
    const b = await createQuote()
    const response = await sendQuote(a.id, b.items)
    expect(response.status).toBe(400)
  })
})

describe('vista previa del admin', () => {
  it('devuelve el PDF con los precios en pantalla sin guardar ni enviar', async () => {
    const quote = await createQuote()
    const prices = quote.items.map((item) => `${item.id}:12345`).join(',')
    const response = await api(
      `/api/admin/quotes/${quote.id}/pdf-preview?prices=${prices}&message=${encodeURIComponent('Hola desde la vista previa')}`,
      { admin: true }
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')

    const { text, compact } = await extractPdfText(Buffer.from(await response.arrayBuffer()))
    expect(text).toContain('VISTA PREVIA')
    expect(text).toContain('Hola desde la vista previa')
    expect(text).toContain('Color: Azul ceremonial (#1F4FA0)')
    expect(compact).toContain('$12.345')

    expect(formalMails()).toEqual([])
    const row = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id }, include: { items: true } })
    expect(row.status).toBe('NEW')
    expect(row.items.every((item) => item.quotedUnitPrice === null)).toBe(true)
    expect(await prisma.quoteRevision.count({ where: { quoteId: quote.id } })).toBe(0)
    expect(storedFiles(quote.folio)).toEqual([])
  })

  it('exige sesión de admin', async () => {
    const quote = await createQuote()
    const response = await api(`/api/admin/quotes/${quote.id}/pdf-preview`)
    expect(response.status).toBe(401)
  })

  it('rechaza precios mal formados', async () => {
    const quote = await createQuote()
    const response = await api(`/api/admin/quotes/${quote.id}/pdf-preview?prices=abc`, { admin: true })
    expect(response.status).toBe(400)
  })
})

describe('descarga desde el portal', () => {
  it('exige el token: sin token, con uno inválido o ajeno da 404', async () => {
    const mine = await createQuote()
    const other = await createQuote()
    expect((await sendQuote(mine.id, mine.items)).status).toBe(200)
    expect((await sendQuote(other.id, other.items)).status).toBe(200)

    const myToken = (await prisma.quote.findUniqueOrThrow({ where: { id: mine.id } })).publicToken!
    const otherToken = (await prisma.quote.findUniqueOrThrow({ where: { id: other.id } })).publicToken!

    expect((await api(`/api/portal/quotes/${mine.folio}/pdf`)).status).toBe(404)
    expect((await api(`/api/portal/quotes/${mine.folio}/pdf?t=`)).status).toBe(404)
    expect((await api(`/api/portal/quotes/${mine.folio}/pdf?t=no-es-el-token`)).status).toBe(404)
    expect((await api(`/api/portal/quotes/${mine.folio}/pdf?t=${otherToken}`)).status).toBe(404)

    const ok = await api(`/api/portal/quotes/${mine.folio}/pdf?t=${myToken}`)
    expect(ok.status).toBe(200)
    expect(ok.headers.get('content-type')).toBe('application/pdf')
    expect(ok.headers.get('content-disposition')).toContain(`${mine.folio}.pdf`)
  })

  it('sirve la última revisión enviada', async () => {
    const quote = await createQuote()
    await sendQuote(quote.id, quote.items, 20000)
    await sendQuote(quote.id, quote.items, 21000)
    const token = (await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })).publicToken!

    const response = await api(`/api/portal/quotes/${quote.folio}/pdf?t=${token}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const latest = await prisma.quoteRevision.findFirstOrThrow({ where: { quoteId: quote.id }, orderBy: { rev: 'desc' } })
    expect(latest.rev).toBe(1)
    expect(sha256Hex(buffer)).toBe(latest.sha256)
  })

  it('con token válido pero sin emisión da 404', async () => {
    const quote = await createQuote()
    const token = (await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })).publicToken!
    expect((await api(`/api/portal/quotes/${quote.folio}/pdf?t=${token}`)).status).toBe(404)
  })

  it('el portal informa si hay PDF sin exponer el token', async () => {
    const quote = await createQuote()
    await sendQuote(quote.id, quote.items)
    const token = (await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })).publicToken!
    const response = await api(`/api/portal/quotes/${quote.folio}?t=${token}`)
    const raw = await response.text()
    expect(raw).not.toContain(token)
    expect(JSON.parse(raw)).toMatchObject({ pdfAvailable: true, formal: { rev: 0, totalAmount: 952000 } })
  })
})

describe('portal con token', () => {
  it('ver la cotización exige el token: sin token, inválido o ajeno da 404', async () => {
    const mine = await createQuote()
    const other = await createQuote()
    expect((await api(`/api/portal/quotes/${mine.folio}`)).status).toBe(404)
    expect((await api(`/api/portal/quotes/${mine.folio}?t=inventado`)).status).toBe(404)
    expect((await api(`/api/portal/quotes/${mine.folio}?t=${other.token}`)).status).toBe(404)
    const ok = await api(`/api/portal/quotes/${mine.folio}?t=${mine.token}`)
    expect(ok.status).toBe(200)
    expect(await ok.json()).toMatchObject({ folio: mine.folio, status: 'NEW' })
  })

  it('aceptar o rechazar exige el token y sólo una vez', async () => {
    const quote = await createQuote()
    const other = await createQuote()
    expect((await sendQuote(quote.id, quote.items)).status).toBe(200)
    const respond = (body: object) =>
      api(`/api/portal/quotes/${quote.folio}/respond`, { method: 'POST', json: body })

    expect((await respond({ action: 'ACCEPT' })).status).toBe(404)
    expect((await respond({ action: 'ACCEPT', token: other.token })).status).toBe(404)
    expect((await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })).status).toBe('QUOTED')

    const ok = await respond({ action: 'ACCEPT', token: quote.token })
    expect(ok.status).toBe(200)
    expect(await ok.json()).toMatchObject({ status: 'ACCEPTED' })
    expect((await respond({ action: 'REJECT', token: quote.token })).status).toBe(409)
    expect((await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })).status).toBe('ACCEPTED')
  })
})

describe('«Cotizada» a mano', () => {
  const patchStatus = (id: number, status: string) =>
    api(`/api/admin/quotes/${id}`, { method: 'PATCH', admin: true, json: { status } })

  it('sin emisión enviada queda marcada como enviada por fuera, con nota interna', async () => {
    const quote = await createQuote()
    const response = await patchStatus(quote.id, 'QUOTED')
    expect(response.status).toBe(200)
    expect((await response.json()).externallyQuotedAt).toBeTruthy()

    const detail = await (await api(`/api/admin/quotes/${quote.id}`, { admin: true })).json()
    expect(detail.status).toBe('QUOTED')
    expect(detail.externallyQuotedAt).toBeTruthy()
    expect(detail.notes.map((n: { body: string }) => n.body).join(' ')).toContain('por fuera')
    const list = await (await api('/api/admin/quotes', { admin: true })).json()
    expect(list.find((q: { id: number }) => q.id === quote.id).externallyQuotedAt).toBeTruthy()
  })

  it('la marca se limpia al emitir formalmente desde el sistema', async () => {
    const quote = await createQuote()
    await patchStatus(quote.id, 'QUOTED')
    expect((await sendQuote(quote.id, quote.items)).status).toBe(200)
    const row = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })
    expect(row.externallyQuotedAt).toBeNull()
  })

  it('con una emisión ya enviada no se marca', async () => {
    const quote = await createQuote()
    expect((await sendQuote(quote.id, quote.items)).status).toBe(200)
    await patchStatus(quote.id, 'IN_REVIEW')
    const response = await patchStatus(quote.id, 'QUOTED')
    expect((await response.json()).externallyQuotedAt).toBeNull()
  })
})

describe('detalle de admin y notas', () => {
  it('devuelve adminMessage, quotedAt, quotedUnitPrice y revisiones al recargar', async () => {
    const quote = await createQuote()
    await sendQuote(quote.id, quote.items, 19990, 'Precio especial')

    const response = await api(`/api/admin/quotes/${quote.id}`, { admin: true })
    const body = await response.json()
    expect(body.adminMessage).toBe('Precio especial')
    expect(body.quotedAt).toBeTruthy()
    expect(body.items.map((item: { quotedUnitPrice: number }) => item.quotedUnitPrice)).toEqual([19990, 19990])
    expect(body.revisions).toHaveLength(1)
    expect(body.customerPortalUrl).toMatch(new RegExp(`/cotizacion/${quote.folio}\\?t=`))
  })

  it('el link personal del cliente está disponible antes de la emisión formal', async () => {
    const quote = await createQuote()
    const body = await (await api(`/api/admin/quotes/${quote.id}`, { admin: true })).json()
    expect(body.customerPortalUrl).toBe(`https://tienda.test/cotizacion/${quote.folio}?t=${quote.token}`)
  })

  it('las notas públicas llegan al portal y las privadas no', async () => {
    const quote = await createQuote()
    const pub = await api(`/api/admin/quotes/${quote.id}/notes`, {
      method: 'POST',
      admin: true,
      json: { body: 'Ya estamos bordando', isPublic: true },
    })
    expect(await pub.json()).toMatchObject({ isPublic: true })
    await api(`/api/admin/quotes/${quote.id}/notes`, {
      method: 'POST',
      admin: true,
      json: { body: 'Nota interna' },
    })

    const portal = await (await api(`/api/portal/quotes/${quote.folio}?t=${quote.token}`)).json()
    expect(portal.notes.map((n: { body: string }) => n.body)).toEqual(['Ya estamos bordando'])
  })
})
