import { expect, test } from '@playwright/test';
import { LEGAL_VERSION } from '../../apps/web/src/data/legal';

// Mismos valores que el webServer de playwright.config.ts
const ADMIN = { email: 'admin@e2e.test', password: 'clave-e2e-123' };

test('el footer enlaza los borradores legales y los términos muestran la validez y el IVA del server', async ({ page }) => {
  await page.goto('/catalogo');
  const footer = page.locator('footer');
  await footer.getByRole('link', { name: 'Aviso de privacidad' }).click();
  await expect(page).toHaveURL(/\/privacidad$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Aviso de privacidad' })).toBeVisible();
  await expect(page.getByText('Borrador — revisar con la clienta y, idealmente, con un abogado.')).toBeVisible();
  await expect(page.getByText('Ley N° 21.719')).toBeVisible();
  await expect(page.getByText('confeccionesjuany:cart')).toBeVisible();
  await expect(page.getByText('admin_session')).toBeVisible();

  await footer.getByRole('link', { name: 'Términos de la cotización' }).click();
  await expect(page).toHaveURL(/\/terminos$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Términos de la cotización' })).toBeVisible();
  await expect(page.getByText('Borrador — revisar con la clienta y, idealmente, con un abogado.')).toBeVisible();
  await expect(page.getByText('válida por 30 días corridos')).toBeVisible();
  await expect(page.getByText('IVA del 19 %')).toBeVisible();
  await expect(page.getByText('[POR DEFINIR CON LA CLIENTA: porcentaje del anticipo', { exact: false })).toBeVisible();
});

test('el mensaje de contacto exige aceptar los documentos y el admin ve la aceptación', async ({ page }) => {
  await page.goto('/contacto');
  await page.getByLabel('Nombre').fill('Contacto E2E');
  await page.getByLabel('Email').fill('contacto@e2e.test');
  await page.getByLabel('Mensaje').fill('Quiero cotizar 40 estolas.');

  const consent = page.getByRole('checkbox', { name: /acepto el aviso de privacidad/ });
  const form = page.locator('form');
  await expect(form.getByRole('link', { name: 'aviso de privacidad' })).toHaveAttribute('target', '_blank');
  await expect(form.getByRole('link', { name: 'términos de la cotización' })).toHaveAttribute('href', '/terminos');

  // Sin marcar la casilla el navegador no envía el formulario
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(consent).toHaveJSProperty('validity.valueMissing', true);
  await expect(page.getByText('Mensaje recibido')).toHaveCount(0);

  await consent.check();
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByText('Mensaje recibido')).toBeVisible();

  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Contraseña').fill(ADMIN.password);
  await page.getByRole('button', { name: /ingresar|entrar|iniciar/i }).click();
  await expect(page).toHaveURL(/\/admin\/(products|quotes)/);
  await page.goto('/admin/messages');
  await expect(page.getByRole('row', { name: /contacto@e2e\.test/ })).toContainText(
    `Aceptó privacidad y términos (v. ${LEGAL_VERSION})`
  );
});
