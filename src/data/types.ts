export type ProductCategory = 'graduaciones' | 'marketing'

export type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: ProductCategory
  leadTime?: string
  badge?: 'Nuevo' | 'Edición limitada' | 'Top ventas'
}
