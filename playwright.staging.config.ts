import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Smoke del staging ya levantado (scripts/staging.sh): no arranca servidores. Lee las mismas variables
// que el server (puerto, admin, carpetas) desde apps/server/.env.staging o STAGING_ENV_FILE.
// Uso: npm run test:staging   (STAGING_URL=https://… para probar a través de la tailnet)
const envFile = process.env.STAGING_ENV_FILE ?? path.resolve(__dirname, 'apps/server/.env.staging');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  testDir: './tests/staging',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  timeout: 90_000,
  use: {
    baseURL: process.env.STAGING_URL ?? `http://${process.env.HOST ?? 'localhost'}:${process.env.PORT ?? 3101}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
