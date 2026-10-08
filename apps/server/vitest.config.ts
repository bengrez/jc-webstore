import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const serverDir = path.dirname(fileURLToPath(import.meta.url))

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
      // Absoluta: no depende del cwd desde el que se corra vitest
      QUOTES_STORAGE_DIR: path.join(serverDir, 'storage/vitest/quotes'),
      UPLOADS_DIR: path.join(serverDir, 'storage/vitest/uploads'),
      MAIL_TRANSPORT: 'smtp',
      SMTP_USER: 'taller@example.com',
      SMTP_PASS: 'app-password-de-prueba',
      SMTP_FROM: 'Confecciones Juany Reyes <taller@example.com>',
      QUOTES_TO_EMAIL: 'taller@example.com',
    },
  },
})
