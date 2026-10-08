import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { LEGAL_VERSION } from '../../apps/web/src/data/legal';

// Mismos valores que el webServer de playwright.config.ts
const ADMIN = { email: 'admin@e2e.test', password: 'clave-e2e-123' };
const OUTBOX_DIR = path.resolve(__dirname, '../../apps/server/storage/e2e/outbox');
const CUSTOMER = { name: 'Camila Prueba', email: 'camila@e2e.test', phone: '+56 9 1234 5678' };

type OutboxMail = {
  to: unknown;
  subject: string;
  text: string;
  attachments?: Array<{ filename: string; content: string }>;
};

const sha256 = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');

// Correo de cotización formal (con PDF) dirigido a `email` para `folio`, guardado por MAIL_TRANSPORT=outbox
const findFormalMail = (email: string, folio: string): OutboxMail | undefined => {
  if (!fs.existsSync(OUTBOX_DIR)) return undefined;
  return fs
    .readdirSync(OUTBOX_DIR)
    .sort()
    .map((file) => JSON.parse(fs.readFileSync(path.join(OUTBOX_DIR, file), 'utf8')) as OutboxMail)
    .filter((mail) => JSON.stringify(mail.to).includes(email) && mail.subject.includes(folio) && mail.attachments?.length)
    .pop();
};

const waitForFormalMail = async (email: string, folio: string) => {
  await expect.poll(() => findFormalMail(email, folio), { timeout: 10_000 }).toBeTruthy();
  return findFormalMail(email, folio)!;
};

const portalLinkFrom = (mail: OutboxMail, folio: string) => {
  const match = mail.text.match(new RegExp(`https?://\\S+/cotizacion/${folio}\\?t=[A-Za-z0-9_-]+`));
  expect(match, 'el correo trae el link del portal con token').not.toBeNull();
  return match![0];
};

const loginAdmin = async (page: Page) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Contraseña').fill(ADMIN.password);
  await page.getByRole('button', { name: /ingresar|entrar|iniciar/i }).click();
  await expect(page).toHaveURL(/\/admin\/(products|quotes)/);
};

// Segunda cotización creada y enviada por API, para probar un token ajeno
const createAndSendOtherQuote = async (request: APIRequestContext) => {
  const created = await request.post('/api/quotes', {
    data: {
      customer: { name: 'Otro Cliente', email: 'otro@e2e.test' },
      items: [{ productId: 'e2e-estola', quantity: 10, configuration: [] }],
      legal: { accepted: true, version: LEGAL_VERSION },
    },
  });
  expect(created.status()).toBe(201);
  const { id, folio } = (await created.json()) as { id: number; folio: string };
  const detail = await (await request.get(`/api/admin/quotes/${id}`)).json();
  const sent = await request.post(`/api/admin/quotes/${id}/send-quote`, {
    data: { adminMessage: null, items: detail.items.map((i: { id: number }) => ({ itemId: i.id, quotedUnitPrice: 14000 })) },
  });
  expect(sent.status()).toBe(200);
  const mail = await waitForFormalMail('otro@e2e.test', folio);
  return new URL(portalLinkFrom(mail, folio)).searchParams.get('t')!;
};

test('cliente cotiza, admin previsualiza y envía, cliente descarga el PDF con el token', async ({ page, context }, testInfo) => {
  // ── Cliente arma la cotización ──
  await page.goto('/catalogo');
  await page.getByRole('heading', { name: 'Estola bordada E2E' }).click();
  const modal = page.getByRole('dialog', { name: 'Configurar Estola bordada E2E' });
  await modal.getByRole('button', { name: 'Azul ceremonial' }).click();
  await modal.getByPlaceholder('Ej: Texto bordado...').fill('Generación 2026');
  await modal.getByRole('button', { name: 'Agregar al carrito' }).click();

  await page.goto('/carrito');
  await page.getByLabel('Nombre y apellido').fill(CUSTOMER.name);
  await page.getByLabel('Correo electrónico').fill(CUSTOMER.email);
  await page.getByLabel('Teléfono').fill(CUSTOMER.phone);
  await page.getByRole('checkbox', { name: /acepto el aviso de privacidad/ }).check();
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();

  const statusLink = page.getByRole('link', { name: 'Ver estado de cotización' });
  await expect(statusLink).toBeVisible();
  // El link del carrito ya trae el token: quien crea la cotización puede verla
  const statusHref = new URL((await statusLink.getAttribute('href'))!, 'http://e2e');
  const folio = statusHref.pathname.split('/').pop()!;
  expect(folio).toMatch(/^COT-\d{6}$/);
  expect(statusHref.searchParams.get('t')).toMatch(/^[A-Za-z0-9_-]{43}$/);
  const quoteId = Number(folio.slice(4));
  await statusLink.click();
  await expect(page.getByRole('heading', { name: folio, exact: true })).toBeVisible();
  await expect(page.getByText('Recibida')).toBeVisible();

  // ── Admin revisa, previsualiza y envía ──
  await loginAdmin(page);
  await page.goto(`/admin/quotes/${quoteId}`);
  await expect(page.getByRole('heading', { name: folio, exact: true })).toBeVisible();
  await page.getByRole('table', { name: 'Items de la cotización' }).getByRole('spinbutton').fill('17990');
  await page.getByLabel('Mensaje al cliente (opcional)').fill('Incluye el bordado del texto.');

  // La vista previa se abre en otra pestaña; se captura la URL y se descarga con la sesión del admin
  let previewUrl = '';
  await context.route('**/api/admin/quotes/*/pdf-preview*', async (route) => {
    previewUrl = route.request().url();
    await route.continue();
  });
  await page.getByRole('button', { name: 'Vista previa del PDF' }).click();
  await expect.poll(() => previewUrl).toContain('/pdf-preview?');
  expect(previewUrl).toContain('17990');
  const preview = await page.request.get(previewUrl);
  expect(preview.status()).toBe(200);
  expect(preview.headers()['content-type']).toBe('application/pdf');
  const previewPdf = await preview.body();
  expect(previewPdf.subarray(0, 5).toString()).toBe('%PDF-');
  await testInfo.attach('vista-previa.pdf', { body: previewPdf, contentType: 'application/pdf' });

  // La vista previa no envía ni cambia el estado
  expect(findFormalMail(CUSTOMER.email, folio)).toBeUndefined();
  const before = await (await page.request.get(`/api/admin/quotes/${quoteId}`)).json();
  expect(before.status).toBe('NEW');
  expect(before.revisions).toHaveLength(0);

  await page.getByRole('button', { name: 'Enviar cotización formal' }).click();
  await expect(page.getByRole('status')).toContainText(`Enviada a ${CUSTOMER.email}`);
  await expect(page.getByRole('table', { name: 'Revisiones emitidas' })).toContainText(`${folio}.pdf`);
  await page.screenshot({ path: testInfo.outputPath('admin-tras-envio.png'), fullPage: true });

  // ── Correo simulado: PDF adjunto + link con token ──
  const mail = await waitForFormalMail(CUSTOMER.email, folio);
  const attachment = Buffer.from(mail.attachments![0].content, 'base64');
  expect(mail.attachments![0].filename).toBe(`${folio}.pdf`);
  expect(attachment.subarray(0, 5).toString()).toBe('%PDF-');
  const portalLink = portalLinkFrom(mail, folio);

  // ── Cliente descarga desde el portal con el link del correo ──
  await page.goto(portalLink);
  await expect(page.getByRole('heading', { name: folio, exact: true })).toBeVisible();
  await expect(page.getByText('válida hasta el')).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Descargar PDF' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(`${folio}.pdf`);
  const downloaded = fs.readFileSync((await download.path())!);
  expect(sha256(downloaded)).toBe(sha256(attachment));
  await testInfo.attach(`${folio}.pdf`, { body: downloaded, contentType: 'application/pdf' });
  await page.screenshot({ path: testInfo.outputPath('portal-con-token.png'), fullPage: true });

  // Sin token el portal no muestra la cotización: pide abrir el link del correo
  await page.goto(`/cotizacion/${folio}`);
  await expect(page.getByText('Abre el link que te enviamos por correo.')).toBeVisible();
  await expect(page.getByRole('heading', { name: folio, exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Descargar PDF' })).toHaveCount(0);

  // ── Sin token, con uno inválido o con el de otra cotización: 404 ──
  const token = new URL(portalLink).searchParams.get('t')!;
  const otherToken = await createAndSendOtherQuote(page.request);
  expect(otherToken).not.toBe(token);
  const pdfUrl = `/api/portal/quotes/${folio}/pdf`;
  expect((await page.request.get(pdfUrl)).status()).toBe(404);
  expect((await page.request.get(`${pdfUrl}?t=token-inventado`)).status()).toBe(404);
  expect((await page.request.get(`${pdfUrl}?t=${otherToken}`)).status()).toBe(404);
  expect((await page.request.get(`${pdfUrl}?t=${token}`)).status()).toBe(200);
  for (const t of ['', '?t=token-inventado', `?t=${otherToken}`]) {
    expect((await page.request.get(`/api/portal/quotes/${folio}${t}`)).status()).toBe(404);
  }

  // ── El cliente acepta con el link del correo ──
  await page.goto(portalLink);
  await page.getByRole('button', { name: 'Aceptar cotización' }).click();
  await expect(page.getByText('¡Cotización aceptada!')).toBeVisible();
  const accepted = await (await page.request.get(`/api/admin/quotes/${quoteId}`)).json();
  expect(accepted.status).toBe('ACCEPTED');
});
