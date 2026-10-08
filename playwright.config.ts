import { defineConfig, devices } from '@playwright/test';

// Puertos propios para no chocar con un `npm run dev` (5173/3001), con el staging (3101) ni reutilizar su base.
const E2E_API_PORT = 3201;
const E2E_WEB_PORT = 5274;
const E2E_WEB_URL = `http://localhost:${E2E_WEB_PORT}`;


/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Specs e2e con servidores propios (ver webServer)
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: E2E_WEB_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Server con SQLite y correo simulado propios (MAIL_TRANSPORT=outbox) + Vite apuntando a él */
  webServer: [
    {
      command: 'bash apps/server/scripts/e2e-server.sh',
      url: `http://localhost:${E2E_API_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NODE_ENV: 'test',
        PORT: String(E2E_API_PORT),
        DATABASE_URL: 'file:./e2e.db',
        JWT_SECRET: 'e2e-secret-de-al-menos-treinta-y-dos-caracteres',
        ADMIN_EMAIL: 'admin@e2e.test',
        ADMIN_PASSWORD: 'clave-e2e-123',
        PUBLIC_SITE_URL: E2E_WEB_URL,
        QUOTES_STORAGE_DIR: 'storage/e2e/quotes',
        MAIL_TRANSPORT: 'outbox',
        MAIL_OUTBOX_DIR: 'storage/e2e/outbox',
        UPLOADS_DIR: 'storage/e2e/uploads',
        SMTP_FROM: 'Confecciones Juany Reyes <taller@e2e.test>',
        QUOTES_TO_EMAIL: 'taller@e2e.test',
      },
    },
    {
      command: `npm -w @confeccionesjuany/web run dev -- --port ${E2E_WEB_PORT} --strictPort`,
      url: E2E_WEB_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { API_PROXY_TARGET: `http://localhost:${E2E_API_PORT}` },
    },
  ],
});
