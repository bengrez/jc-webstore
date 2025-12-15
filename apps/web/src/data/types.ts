export type ProductCategory = 'graduaciones' | 'marketing'

export type ProductAvailability = 'Disponible' | 'A pedido'

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
}
