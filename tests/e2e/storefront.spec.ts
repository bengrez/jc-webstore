import { expect, test } from '@playwright/test';

// Diseño v6: navegación principal, catálogo, configurador por enlace, carrito vacío, celular y recursos locales.

test('inicio lleva al catálogo, filtra y abre el configurador por enlace', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('graduación');
  await page.getByRole('link', { name: 'Ver catálogo' }).first().click();
  await expect(page).toHaveURL(/\/catalogo$/);

  await page.getByRole('button', { name: /Publicitarios/ }).click();
  await expect(page.getByRole('heading', { name: 'Estola bordada E2E' })).toHaveCount(0);
  await page.getByRole('button', { name: /Graduación/ }).click();
  await expect(page.getByRole('heading', { name: 'Estola bordada E2E' })).toBeVisible();

  await page.getByPlaceholder('Buscar producto').fill('zzzz-no-existe');
  await expect(page.getByRole('heading', { name: /No encontramos productos/ })).toBeVisible();
  await page.getByPlaceholder('Buscar producto').fill('estola');
  await expect(page.getByRole('heading', { name: 'Estola bordada E2E' })).toBeVisible();

  await page.goto('/catalogo?producto=e2e-estola');
  const dialog = page.getByRole('dialog', { name: 'Configurar Estola bordada E2E' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/catalogo$/);
});

test('el carrito vacío ofrece volver al catálogo', async ({ page }) => {
  await page.goto('/carrito');
  await expect(page.getByRole('link', { name: /catálogo/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar solicitud' })).toHaveCount(0);
});

test('en celular el menú navega y ninguna pantalla se desborda a lo ancho', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menú' });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('navigation', { name: 'Menú principal' }).getByRole('link', { name: 'Catálogo' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');

  for (const ruta of ['/', '/catalogo', '/carrito', '/contacto', '/sobre-nosotros', '/privacidad', '/terminos']) {
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra, `desborde horizontal en ${ruta}`).toBeLessThanOrEqual(0);
  }
});

test('todo se sirve desde nuestro dominio (fuentes, texturas e imágenes)', async ({ page, baseURL }) => {
  const externos: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith(baseURL!) && !url.startsWith('data:') && !url.startsWith('blob:')) externos.push(url);
  });
  for (const ruta of ['/', '/catalogo', '/contacto']) {
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');
  }
  expect(externos).toEqual([]);
});

test('con movimiento reducido la máquina de pespunte no se anima y la costura queda completa', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.hm-head')).toBeHidden();
  const ancho = await page.locator('.hm-seam').evaluate((el) => el.getBoundingClientRect().width);
  expect(ancho).toBeGreaterThan(200);
  await context.close();
});
