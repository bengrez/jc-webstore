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
const { LEGAL_VERSION } = await import('../src/server/lib/legal.js')

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
      legal: { accepted: true, version: LEGAL_VERSION },
    },
  })
  expect(response.status).toBe(201)
  const body = (await response.json()) as { id: number; folio: string }
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
  it('crea la cotización con su número y sin token ni link a la cotización', async () => {
    const response = await api('/api/quotes', {
      method: 'POST',
      json: {
        customer: { name: 'Ana Prueba', email: 'ana@example.com' },
        items: [{ productId: 'test-polera', quantity: 10, configuration: [] }],
        legal: { accepted: true, version: LEGAL_VERSION },
      },
    })
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(Object.keys(body).sort()).toEqual(['emailSent', 'folio', 'id', 'status'])
    expect(body.folio).toMatch(/^COT-\d{6}$/)
    // La cotización ya no guarda ningún token de acceso
    const row = await prisma.quote.findUniqueOrThrow({ where: { id: body.id } })
    expect(row).not.toHaveProperty('publicToken')

    // El correo de confirmación trae el número y ningún link a la cotización
    const confirmation = sendMail.mock.calls
      .map((call) => call[0])
      .find((mail) => mail.to === 'ana@example.com' && String(mail.subject).includes(body.folio))
    expect(confirmation.text).toContain(`Tu número de solicitud es ${body.folio}`)
    expect(confirmation.text).not.toContain('/cotizacion/')
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

    // El correo lleva el PDF adjunto y ningún link a la cotización
    const mail = formalMails()[0]
    expect(mail.to).toBe('ana@example.com')
    expect(mail.attachments[0].filename).toBe(`${quote.folio}.pdf`)
    expect(mail.text).not.toContain('/cotizacion/')
    expect(mail.text).toContain('responde a este correo')

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
    // El PDF ya no remite a ningún portal
    const rev0Text = await extractPdfText(fs.readFileSync(rev0Path))
    expect(rev0Text.links.some((link: string) => link.includes('/cotizacion/'))).toBe(false)
    expect(rev0Text.text).not.toContain('/cotizacion/')

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

describe('sin portal público de cotizaciones', () => {
  // Aunque alguien conserve un link viejo con token, no hay ruta que lo use
  const FAKE_TOKEN = 'token-de-un-correo-antiguo'

  it('ninguna ruta pública expone una cotización por folio y token', async () => {
    const quote = await createQuote()
    expect((await sendQuote(quote.id, quote.items)).status).toBe(200)

    const portalPaths = [
      `/api/portal/quotes/${quote.folio}`,
      `/api/portal/quotes/${quote.folio}?t=${FAKE_TOKEN}`,
      `/api/portal/quotes/${quote.folio}/pdf?t=${FAKE_TOKEN}`,
      `/api/portal/quotes/${quote.folio}/pdf`,
      `/api/quotes/${quote.id}`,
      `/api/quotes/${quote.folio}?t=${FAKE_TOKEN}`,
    ]
    for (const pathname of portalPaths) {
      const response = await api(pathname)
      expect(response.status, `GET ${pathname}`).toBe(404)
      const raw = await response.text()
      // Express repite la ruta en su 404; lo que no puede aparecer son datos de la cotización
      for (const leak of ['ana@example.com', 'Ana Prueba', 'Estola', 'Generación 2026', 'customerName']) {
        expect(raw, `GET ${pathname}`).not.toContain(leak)
      }
    }
  })

  it('el cliente ya no puede aceptar ni rechazar: el estado no cambia', async () => {
    const quote = await createQuote()
    expect((await sendQuote(quote.id, quote.items)).status).toBe(200)
    for (const action of ['ACCEPT', 'REJECT']) {
      const response = await api(`/api/portal/quotes/${quote.folio}/respond`, {
        method: 'POST',
        json: { action, token: FAKE_TOKEN },
      })
      expect(response.status).toBe(404)
    }
    expect((await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } })).status).toBe('QUOTED')
  })

  it('el PDF vigente sólo se descarga desde el panel de administración', async () => {
    const quote = await createQuote()
    await sendQuote(quote.id, quote.items, 20000)
    expect((await api(`/api/admin/quotes/${quote.id}/revisions/0/pdf`)).status).toBe(401)
    const ok = await api(`/api/admin/quotes/${quote.id}/revisions/0/pdf`, { admin: true })
    expect(ok.status).toBe(200)
    expect(ok.headers.get('content-type')).toBe('application/pdf')
  })

  it('el admin sigue pudiendo marcar la cotización como aceptada o rechazada', async () => {
    const quote = await createQuote()
    expect((await sendQuote(quote.id, quote.items)).status).toBe(200)
    const response = await api(`/api/admin/quotes/${quote.id}`, {
      method: 'PATCH',
      admin: true,
      json: { status: 'ACCEPTED' },
    })
    expect(response.status).toBe(200)
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
    expect(body).not.toHaveProperty('customerPortalUrl')
  })

  it('el detalle ya no trae link del cliente', async () => {
    const quote = await createQuote()
    const body = await (await api(`/api/admin/quotes/${quote.id}`, { admin: true })).json()
    expect(body).not.toHaveProperty('customerPortalUrl')
    expect(JSON.stringify(body)).not.toContain('/cotizacion/')
  })

  it('las notas internas se guardan y se listan sin visibilidad para el cliente', async () => {
    const quote = await createQuote()
    const created = await api(`/api/admin/quotes/${quote.id}/notes`, {
      method: 'POST',
      admin: true,
      json: { body: 'Ya estamos bordando' },
    })
    expect(created.status).toBe(201)
    expect(Object.keys(await created.json()).sort()).toEqual(['authorEmail', 'body', 'createdAt', 'id'])

    const detail = await (await api(`/api/admin/quotes/${quote.id}`, { admin: true })).json()
    expect(detail.notes.map((n: { body: string }) => n.body)).toEqual(['Ya estamos bordando'])
    expect(detail.notes[0]).not.toHaveProperty('isPublic')
  })
})

describe('validación del formulario de producto', () => {
  const validProduct = {
    name: 'Producto validación',
    description: 'Prueba',
    category: 'graduaciones',
    price: 1000,
    images: ['/uploads/a.png'],
    tags: ['t'],
    specs: ['s'],
    personalization: 'p',
    minOrder: 'MOQ 1',
    leadTime: '1 día',
    availability: 'Disponible',
    sampleEligible: false,
  }
  const send = (method: 'POST' | 'PUT', json: unknown, id = 'test-polera') =>
    api(method === 'POST' ? '/api/admin/products' : `/api/admin/products/${id}`, { method, admin: true, json })

  it('sin foto responde 400 con el motivo en el campo de la foto', async () => {
    const response = await send('POST', { ...validProduct, images: [] })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('validation_error')
    expect(body.fieldErrors).toEqual({ images: 'Sube al menos una foto del producto.' })
    expect(body.message).toBe('Revisa estos datos: Foto.')
  })

  it('el cuerpo vacío devuelve un mensaje por cada campo obligatorio, al crear y al editar', async () => {
    for (const method of ['POST', 'PUT'] as const) {
      const response = await send(method, {})
      expect(response.status).toBe(400)
      const { fieldErrors } = await response.json()
      expect(Object.keys(fieldErrors).sort()).toEqual(
        ['availability', 'category', 'description', 'images', 'leadTime', 'minOrder', 'name', 'personalization', 'price', 'specs', 'tags'].sort()
      )
      for (const message of Object.values(fieldErrors)) expect(typeof message).toBe('string')
    }
  })

  it('un precio con decimales explica cómo escribirlo', async () => {
    const response = await send('POST', { ...validProduct, price: 15.5 })
    expect(response.status).toBe(400)
    expect((await response.json()).fieldErrors.price).toContain('sin puntos ni decimales')
  })

  it('una imagen externa se marca en la foto y no se crea nada', async () => {
    const before = await prisma.product.count()
    const response = await send('POST', { ...validProduct, images: ['https://images.unsplash.com/photo-1.jpg'] })
    expect(response.status).toBe(400)
    expect((await response.json()).fieldErrors.images).toContain('Las imágenes deben subirse')
    expect(await prisma.product.count()).toBe(before)
  })

  it('un producto completo se crea con el mismo cuerpo que valida el formulario', async () => {
    expect((await send('POST', validProduct)).status).toBe(201)
  })
})

describe('imágenes de producto estrictas', () => {
  const productPayload = (images: string[]) => ({
    name: 'Producto imágenes',
    description: 'Prueba',
    category: 'graduaciones',
    price: 1000,
    images,
    tags: ['t'],
    specs: ['s'],
    personalization: 'p',
    minOrder: 'MOQ 1',
    leadTime: '1 día',
    availability: 'Disponible',
    sampleEligible: false,
  })

  it('el admin no puede guardar imágenes externas', async () => {
    const response = await api('/api/admin/products', {
      method: 'POST',
      admin: true,
      json: productPayload(['/uploads/a.png', 'https://images.unsplash.com/photo-1.jpg']),
    })
    expect(response.status).toBe(400)
    expect(JSON.stringify(await response.json())).toContain('Las imágenes deben subirse')
  })

  it('acepta imágenes subidas o del catálogo', async () => {
    const response = await api('/api/admin/products', {
      method: 'POST',
      admin: true,
      json: productPayload(['/uploads/a.png', '/catalog/grad-stole-magna-1.jpg']),
    })
    expect(response.status).toBe(201)
  })

  it('las externas heredadas no salen en la tienda, y el admin las ve marcadas', async () => {
    await prisma.product.update({
      where: { id: 'test-polera' },
      data: { images: JSON.stringify(['https://images.unsplash.com/photo-1.jpg']) },
    })
    try {
      const products = (await (await api('/api/products')).json()) as Array<{ id: string; image: string; images: string[] }>
      const polera = products.find((p) => p.id === 'test-polera')!
      expect(polera.images).toEqual(['/brand/logo.jpeg'])
      expect(polera.image).toBe('/brand/logo.jpeg')


      const admin = (await (await api('/api/admin/products?includeInactive=true', { admin: true })).json()) as Array<{
        id: string
        externalImages: string[]
      }>
      expect(admin.find((p) => p.id === 'test-polera')!.externalImages).toEqual(['https://images.unsplash.com/photo-1.jpg'])
    } finally {
      await prisma.product.update({ where: { id: 'test-polera' }, data: { images: '["/img.jpg"]' } })
    }
  })

  it('la CSP sólo admite imágenes propias', async () => {
    const csp = (await api('/api/health')).headers.get('content-security-policy') ?? ''
    expect(csp).toMatch(/img-src 'self' data:(;|$)/)
  })

  it('la subida de imágenes de producto rechaza PDF', async () => {
    const body = new FormData()
    body.append('file', new Blob([Buffer.from('%PDF-1.4 prueba')], { type: 'application/pdf' }), 'doc.pdf')
    const response = await api('/api/uploads/product-image', { method: 'POST', admin: true, body })
    expect(response.status).toBe(400)
  })
})

