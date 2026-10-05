import { test } from '@playwright/test';
test('hover graduation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.hover('.mode-landing__card--graduation');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/hover-graduation.png' });
});
test('hover corporate', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.hover('.mode-landing__card--corporate');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/hover-corporate.png' });
});
