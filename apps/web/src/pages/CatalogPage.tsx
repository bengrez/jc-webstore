import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/catalog/ProductCard'
import ProductConfiguratorModal from '../components/catalog/ProductConfiguratorModal'
import type { Product, ProductCategory } from '../data/types'
import type { CartItemConfig } from '../context/CartContext'
import { useCart } from '../context/CartContext'
import { useThemeMode } from '../context/ThemeContext'
import './catalog.css'

const categories: Array<{ id: ProductCategory; label: string }> = [
  { id: 'graduaciones', label: 'Graduaciones' },
  { id: 'marketing', label: 'Corporativo' },
]

const CatalogPage = () => {
  const { mode } = useThemeMode()
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('graduaciones')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)

  const filteredProducts = useMemo(
    () => products.filter((product) => product.category === selectedCategory),
    [products, selectedCategory]
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)

    fetch('/api/products')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('No fue posible cargar el catálogo.')
        }
        return (await response.json()) as Product[]
      })
      .then((data) => {
        if (cancelled) return
        setProducts(data)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(error instanceof Error ? error.message : 'No fue posible cargar el catálogo.')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const preferred = mode === 'graduation' ? 'graduaciones' : 'marketing'
    setSelectedCategory((current) => (current === preferred ? current : preferred))
  }, [mode])

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  useEffect(() => {
    document.documentElement.dataset.catalogCategory = selectedCategory
    return () => {
      delete document.documentElement.dataset.catalogCategory
    }
  }, [selectedCategory])

  const handleConfigure = (product: Product) => {
    setConfiguringProduct(product)
  }

  const handleModalAdd = (product: Product, quantity: number, configuration: CartItemConfig[]) => {
    addItem(product, quantity, configuration)
    setFeedback(`${product.name} agregado al carrito`)
  }

  return (
    <div className="catalog">
      <header className="catalog__header">
        <h1>Catálogo</h1>
        <div className="catalog__tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`catalog__tab ${selectedCategory === category.id ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
          <span className="catalog__count">
            {filteredProducts.length} producto{filteredProducts.length !== 1 && 's'}
          </span>
        </div>
      </header>

      {feedback && <div className="catalog__feedback">{feedback}</div>}

      <div className="catalog__grid">
        {loading ? (
          <div className="catalog__empty">
            <p>Cargando catálogo...</p>
          </div>
        ) : loadError ? (
          <div className="catalog__empty">
            <h3>No pudimos cargar el catálogo</h3>
            <p>{loadError}</p>
            <Link to="/contacto" className="button button--accent">
              Solicitar cotización
            </Link>
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onConfigure={handleConfigure} />
          ))
        ) : (
          <div className="catalog__empty">
            <h3>Colección en preparación</h3>
            <p>Escríbenos y te cotizamos rápido.</p>
            <Link to="/contacto" className="button button--accent">
              Solicitar cotización
            </Link>
          </div>
        )}
      </div>

      {configuringProduct && (
        <ProductConfiguratorModal
          product={configuringProduct}
          onClose={() => setConfiguringProduct(null)}
          onAdd={handleModalAdd}
        />
      )}
    </div>
  )
}

export default CatalogPage
