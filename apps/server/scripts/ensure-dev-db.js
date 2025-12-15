import fs from 'node:fs'
import path from 'node:path'

const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')

if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  fs.closeSync(fs.openSync(dbPath, 'a'))
  console.log(`[db] created ${dbPath}`)
}
