import type { Product, ProductAvailability } from '@prisma/client'
import { parseStringArrayJson } from './json.js'

export const formatAvailabilityLabel = (availability: ProductAvailability) => {
  return availability === 'DISPONIBLE' ? 'Disponible' : 'A pedido'
}

export const availabilityLabelToEnum = (label: string): ProductAvailability | null => {
  if (label === 'Disponible') return 'DISPONIBLE'
  if (label === 'A pedido') return 'A_PEDIDO'
  return null
}

export const productToPublicResponse = (product: Product) => {
  const images = parseStringArrayJson(product.images)

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    image: images[0] ?? '',
    images,
    tags: parseStringArrayJson(product.tags),
    specs: parseStringArrayJson(product.specs),
    personalization: product.personalization,
    minOrder: product.minOrder,
    leadTime: product.leadTime,
    availability: formatAvailabilityLabel(product.availability),
    badge: product.badge,
    sampleEligible: product.sampleEligible,
  }
}

export const productToAdminResponse = (product: Product) => {
  const images = parseStringArrayJson(product.images)

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    images,
    tags: parseStringArrayJson(product.tags),
    specs: parseStringArrayJson(product.specs),
    personalization: product.personalization,
    minOrder: product.minOrder,
    leadTime: product.leadTime,
    availability: formatAvailabilityLabel(product.availability),
    badge: product.badge,
    sampleEligible: product.sampleEligible,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}
