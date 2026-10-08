// Las imágenes de producto se sirven sólo desde nuestro dominio (CSP `img-src 'self' data:`):
// subidas por el admin (/uploads), catálogo demo (/catalog) o marca (/brand). Nada de URLs externas.
export const LOCAL_IMAGE_PATTERN = /^\/(uploads|catalog|brand)\/[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp|gif)$/i

export const LOCAL_IMAGE_MESSAGE =
  'Las imágenes deben subirse desde el admin. Quita las imágenes externas (URLs de otros sitios).'

// Imagen de reemplazo cuando un producto antiguo sólo tiene imágenes externas
export const FALLBACK_PRODUCT_IMAGE = '/brand/logo.jpeg'

export const isLocalImage = (url: string) => LOCAL_IMAGE_PATTERN.test(url)

export const localImagesOrFallback = (images: string[]) => {
  const local = images.filter(isLocalImage)
  return local.length > 0 ? local : [FALLBACK_PRODUCT_IMAGE]
}
