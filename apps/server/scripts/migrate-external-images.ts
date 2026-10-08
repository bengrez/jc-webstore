// Migra a /uploads las imágenes externas (http/https) de productos antiguos, ahora que la CSP sólo
// admite imágenes de nuestro dominio. Descarga cada una (máx. 5 MB, 15 s), valida la firma binaria
// (jpg/png/webp/gif) y reemplaza la URL. Lo que no se pueda bajar queda tal cual y el admin lo marca.
//
//   npx tsx scripts/migrate-external-images.ts           # simulación: sólo informa
//   npx tsx scripts/migrate-external-images.ts --apply   # descarga y actualiza la base
//
// Usa DATABASE_URL como el resto del server (cwd = apps/server).
import 'dotenv/config'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { prisma } from '../src/lib/prisma.js'
import { detectExtension, IMAGE_EXTENSIONS } from '../src/server/lib/file-type.js'
import { isLocalImage } from '../src/server/lib/product-images.js'

const APPLY = process.argv.includes('--apply')
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')
const MAX_BYTES = 5 * 1024 * 1024

const download = async (url: string): Promise<{ ext: string; buffer: Buffer } | { error: string }> => {
  if (!/^https?:\/\//i.test(url)) return { error: 'no es una URL http(s)' }
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: 'follow' })
    if (!response.ok) return { error: `HTTP ${response.status}` }
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length > MAX_BYTES) return { error: 'supera 5 MB' }
    const ext = detectExtension(buffer)
    if (!ext || !IMAGE_EXTENSIONS.has(ext)) return { error: 'no es jpg/png/webp/gif' }
    return { ext, buffer }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

const products = await prisma.product.findMany({ select: { id: true, name: true, images: true } })
let migrated = 0
let failed = 0

for (const product of products) {
  let images: string[]
  try {
    images = JSON.parse(product.images)
  } catch {
    continue
  }
  if (!Array.isArray(images) || images.every((url) => isLocalImage(url))) continue

  const next: string[] = []
  for (const url of images) {
    if (isLocalImage(url)) {
      next.push(url)
      continue
    }
    const result = await download(url)
    if ('error' in result) {
      failed++
      console.log(`✗ ${product.id} · ${url} · ${result.error} (queda; el admin la marca)`)
      next.push(url)
      continue
    }
    const filename = `${crypto.randomBytes(16).toString('hex')}${result.ext}`
    if (APPLY) {
      await fs.mkdir(UPLOADS_DIR, { recursive: true })
      await fs.writeFile(path.join(UPLOADS_DIR, filename), result.buffer)
    }
    migrated++
    console.log(`✓ ${product.id} · ${url} → /uploads/${filename}${APPLY ? '' : ' (simulación)'}`)
    next.push(`/uploads/${filename}`)
  }

  if (APPLY) await prisma.product.update({ where: { id: product.id }, data: { images: JSON.stringify(next) } })
}

console.log(`\n${APPLY ? 'Migradas' : 'Se migrarían'}: ${migrated} · sin migrar: ${failed}`)
await prisma.$disconnect()
