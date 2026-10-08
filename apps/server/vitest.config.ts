import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    // Todos los archivos comparten una sola base SQLite de prueba
    fileParallelism: false,
    testTimeout: 20_000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-de-al-menos-treinta-y-dos-caracteres',
      // Relativo a prisma/schema.prisma; *.db está en .gitignore
      DATABASE_URL: 'file:./vitest.db',
      PUBLIC_SITE_URL: 'https://tienda.test',
      QUOTES_STORAGE_DIR: 'storage/vitest/quotes',
      MAIL_TRANSPORT: 'smtp',
      SMTP_USER: 'taller@example.com',
      SMTP_PASS: 'app-password-de-prueba',
      SMTP_FROM: 'Confecciones Juany Reyes <taller@example.com>',
      QUOTES_TO_EMAIL: 'taller@example.com',
    },
  },
})
