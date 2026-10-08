import { describe, expect, it } from 'vitest'
import { FALLBACK_PRODUCT_IMAGE, isLocalImage, localImagesOrFallback } from '../src/server/lib/product-images.js'

describe('isLocalImage', () => {
  it('acepta imágenes subidas, del catálogo y de la marca', () => {
    expect(isLocalImage('/uploads/3f9a1c2b.png')).toBe(true)
    expect(isLocalImage('/catalog/grad-stole-magna-1.jpg')).toBe(true)
    expect(isLocalImage('/brand/logo.jpeg')).toBe(true)
  })

  it('rechaza URLs externas, rutas raras y archivos que no son imagen', () => {
    for (const url of [
      'https://images.unsplash.com/photo-1.jpg',
      '//evil.example/x.png',
      '/uploads/../server/.env',
      '/uploads/sub/x.png',
      '/uploads/doc.pdf',
      '/otra/x.png',
      'data:image/png;base64,AAAA',
    ]) {
      expect(isLocalImage(url), url).toBe(false)
    }
  })
})

describe('localImagesOrFallback', () => {
  it('quita las externas y usa la imagen de marca si no queda ninguna', () => {
    expect(localImagesOrFallback(['https://x.test/a.jpg', '/uploads/a.png'])).toEqual(['/uploads/a.png'])
    expect(localImagesOrFallback(['https://x.test/a.jpg'])).toEqual([FALLBACK_PRODUCT_IMAGE])
  })
})
