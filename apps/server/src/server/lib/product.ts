import type { Product, ProductAvailability, ProductOption } from '@prisma/client'
import { parseStringArrayJson } from './json.js'

type ProductOptionChoice = { label: string; value: string }

const parseOptionChoices = (choices: string): ProductOptionChoice[] => {
  try {
    const parsed = JSON.parse(choices)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const serializeOptions = (options: ProductOption[]) =>
  options.map((opt) => ({
    id: opt.id,
    type: opt.type,
    label: opt.label,
    required: opt.required,
    choices: parseOptionChoices(opt.choices),
    sortOrder: opt.sortOrder,
  }))

export const formatAvailabilityLabel = (availability: ProductAvailability) => {
  return availability === 'DISPONIBLE' ? 'Disponible' : 'A pedido'
}

export const availabilityLabelToEnum = (label: string): ProductAvailability | null => {
  if (label === 'Disponible') return 'DISPONIBLE'
  if (label === 'A pedido') return 'A_PEDIDO'
  return null
}

export const productToPublicResponse = (
  product: Product & { options?: ProductOption[] }
) => {
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
    options: serializeOptions(product.options ?? []),
  }
}

export const productToAdminResponse = (
  product: Product & { options?: ProductOption[] }
) => {
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
    options: serializeOptions(product.options ?? []),
  }
}
