import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { env } from '../../lib/env.js'

export const getQuotesStorageDir = () => path.resolve(process.cwd(), env.QUOTES_STORAGE_DIR)

// rev 0 = primera emisión sin sufijo; después -rev1, -rev2…
export const revisionFileName = (folio: string, rev: number) =>
  rev === 0 ? `${folio}.pdf` : `${folio}-rev${rev}.pdf`

// Primera revisión >= `from` cuyo archivo no existe todavía.
export const nextFreeRev = async (folio: string, from: number) => {
  let rev = from
  while (await fileExists(path.join(getQuotesStorageDir(), revisionFileName(folio, rev)))) rev++
  return rev
}

const fileExists = (fullPath: string) =>
  fs.access(fullPath).then(
    () => true,
    () => false
  )

export const sha256Hex = (buffer: Buffer) => crypto.createHash('sha256').update(buffer).digest('hex')

export class RevisionFileExistsError extends Error {
  constructor(fileName: string) {
    super(`El archivo ${fileName} ya existe; no se sobrescribe.`)
  }
}

// Escribe el PDF de una revisión. Nunca sobrescribe: falla si el archivo ya existe.
export const writeRevisionPdf = async (fileName: string, buffer: Buffer) => {
  const dir = getQuotesStorageDir()
  await fs.mkdir(dir, { recursive: true })
  const fullPath = path.join(dir, fileName)
  try {
    await fs.writeFile(fullPath, buffer, { flag: 'wx' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new RevisionFileExistsError(fileName)
    throw error
  }
  return fullPath
}

export const removeRevisionPdf = async (fileName: string) => {
  await fs.rm(path.join(getQuotesStorageDir(), fileName), { force: true })
}

// Resuelve un nombre guardado en la DB a una ruta dentro de la carpeta de almacenamiento.
export const resolveRevisionPath = (fileName: string) => {
  const dir = getQuotesStorageDir()
  const fullPath = path.resolve(dir, fileName)
  if (path.dirname(fullPath) !== dir) return null
  return fullPath
}
