// Reglas del formulario de producto del admin. Las usan el servidor (al guardar) y el formulario
// web (antes de enviar), así que no importan nada: el web lo importa por ruta relativa.
// Los mensajes están en español simple porque los lee quien carga los artículos.

export const PRODUCT_CATEGORIES = ['graduaciones', 'marketing'] as const
export const PRODUCT_AVAILABILITIES = ['Disponible', 'A pedido'] as const

// Las imágenes de producto se sirven sólo desde nuestro dominio (CSP `img-src 'self' data:`):
// subidas por el admin (/uploads), catálogo demo (/catalog) o marca (/brand). Nada de URLs externas.
export const LOCAL_IMAGE_PATTERN = /^\/(uploads|catalog|brand)\/[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp|gif)$/i

export const LOCAL_IMAGE_MESSAGE =
  'Las imágenes deben subirse desde el admin. Quita las imágenes externas (URLs de otros sitios).'

export type ProductField =
  | 'name'
  | 'description'
  | 'category'
  | 'price'
  | 'images'
  | 'tags'
  | 'specs'
  | 'personalization'
  | 'minOrder'
  | 'leadTime'
  | 'availability'
  | 'badge'
  | 'stockNote'

export type ProductFieldErrors = Partial<Record<ProductField, string>>

// Orden en que aparecen en el formulario: sirve para enfocar el primero con error
export const PRODUCT_FIELD_ORDER: ProductField[] = [
  'name',
  'category',
  'description',
  'price',
  'availability',
  'leadTime',
  'minOrder',
  'images',
  'tags',
  'specs',
  'personalization',
  'badge',
  'stockNote',
]

export const PRODUCT_FIELD_LABELS: Record<ProductField, string> = {
  name: 'Nombre',
  description: 'Descripción',
  category: 'Categoría',
  price: 'Precio',
  images: 'Foto',
  tags: 'Etiquetas',
  specs: 'Características',
  personalization: 'Personalización',
  minOrder: 'Pedido mínimo',
  leadTime: 'Tiempo de entrega',
  availability: 'Disponibilidad',
  badge: 'Distintivo',
  stockNote: 'Nota de stock',
}

export const PRODUCT_MESSAGES = {
  name: 'Escribe el nombre del producto.',
  description: 'Escribe una descripción del producto.',
  category: 'Elige una categoría: Graduaciones o Marketing.',
  priceMissing: 'Escribe el precio en pesos (un número mayor a 0).',
  priceFormat: 'El precio va en pesos, sin puntos ni decimales (por ejemplo: 15990).',
  imagesMissing: 'Sube al menos una foto del producto.',
  imagesExternal: LOCAL_IMAGE_MESSAGE,
  tags: 'Escribe al menos una etiqueta (una por línea).',
  specs: 'Escribe al menos una característica (una por línea).',
  personalization: 'Cuenta qué se puede personalizar (por ejemplo: bordado de nombre y año).',
  minOrder: 'Escribe el pedido mínimo (por ejemplo: Mínimo 50 unidades).',
  leadTime: 'Escribe el tiempo de entrega (por ejemplo: 7–10 días hábiles).',
  availability: 'Elige si el producto está disponible o a pedido.',
  optionalEmpty: 'Escribe un texto o deja el campo vacío.',
  fallback: 'Revisa este dato.',
} as const

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isTextList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every(isText)

// Devuelve un mensaje por cada campo que falta o está mal; objeto vacío = se puede guardar.
export const validateProductInput = (input: unknown): ProductFieldErrors => {
  const data = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>
  const errors: ProductFieldErrors = {}

  if (!isText(data.name)) errors.name = PRODUCT_MESSAGES.name
  if (!isText(data.description)) errors.description = PRODUCT_MESSAGES.description
  if (!(PRODUCT_CATEGORIES as readonly unknown[]).includes(data.category)) errors.category = PRODUCT_MESSAGES.category

  if (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price <= 0) {
    errors.price = PRODUCT_MESSAGES.priceMissing
  } else if (!Number.isInteger(data.price)) {
    errors.price = PRODUCT_MESSAGES.priceFormat
  }

  if (!Array.isArray(data.images) || data.images.length === 0) {
    errors.images = PRODUCT_MESSAGES.imagesMissing
  } else if (!data.images.every((url) => typeof url === 'string' && LOCAL_IMAGE_PATTERN.test(url.trim()))) {
    errors.images = PRODUCT_MESSAGES.imagesExternal
  }

  if (!isTextList(data.tags)) errors.tags = PRODUCT_MESSAGES.tags
  if (!isTextList(data.specs)) errors.specs = PRODUCT_MESSAGES.specs
  if (!isText(data.personalization)) errors.personalization = PRODUCT_MESSAGES.personalization
  if (!isText(data.minOrder)) errors.minOrder = PRODUCT_MESSAGES.minOrder
  if (!isText(data.leadTime)) errors.leadTime = PRODUCT_MESSAGES.leadTime
  if (!(PRODUCT_AVAILABILITIES as readonly unknown[]).includes(data.availability)) {
    errors.availability = PRODUCT_MESSAGES.availability
  }

  // Opcionales: ausentes o null valen; un texto en blanco no
  for (const field of ['badge', 'stockNote'] as const) {
    const value = data[field]
    if (value !== undefined && value !== null && !isText(value)) errors[field] = PRODUCT_MESSAGES.optionalEmpty
  }

  return errors
}
