import { LOCAL_IMAGE_PATTERN } from '../../shared/product-rules.js'

// Las imágenes de producto se sirven sólo desde nuestro dominio (reglas en shared/product-rules.ts)
export { LOCAL_IMAGE_MESSAGE, LOCAL_IMAGE_PATTERN } from '../../shared/product-rules.js'

// Imagen de reemplazo cuando un producto antiguo sólo tiene imágenes externas
export const FALLBACK_PRODUCT_IMAGE = '/brand/logo.jpeg'

export const isLocalImage = (url: string) => LOCAL_IMAGE_PATTERN.test(url)

export const localImagesOrFallback = (images: string[]) => {
  const local = images.filter(isLocalImage)
  return local.length > 0 ? local : [FALLBACK_PRODUCT_IMAGE]
}
