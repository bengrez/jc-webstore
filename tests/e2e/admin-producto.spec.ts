import { expect, test, type Page } from '@playwright/test';

// Mismos valores que el webServer de playwright.config.ts
const ADMIN = { email: 'admin@e2e.test', password: 'clave-e2e-123' };
// PNG de 1×1 px: el servidor reconoce el tipo por la firma binaria, no por el nombre
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const loginAdmin = async (page: Page) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Contraseña').fill(ADMIN.password);
  await page.getByRole('button', { name: /ingresar|entrar|iniciar/i }).click();
  await expect(page).toHaveURL(/\/admin\/(products|quotes)/);
};

const openNewProduct = async (page: Page) => {
  await page.goto('/admin/products');
  await page.getByRole('button', { name: 'Nuevo producto' }).click();
  await expect(page.getByRole('heading', { name: 'Crear producto' })).toBeVisible();
};

// Todo menos la foto
const fillWithoutPhoto = async (page: Page, name: string) => {
  await page.getByLabel('Nombre', { exact: true }).fill(name);
  await page.getByLabel('Descripción').fill('Polera de algodón con estampado.');
  await page.getByLabel(/Precio/).fill('12990');
  await page.getByLabel('Tiempo de entrega').fill('7–10 días hábiles');
  await page.getByLabel(/Pedido mínimo/).fill('Mínimo 10 unidades');
  await page.getByLabel(/Etiquetas/).fill('polera');
  await page.getByLabel(/Características/).fill('Algodón');
  await page.getByLabel('Personalización', { exact: true }).fill('Estampado de logo');
};

const uploadPhoto = async (page: Page) => {
  await page.locator('input[type=file]').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG_1PX });
  await expect(page.locator('.admin-image-row')).toHaveCount(1);
};

test('sin foto el formulario no envía y explica qué falta; con la foto se crea', async ({ page }) => {
  await loginAdmin(page);
  await openNewProduct(page);
  const posts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/admin/products')) posts.push(request.url());
  });

  await fillWithoutPhoto(page, 'Polera sin foto E2E');
  await page.getByRole('button', { name: 'Crear producto' }).click();

  // Se marca la foto, se explica en palabras simples, se enfoca el campo y no se llama al servidor
  await expect(page.getByText('Sube al menos una foto del producto.')).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'No se guardó: revisa Foto.' })).toBeVisible();
  await expect(page.locator('#prod-images')).toBeFocused();
  expect(posts).toHaveLength(0);
  // Lo que sí está bien no se marca
  await expect(page.getByLabel('Nombre', { exact: true })).not.toHaveAttribute('aria-invalid', 'true');

  // Al subir la foto el aviso desaparece y ya se puede crear
  await uploadPhoto(page);
  await expect(page.getByText('Sube al menos una foto del producto.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await expect(page.getByText('Producto creado.')).toBeVisible();
  expect(posts).toHaveLength(1);
});

test('con el formulario vacío cada campo dice qué falta', async ({ page }) => {
  await loginAdmin(page);
  await openNewProduct(page);
  await page.getByRole('button', { name: 'Crear producto' }).click();

  for (const message of [
    'Escribe el nombre del producto.',
    'Escribe una descripción del producto.',
    'Escribe el precio en pesos (un número mayor a 0).',
    'Escribe el tiempo de entrega (por ejemplo: 7–10 días hábiles).',
    'Escribe el pedido mínimo (por ejemplo: Mínimo 50 unidades).',
    'Sube al menos una foto del producto.',
    'Escribe al menos una etiqueta (una por línea).',
    'Escribe al menos una característica (una por línea).',
    'Cuenta qué se puede personalizar (por ejemplo: bordado de nombre y año).',
  ]) {
    await expect(page.getByText(message)).toBeVisible();
  }
  await expect(page.getByLabel('Nombre', { exact: true })).toBeFocused();

  // Un precio con puntos o decimales explica cómo escribirlo
  await page.getByLabel(/Precio/).fill('15.5');
  await expect(page.getByText('El precio va en pesos, sin puntos ni decimales (por ejemplo: 15990).')).toBeVisible();
});

test('si el servidor rechaza, se muestra el motivo en el campo y nunca un error genérico', async ({ page }) => {
  await loginAdmin(page);
  await openNewProduct(page);
  await fillWithoutPhoto(page, 'Polera rechazada E2E');
  await uploadPhoto(page);

  // 400 con un motivo por campo
  await page.route('**/api/admin/products', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'validation_error',
        message: 'Revisa estos datos: Nombre.',
        fieldErrors: { name: 'Este nombre no sirve según el servidor.' },
      }),
    });
  });
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await expect(page.getByText('Este nombre no sirve según el servidor.')).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'No se guardó: revisa Nombre.' })).toBeVisible();
  await expect(page.getByLabel('Nombre', { exact: true })).toBeFocused();
  await expect(page.getByText('Revisa los campos requeridos.')).toHaveCount(0);

  // Falla sin detalle (500): tampoco es un error genérico mudo
  await page.unroute('**/api/admin/products');
  await page.route('**/api/admin/products', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await expect(page.getByText(/No se pudo guardar el producto por un problema del servidor/)).toBeVisible();
});
