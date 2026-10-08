// La extensión se decide por el tipo detectado, nunca por el nombre que manda el cliente:
// así no se puede subir un .html o .js que después se sirva desde nuestro dominio.
const FILE_TYPES: Array<{ ext: string; matches: (buf: Buffer) => boolean }> = [
  { ext: '.jpg', matches: (buf) => buf.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) },
  {
    ext: '.png',
    matches: (buf) =>
      buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: '.gif',
    matches: (buf) => ['GIF87a', 'GIF89a'].includes(buf.subarray(0, 6).toString('latin1')),
  },
  {
    ext: '.webp',
    matches: (buf) =>
      buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
      buf.subarray(8, 12).toString('latin1') === 'WEBP',
  },
  { ext: '.pdf', matches: (buf) => buf.subarray(0, 5).toString('latin1') === '%PDF-' },
]

export const detectExtension = (buf: Buffer) => FILE_TYPES.find((type) => type.matches(buf))?.ext ?? null

export const IMAGE_EXTENSIONS = new Set(['.jpg', '.png', '.gif', '.webp'])
