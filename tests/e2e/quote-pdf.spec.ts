import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
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

const loginAdmin = async (page: Page) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Contraseña').fill(ADMIN.password);
  await page.getByRole('button', { name: /ingresar|entrar|iniciar/i }).click();
  await expect(page).toHaveURL(/\/admin\/(products|quotes)/);
};

test('cliente cotiza y ve su número, admin previsualiza y envía, el cliente ya no tiene portal', async ({ page, context }, testInfo) => {
  // ── Cliente arma la cotización ──
  await page.goto('/catalogo');
  await page.getByRole('button', { name: 'Personalizar Estola bordada E2E' }).click();
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

  // Confirmación: el número de la solicitud como referencia y el aviso de contacto, sin link a la cotización
  await expect(page.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible();
  const folioBox = page.locator('.folio');
  await expect(folioBox).toContainText('Solicitud N.º');
  const folio = (await folioBox.locator('b').innerText()).trim();
  expect(folio).toMatch(/^COT-\d{6}$/);
  const quoteId = Number(folio.slice(4));
  await expect(page.getByText('Te contactaremos por correo o teléfono')).toBeVisible();
  await expect(page.getByRole('link', { name: /estado de cotización/i })).toHaveCount(0);
  await expect(page.locator('a[href*="/cotizacion"]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('confirmacion-carrito.png'), fullPage: true });

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

  // ── Correo simulado: PDF adjunto, sin link a ninguna página de la cotización ──
  const mail = await waitForFormalMail(CUSTOMER.email, folio);
  const attachment = Buffer.from(mail.attachments![0].content, 'base64');
  expect(mail.attachments![0].filename).toBe(`${folio}.pdf`);
  expect(attachment.subarray(0, 5).toString()).toBe('%PDF-');
  expect(mail.text).not.toContain('/cotizacion/');
  expect(mail.text).toContain('responde a este correo');

  // ── El admin sigue descargando el PDF emitido, igual que antes ──
  const adminPdf = await page.request.get(`/api/admin/quotes/${quoteId}/revisions/0/pdf`);
  expect(adminPdf.status()).toBe(200);
  expect(sha256(await adminPdf.body())).toBe(sha256(attachment));
  await testInfo.attach(`${folio}.pdf`, { body: attachment, contentType: 'application/pdf' });

  // ── El cliente no puede ver, descargar ni responder la cotización ──
  const anon = await context.browser()!.newContext({ baseURL: new URL(page.url()).origin });
  try {
    for (const url of [`/api/portal/quotes/${folio}`, `/api/portal/quotes/${folio}/pdf`, `/api/quotes/${quoteId}`]) {
      expect((await anon.request.get(url)).status(), url).toBe(404);
    }
    expect((await anon.request.post(`/api/portal/quotes/${folio}/respond`, { data: { action: 'ACCEPT' } })).status()).toBe(404);
    expect((await anon.request.get(`/api/admin/quotes/${quoteId}/revisions/0/pdf`)).status()).toBe(401);

    // La ruta vieja muestra la página simple, sin datos de la cotización, con o sin token
    const oldPage = await anon.newPage();
    for (const route of [`/cotizacion/${folio}?t=cualquier-token`, `/cotizacion/${folio}`, '/cotizacion']) {
      await oldPage.goto(route);
      await expect(oldPage.getByRole('heading', { name: 'Te contactaremos por correo o teléfono' })).toBeVisible();
      await expect(oldPage.getByText(folio)).toHaveCount(0);
      await expect(oldPage.getByText(CUSTOMER.name)).toHaveCount(0);
      await expect(oldPage.getByRole('link', { name: 'Descargar PDF' })).toHaveCount(0);
      await expect(oldPage.getByRole('button', { name: /Aceptar|Rechazar/ })).toHaveCount(0);
    }
    await oldPage.goto(`/cotizacion/${folio}?t=cualquier-token`);
    await oldPage.screenshot({ path: testInfo.outputPath('ruta-vieja.png'), fullPage: true });
  } finally {
    await anon.close();
  }

  // ── El admin sigue cambiando el estado a mano ──
  const accepted = await page.request.patch(`/api/admin/quotes/${quoteId}`, { data: { status: 'ACCEPTED' } });
  expect(accepted.status()).toBe(200);
  expect((await (await page.request.get(`/api/admin/quotes/${quoteId}`)).json()).status).toBe('ACCEPTED');
});
