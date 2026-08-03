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
  const { mode, setMode } = useThemeMode()
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('graduaciones')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const categoryProducts = useMemo(
    () => products.filter((product) => product.category === selectedCategory),
    [products, selectedCategory]
  )

  // Los tags ya venían en el modelo pero no se mostraban en ninguna parte.
  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    categoryProducts.forEach((product) => product.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort((a, b) => a.localeCompare(b, 'es'))
  }, [categoryProducts])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    return categoryProducts.filter((product) => {
      if (activeTag && !product.tags.includes(activeTag)) return false
      if (!term) return true
      return (
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.tags.some((tag) => tag.toLowerCase().includes(term))
      )
    })
  }, [categoryProducts, activeTag, search])

  const hasActiveFilters = search.trim().length > 0 || activeTag !== null

  const clearFilters = () => {
    setSearch('')
    setActiveTag(null)
  }

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

  // Al cambiar de colección el tag activo pertenece a la anterior.
  useEffect(() => {
    setActiveTag(null)
  }, [selectedCategory])

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  // Los tabs y el switch del header controlaban lo mismo por caminos distintos:
  // cambiar el modo reordenaba los tabs, pero cambiar de tab dejaba el modo
  // desincronizado. El modo es ahora la única fuente de verdad.
  const handleSelectCategory = (category: ProductCategory) => {
    setSelectedCategory(category)
    setMode(category === 'graduaciones' ? 'graduation' : 'corporate')
  }

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
        <h1>Catálogo Confecciones Juany</h1>
        <p>Elige la colección y suma productos a tu cotización.</p>
        <div className="catalog-tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`catalog-tabs__button ${
                selectedCategory === category.id ? 'is-active' : ''
              }`}
              onClick={() => handleSelectCategory(category.id)}
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

        <div className="catalog-filters">
          <input
            type="search"
            className="catalog-filters__search"
            placeholder="Buscar por nombre, descripción o tag…"
            aria-label="Buscar productos"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {availableTags.length > 0 && (
            <div className="catalog-filters__tags" role="group" aria-label="Filtrar por tag">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="catalog-filters__tag"
                  aria-pressed={activeTag === tag}
                  onClick={() => setActiveTag((current) => (current === tag ? null : tag))}
                >
                  {tag}
                </button>
              ))}
              {hasActiveFilters && (
                <button
                  type="button"
                  className="catalog-filters__clear"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
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
          ) : hasActiveFilters ? (
            <div className="catalog-empty">
              <h3>Sin resultados para tu búsqueda</h3>
              <p>Prueba con otro término o quita los filtros para ver toda la colección.</p>
              <button type="button" className="button button--primary" onClick={clearFilters}>
                Limpiar filtros
              </button>
            </div>
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
