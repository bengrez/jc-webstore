import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

// Flujo completo contra el staging levantado (ver playwright.staging.config.ts): cotización con logo,
// aceptación legal, envío formal con correo outbox, descarga del PDF con el token y aceptación.
// Deja una cotización y un mensaje de prueba en la base de staging.
const SERVER_DIR = path.resolve(__dirname, '../../apps/server');
const fromServer = (dir: string | undefined, fallback: string) => path.resolve(SERVER_DIR, dir ?? fallback);
const OUTBOX_DIR = fromServer(process.env.MAIL_OUTBOX_DIR, 'storage/staging/outbox');
const UPLOADS_DIR = fromServer(process.env.UPLOADS_DIR, 'storage/staging/uploads');
const QUOTES_DIR = fromServer(process.env.QUOTES_STORAGE_DIR, 'storage/staging/quotes');
const LOGO = path.resolve(__dirname, '../../apps/web/public/brand/logo.jpeg');
// Si se define, las capturas también se copian ahí (para reportes)
const CAPTURE_DIR = process.env.STAGING_CAPTURE_DIR;

type OutboxMail = { to: unknown; subject: string; text: string; attachments?: Array<{ filename: string; content: string }> };

const sha256 = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');

const formalMail = (email: string, folio: string) =>
  fs.existsSync(OUTBOX_DIR)
    ? fs
        .readdirSync(OUTBOX_DIR)
        .sort()
        .map((file) => JSON.parse(fs.readFileSync(path.join(OUTBOX_DIR, file), 'utf8')) as OutboxMail)
        .filter((mail) => JSON.stringify(mail.to).includes(email) && mail.subject.includes(folio) && mail.attachments?.length)
        .pop()
    : undefined;

const capture = async (page: import('@playwright/test').Page, name: string, testInfo: import('@playwright/test').TestInfo) => {
  const file = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  if (CAPTURE_DIR) fs.copyFileSync(file, path.join(CAPTURE_DIR, `${name}.png`));
};

test('staging: documentos legales, cotización con logo, envío formal en outbox, PDF y aceptación', async ({ page }, testInfo) => {
  expect(process.env.ADMIN_EMAIL, 'ADMIN_EMAIL del staging').toBeTruthy();
  const email = `staging-${Date.now()}@example.test`;

  // ── Documentos legales ──
  await page.goto('/privacidad');
  await expect(page.getByText('Borrador — revisar con la clienta y, idealmente, con un abogado.')).toBeVisible();
  await capture(page, 'staging-privacidad', testInfo);
  await page.goto('/terminos');
  await expect(page.getByText(`válida por ${process.env.QUOTE_VALIDITY_DAYS ?? 30} días corridos`)).toBeVisible();
  await capture(page, 'staging-terminos', testInfo);

  // ── Cliente arma la cotización con un logo ──
  await page.goto('/catalogo');
  await page.getByRole('heading', { name: 'Estola bordada Magna' }).click();
  const modal = page.getByRole('dialog', { name: 'Configurar Estola bordada Magna' });
  await modal.getByRole('button', { name: 'Negro' }).click();
  await modal.getByRole('button', { name: 'Plateado' }).click();
  await modal.getByPlaceholder('Ej: Texto a bordar (generación y año)...').fill('Generación 2026');
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    modal.getByRole('button', { name: 'Elegir archivo' }).click(),
  ]);
  const uploadsBefore = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR).length : 0;
  await chooser.setFiles(LOGO);
  await expect.poll(() => (fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR).length : 0)).toBe(uploadsBefore + 1);
  await modal.getByRole('button', { name: 'Agregar al carrito' }).click();

  await page.goto('/carrito');
  await page.getByLabel('Nombre y apellido').fill('Cliente Staging');
  await page.getByLabel('Correo electrónico').fill(email);
  const consent = page.getByRole('checkbox', { name: /acepto el aviso de privacidad/ });
  await consent.check();
  await capture(page, 'staging-carrito-checkbox', testInfo);
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();

  const statusLink = page.getByRole('link', { name: 'Ver estado de cotización' });
  await expect(statusLink).toBeVisible();
  const folio = new URL((await statusLink.getAttribute('href'))!, 'http://x').pathname.split('/').pop()!;
  const quoteId = Number(folio.slice(4));

  // ── Admin envía la cotización formal ──
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel('Contraseña').fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: /ingresar|entrar|iniciar/i }).click();
  // bcrypt con costo 12 tarda unos segundos en una máquina cargada
  await expect(page).toHaveURL(/\/admin\/(products|quotes)/, { timeout: 30_000 });
  await page.goto(`/admin/quotes/${quoteId}`);
  await expect(page.getByText(/Aceptó privacidad y términos \(v\. /)).toBeVisible();
  await page.getByRole('table', { name: 'Items de la cotización' }).getByRole('spinbutton').fill('12990');
  await page.getByRole('button', { name: 'Enviar cotización formal' }).click();
  // Renderiza el PDF y escribe el correo: puede tardar en una máquina cargada
  await expect(page.getByRole('status')).toContainText(`Enviada a ${email}`, { timeout: 60_000 });
  expect(fs.existsSync(path.join(QUOTES_DIR, `${folio}.pdf`)), 'PDF en la carpeta de staging').toBe(true);

  // ── Correo outbox → portal → descarga y aceptación ──
  await expect.poll(() => formalMail(email, folio), { timeout: 15_000 }).toBeTruthy();
  const mail = formalMail(email, folio)!;
  const link = mail.text.match(new RegExp(`https?://\\S+/cotizacion/${folio}\\?t=[A-Za-z0-9_-]+`))?.[0];
  expect(link, 'link del portal con token en el correo').toBeTruthy();
  const portal = new URL(link!);
  await page.goto(`${portal.pathname}${portal.search}`);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Descargar PDF' }).click(),
  ]);
  const attachment = Buffer.from(mail.attachments![0].content, 'base64');
  expect(sha256(fs.readFileSync((await download.path())!))).toBe(sha256(attachment));
  await page.getByRole('button', { name: 'Aceptar cotización' }).click();
  await expect(page.getByText('¡Cotización aceptada!')).toBeVisible();

  // ── Contacto con aceptación ──
  await page.goto('/contacto');
  await page.getByLabel('Nombre').fill('Contacto Staging');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mensaje').fill('Mensaje de prueba del staging.');
  await page.locator('form').getByRole('checkbox', { name: /acepto el aviso de privacidad/ }).check();
  await capture(page, 'staging-contacto-checkbox', testInfo);
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByText('Mensaje recibido')).toBeVisible();
});
