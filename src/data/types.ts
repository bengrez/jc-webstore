export type ProductCategory = 'graduaciones' | 'marketing'

export type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: ProductCategory
  leadTime?: string
  availability?: 'Disponible' | 'A pedido'
  badge?: 'Nuevo' | 'Edición limitada' | 'Top ventas' | 'Personalizado'
  specs?: string[]
  personalization?: string
  minOrder?: string
  sampleEligible?: boolean
}
