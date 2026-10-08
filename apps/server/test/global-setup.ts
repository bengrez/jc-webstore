import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Base de prueba nueva en cada corrida, con las migraciones reales.
export default function setup() {
  const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  for (const file of ['prisma/vitest.db', 'prisma/vitest.db-journal']) {
    fs.rmSync(path.join(serverDir, file), { force: true })
  }
  fs.rmSync(path.join(serverDir, 'storage/vitest'), { recursive: true, force: true })
  execSync('npx prisma migrate deploy', {
    cwd: serverDir,
    env: { ...process.env, DATABASE_URL: 'file:./vitest.db' },
    stdio: 'pipe',
  })
}
