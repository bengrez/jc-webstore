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

  // Búsqueda y filtro por tag (PR #7): los tags ya venían en el modelo y no se mostraban.
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

  useEffect(() => {
    document.documentElement.dataset.catalogCategory = selectedCategory
    return () => {
      delete document.documentElement.dataset.catalogCategory
    }
  }, [selectedCategory])

  // El modo es la única fuente de verdad: cambiar de tab también cambia el modo (PR #7).
  const handleSelectCategory = (category: ProductCategory) => {
    setSelectedCategory(category)
    setMode(category === 'graduaciones' ? 'graduation' : 'corporate')
  }

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
              onClick={() => handleSelectCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
          <span className="catalog__count">
            {filteredProducts.length} producto{filteredProducts.length !== 1 && 's'}
          </span>
        </div>
      </header>

      <div className="catalog__filters">
        <input
          type="search"
          className="catalog__search"
          placeholder="Buscar por nombre, descripción o tag…"
          aria-label="Buscar productos"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {availableTags.length > 0 && (
          <div className="catalog__tags" role="group" aria-label="Filtrar por tag">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="catalog__tag"
                aria-pressed={activeTag === tag}
                onClick={() => setActiveTag((current) => (current === tag ? null : tag))}
              >
                {tag}
              </button>
            ))}
            {hasActiveFilters && (
              <button type="button" className="catalog__clear" onClick={clearFilters}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

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
        ) : hasActiveFilters ? (
          <div className="catalog__empty">
            <h3>Sin resultados para tu búsqueda</h3>
            <p>Prueba con otro término o quita los filtros para ver toda la colección.</p>
            <button type="button" className="button button--primary" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
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
