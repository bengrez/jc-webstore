import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/catalog/ProductCard'
import { products } from '../data/products'
import type { Product, ProductCategory } from '../data/types'
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
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('graduaciones')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<'relevance' | 'price-asc' | 'price-desc' | 'lead-time'>(
    'relevance'
  )
  const [badgeFilters, setBadgeFilters] = useState<Array<'Top ventas' | 'Nuevo'>>([])

  const handleFilterToggle = (badge: 'Top ventas' | 'Nuevo') => {
    setBadgeFilters((current) =>
      current.includes(badge) ? current.filter((item) => item !== badge) : [...current, badge]
    )
  }

  const parseLeadTime = (leadTime?: string) => {
    if (!leadTime) return Number.POSITIVE_INFINITY
    const match = leadTime.match(/(\d+)/)
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY
  }

  const filteredProducts = useMemo(() => {
    const byCategory = products.filter((product) => product.category === selectedCategory)
    const byBadge = badgeFilters.length
      ? byCategory.filter((product) => product.badge && badgeFilters.includes(product.badge))
      : byCategory

    const sorted = [...byBadge].sort((a, b) => {
      switch (sortOption) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'lead-time':
          return parseLeadTime(a.leadTime) - parseLeadTime(b.leadTime)
        default:
          return 0
      }
    })

    return sorted
  }, [badgeFilters, selectedCategory, sortOption])

  useEffect(() => {
    const preferred = mode === 'graduation' ? 'graduaciones' : 'marketing'
    setSelectedCategory((current) => (current === preferred ? current : preferred))
  }, [mode])

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const handleAddToCart = (product: Product) => {
    addItem(product)
    setFeedback(`${product.name} fue agregado al carrito`)
  }

  const title =
    selectedCategory === 'graduaciones'
      ? 'Ceremonias memorables para cada promoción'
      : 'Merchandising que potencia tu marca'

  const description =
    selectedCategory === 'graduaciones'
      ? 'Estolas, túnicas y birretes personalizables para instituciones que buscan presencia impecable en su graduación.'
      : 'Catálogo de regalos corporativos y artículos publicitarios de alta calidad con acabados premium y cantidades flexibles.'

  return (
    <div className="catalog-page">
      <header className="catalog-hero">
        <span className="catalog-hero__mode">
          {mode === 'graduation' ? 'Modo Graduación' : 'Modo Corporativo'}
        </span>
        <h1>Catálogo Gradumarketing</h1>
        <p>
          Elige la colección que necesitas y descubre opciones listas para personalizar con tus
          colores, bordados y empaques.
        </p>
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
          <div className="catalog-controls">
            <span className="catalog-section__count">
              {filteredProducts.length} producto{filteredProducts.length !== 1 && 's'}
            </span>
            <div className="catalog-controls__row">
              <div className="catalog-filters">
                <button
                  type="button"
                  className={`catalog-pill ${badgeFilters.includes('Top ventas') ? 'is-active' : ''}`}
                  onClick={() => handleFilterToggle('Top ventas')}
                >
                  Top ventas
                </button>
                <button
                  type="button"
                  className={`catalog-pill ${badgeFilters.includes('Nuevo') ? 'is-active' : ''}`}
                  onClick={() => handleFilterToggle('Nuevo')}
                >
                  Nuevo
                </button>
              </div>
              <label className="catalog-sort">
                <span>Ordenar por</span>
                <select value={sortOption} onChange={(event) => setSortOption(event.target.value as typeof sortOption)}>
                  <option value="relevance">Relevancia</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="lead-time">Menor tiempo de entrega</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="catalog-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))
          ) : (
            <div className="catalog-empty">
              <h3>Aún estamos preparando esta colección</h3>
              <p>
                Pronto verás nuestros productos destacados. Mientras tanto, puedes solicitar una
                cotización personalizada.
              </p>
              <Link to="/contacto" className="button button--accent">
                Solicitar cotización
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default CatalogPage
