import { expect, test } from '@playwright/test';

// Ajustes v8 pedidos por Benjamin: pestaña «Todos», «Nosotros» → #taller, carrito con Deshacer y Editar opciones,
// y la aguja de la cinta siguiendo el scroll del configurador.

test('el catálogo tiene la pestaña «Todos» y las líneas se pueden enlazar', async ({ page }) => {
  await page.goto('/catalogo');
  const todos = page.getByRole('button', { name: /^Todos/ });
  await expect(todos).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Estola bordada E2E' })).toBeVisible();
  const nTodos = await page.locator('.grid-cards > *').count();
  await page.getByRole('button', { name: /Publicitarios/ }).click();
  await expect(page).toHaveURL(/linea=marketing/);
  await expect(todos).toHaveAttribute('aria-pressed', 'false');
  await todos.click();
  await expect(page).not.toHaveURL(/linea=/);
  await expect(page.locator('.grid-cards > *')).toHaveCount(nTodos);

  await page.goto('/');
  await page.getByRole('link', { name: /^Ver publicitarios/ }).click();
  await expect(page).toHaveURL(/\/catalogo\?linea=marketing/);
  await expect(page.getByRole('button', { name: /Publicitarios/ })).toHaveAttribute('aria-pressed', 'true');
});

test('«Nosotros» baja a la sección #taller de la home', async ({ page }) => {
  await page.goto('/contacto');
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Nosotros' }).click();
  await expect(page).toHaveURL(/\/#taller$/);
  await expect(page.locator('#taller')).toBeInViewport();
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Nosotros' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current', 'page');
  await page.goto('/sobre-nosotros');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('en el carrito se puede deshacer un quitar y editar las opciones de un ítem', async ({ page }) => {
  await page.goto('/catalogo');
  await page.getByRole('button', { name: 'Personalizar Estola bordada E2E' }).click();
  const modal = page.getByRole('dialog', { name: 'Configurar Estola bordada E2E' });
  await modal.getByRole('button', { name: 'Azul ceremonial' }).click();
  await modal.getByPlaceholder('Ej: Texto bordado...').fill('Generación 2026');
  await modal.getByRole('button', { name: 'Agregar al carrito' }).click();
  await page.goto('/carrito');
  await expect(page.getByRole('heading', { name: 'Estola bordada E2E' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Todos|Graduación \d/ })).toHaveCount(0); // sin filtro por línea

  // Editar opciones: el configurador abre con lo elegido y guardar reemplaza el ítem
  await page.getByRole('button', { name: 'Editar opciones de Estola bordada E2E' }).click();
  const edit = page.getByRole('dialog', { name: 'Configurar Estola bordada E2E' });
  await expect(edit.getByPlaceholder('Ej: Texto bordado...')).toHaveValue('Generación 2026');
  await edit.getByPlaceholder('Ej: Texto bordado...').fill('Generación 2030');
  await edit.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(edit).toHaveCount(0);
  await expect(page.locator('.ln')).toHaveCount(1);
  await expect(page.locator('.ln')).toContainText('Generación 2030');
  await expect(page.locator('.ln')).not.toContainText('Generación 2026');

  // Quitar y Deshacer
  await page.getByRole('button', { name: 'Quitar Estola bordada E2E del carrito' }).click();
  await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
  await page.getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.locator('.ln')).toHaveCount(1);
  await expect(page.locator('.ln')).toContainText('Generación 2030');
  await expect(page.locator('.cart-count')).toHaveText('1');
});

test('con el configurador abierto la aguja sigue el scroll interno del panel', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 480 });
  await page.goto('/catalogo?producto=e2e-estola');
  const modal = page.getByRole('dialog', { name: 'Configurar Estola bordada E2E' });
  await expect(modal).toBeVisible();
  const cosido = () => page.locator('.hm-seam').evaluate((el) => el.getBoundingClientRect().width);
  await page.waitForTimeout(700);
  const antes = await cosido();
  const panel = page.locator('.dlg-cfg');
  expect(await panel.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(24);
  await panel.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect.poll(cosido, { timeout: 5000 }).toBeGreaterThan(antes + 200);
});

test('el catálogo muestra 12 productos y «Ver más» agrega el resto', async ({ page }) => {
  const base = {
    description: 'Producto de prueba',
    category: 'graduaciones',
    price: 1000,
    image: '/catalog/grad-stole-magna-1.jpg',
    images: [],
    tags: [],
    specs: [],
    personalization: '',
    leadTime: '5 días hábiles',
  };
  const products = Array.from({ length: 30 }, (_, i) => ({ ...base, id: `p-${i}`, name: `Producto ${i + 1}` }));
  await page.route('**/api/products', (route) => route.fulfill({ json: products }));
  await page.goto('/catalogo');
  await expect(page.locator('.grid-cards > *')).toHaveCount(12);
  await expect(page.getByText('Mostrando 12 de 30')).toBeVisible();
  await page.getByRole('button', { name: 'Ver más' }).click();
  await expect(page.locator('.grid-cards > *')).toHaveCount(24);
  await page.getByRole('button', { name: 'Ver más' }).click();
  await expect(page.locator('.grid-cards > *')).toHaveCount(30);
  await expect(page.getByRole('button', { name: 'Ver más' })).toHaveCount(0);
  await page.getByRole('searchbox').fill('Producto 3');
  await expect(page.getByRole('button', { name: 'Ver más' })).toHaveCount(0);
});
