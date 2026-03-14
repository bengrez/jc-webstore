export type ProductCategory = 'graduaciones' | 'marketing'

export type ProductAvailability = 'Disponible' | 'A pedido'

export type ProductOptionType = 'COLOR' | 'TEXT' | 'FILE'

export type ProductOptionChoice = { label: string; value: string }

export type ProductOption = {
  id: number
  type: ProductOptionType
  label: string
  required: boolean
  choices: ProductOptionChoice[]
  sortOrder: number
}

export type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  images: string[]
  category: ProductCategory
  leadTime: string
  availability: ProductAvailability
  badge?: string | null
  tags: string[]
  specs: string[]
  personalization: string
  minOrder: string
  sampleEligible: boolean
  options: ProductOption[]
}
