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

  const filteredProducts = useMemo(
    () => products.filter((product) => product.category === selectedCategory),
    [selectedCategory]
  )

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
          <span className="catalog-section__count">
            {filteredProducts.length} producto{filteredProducts.length !== 1 && 's'}
          </span>
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
