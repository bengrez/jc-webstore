import { test } from '@playwright/test';
test('modal screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/catalogo');
  await page.waitForLoadState('networkidle');
  await page.click('.product-card');
  await page.waitForSelector('.pcm-modal');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/modal-open.png' });
});
