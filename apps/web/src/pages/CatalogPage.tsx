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
  { id: 'marketing', label: 'Artículos publicitarios' },
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

  const handleConfigure = (product: Product) => {
    setConfiguringProduct(product)
  }

  const handleModalAdd = (product: Product, quantity: number, configuration: CartItemConfig[]) => {
    addItem(product, quantity, configuration)
    setFeedback(`${product.name} fue agregado al carrito`)
  }

  const title =
    selectedCategory === 'graduaciones'
      ? 'Graduación en modo simple'
      : 'Corporativo listo para entregar'

  const description =
    selectedCategory === 'graduaciones'
      ? 'Estolas, túnicas y birretes listos para personalizar con tus colores.'
      : 'Kits y regalos premium listos para llevar tu marca.'

  return (
    <div className="catalog-page">
      <header className="catalog-hero">
        <span className="catalog-hero__mode">
          {mode === 'graduation' ? 'Modo Graduación' : 'Modo Corporativo'}
        </span>
        <h1>Catálogo Gradumarketing</h1>
        <p>Elige la colección y suma productos a tu cotización.</p>
        <div className="catalog-tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`catalog-tabs__button ${
                selectedCategory === category.id ? 'is-active' : ''
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </header>

      {feedback && <div className="catalog-feedback">{feedback}</div>}

      <section className="catalog-section">
        <div className="catalog-section__header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <span className="catalog-section__count">
            {filteredProducts.length} producto{filteredProducts.length !== 1 && 's'}
          </span>
        </div>

        <div className="catalog-grid">
          {loading ? (
            <div className="catalog-empty">
              <h3>Cargando catálogo…</h3>
              <p>Estamos preparando tus productos.</p>
            </div>
          ) : loadError ? (
            <div className="catalog-empty">
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
            <div className="catalog-empty">
              <h3>Aún estamos preparando esta colección</h3>
              <p>Si no ves lo que buscas, escríbenos y te cotizamos rápido.</p>
              <Link to="/contacto" className="button button--accent">
                Solicitar cotización
              </Link>
            </div>
          )}
        </div>
      </section>

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
