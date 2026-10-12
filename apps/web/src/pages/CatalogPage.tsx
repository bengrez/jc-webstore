import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/catalog/ProductCard'
import ProductConfiguratorModal from '../components/catalog/ProductConfiguratorModal'
import type { Product, ProductCategory } from '../data/types'
import type { CartItemConfig } from '../context/CartContext'
import { useCart } from '../context/CartContext'
import { useThemeMode } from '../context/ThemeContext'
import '../design/pages/catalog.css'

const categories: Array<{ id: ProductCategory; label: string; mode: 'graduation' | 'corporate' }> = [
  { id: 'graduaciones', label: 'Graduación', mode: 'graduation' },
  { id: 'marketing', label: 'Publicitarios', mode: 'corporate' },
]

type Sort = 'feat' | 'asc' | 'desc' | 'fast'

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

// Primer número del plazo ("5 a 7 días hábiles" → 5); sin número va al final
const leadDays = (leadTime: string) => {
  const match = leadTime.match(/\d+/)
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY
}

const CatalogPage = () => {
  const { mode, setMode } = useThemeMode()
  const { addItem } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('feat')
  const [added, setAdded] = useState<string | null>(null)
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)

  const selectedCategory: ProductCategory = mode === 'graduation' ? 'graduaciones' : 'marketing'
  const productParam = searchParams.get('producto')

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

  // /catalogo?producto=<id> abre el configurador de ese producto una vez cargados los datos
  useEffect(() => {
    if (!productParam || products.length === 0) return
    const target = products.find((product) => product.id === productParam)
    if (target) {
      setConfiguringProduct(target)
      setMode(target.category === 'graduaciones' ? 'graduation' : 'corporate')
    }
  }, [productParam, products, setMode])

  useEffect(() => {
    if (!added) return
    const timeout = window.setTimeout(() => setAdded(null), 6000)
    return () => window.clearTimeout(timeout)
  }, [added])

  useEffect(() => {
    document.documentElement.dataset.catalogCategory = selectedCategory
    return () => {
      delete document.documentElement.dataset.catalogCategory
    }
  }, [selectedCategory])

  const counts = useMemo(
    () => ({
      graduaciones: products.filter((product) => product.category === 'graduaciones').length,
      marketing: products.filter((product) => product.category === 'marketing').length,
    }),
    [products]
  )

  const trimmedQuery = query.trim()

  const visible = useMemo(() => {
    const needle = normalize(trimmedQuery)
    const list = products.filter((product) => {
      if (product.category !== selectedCategory) return false
      if (!needle) return true
      const haystack = normalize([product.name, product.description, ...(product.tags ?? [])].join(' '))
      return haystack.includes(needle)
    })
    if (sort === 'asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'desc') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'fast') return [...list].sort((a, b) => leadDays(a.leadTime) - leadDays(b.leadTime))
    return list
  }, [products, selectedCategory, trimmedQuery, sort])

  const closeConfigurator = () => {
    setConfiguringProduct(null)
    if (searchParams.has('producto')) {
      const next = new URLSearchParams(searchParams)
      next.delete('producto')
      setSearchParams(next, { replace: true })
    }
  }

  const handleModalAdd = (product: Product, quantity: number, configuration: CartItemConfig[]) => {
    addItem(product, quantity, configuration)
    setAdded(`${product.name} agregado al carrito`)
  }

  const categoryLabel = selectedCategory === 'graduaciones' ? 'Graduación' : 'Publicitarios'
  const resultText = loading
    ? 'Cargando productos…'
    : trimmedQuery
      ? `${visible.length} ${visible.length === 1 ? 'resultado' : 'resultados'} para “${trimmedQuery}” en ${categoryLabel}`
      : `${visible.length} ${visible.length === 1 ? 'producto' : 'productos'} en ${categoryLabel}`

  const clearAll = () => {
    setQuery('')
    setSort('feat')
  }

  return (
    <>
      <div className="wrap" style={{ paddingTop: 'clamp(28px,4vw,48px)' }}>
        <h1 className="t-h1">Catálogo</h1>
        <p className="t-lead" style={{ marginTop: 12, maxWidth: '44em' }}>
          Elige un producto, personalízalo y agrégalo al carrito para pedir tu cotización. Los precios son “desde” y no
          incluyen IVA.
        </p>
      </div>
      <section
        className="wrap"
        style={{ paddingTop: 28, paddingBottom: 'clamp(48px,6vw,80px)' }}
        aria-label="Productos"
      >
        <div className="tools">
          <div className="flts flts-line" role="group" aria-label="Filtrar por línea">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="flt"
                aria-pressed={selectedCategory === category.id}
                onClick={() => setMode(category.mode)}
              >
                {category.label}
                <span className="flt-n">{loading ? '' : counts[category.id]}</span>
              </button>
            ))}
          </div>
          <div className="tools-r">
            <div className="search">
              <label className="vh" htmlFor="q">
                Buscar productos
              </label>
              <svg className="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4.5 4.5" />
              </svg>
              <input
                id="q"
                className="input"
                type="search"
                placeholder="Buscar producto"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="sel">
              <label className="vh" htmlFor="sort">
                Ordenar por
              </label>
              <select id="sort" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
                <option value="feat">Destacados</option>
                <option value="asc">Menor precio</option>
                <option value="desc">Mayor precio</option>
                <option value="fast">Entrega más rápida</option>
              </select>
              <svg className="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="resbar" role="status" aria-live="polite">
          <p className="t-small c-ink2">{resultText}</p>
          {trimmedQuery && (
            <button type="button" className="btn-text" onClick={() => setQuery('')}>
              Limpiar búsqueda
            </button>
          )}
        </div>

        {loadError ? (
          <div className="empty" role="alert">
            <h2 className="t-h3">No pudimos cargar el catálogo</h2>
            <p className="t-body c-ink2">{loadError}</p>
            <Link to="/contacto" className="btn btn-primary">
              Solicitar cotización
            </Link>
          </div>
        ) : loading ? null : visible.length > 0 ? (
          <div className="grid-cards">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} onConfigure={setConfiguringProduct} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <span className="ic-big">
              <svg className="ic" width="40" height="40" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4.5 4.5" />
              </svg>
            </span>
            <h2 className="t-h3">
              {trimmedQuery ? `No encontramos productos para “${trimmedQuery}”` : 'Colección en preparación'}
            </h2>
            <p className="t-body c-ink2" style={{ maxWidth: '34em' }}>
              {trimmedQuery
                ? 'Revisa la ortografía o prueba con una palabra más general, por ejemplo “estola”, “jockey” o “botella”.'
                : 'Escríbenos y te cotizamos rápido.'}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              {trimmedQuery && (
                <button type="button" className="btn btn-primary" onClick={clearAll}>
                  Ver todos los productos
                </button>
              )}
              <Link className="btn btn-secondary" to="/contacto">
                Cuéntanos qué necesitas
              </Link>
            </div>
          </div>
        )}

        <div className="cta-strip" style={{ marginTop: 56 }}>
          <div>
            <h2 className="t-h3">¿Buscas algo que no está en el catálogo?</h2>
            <p className="t-body c-ink2" style={{ marginTop: 4 }}>
              Escríbenos y te cotizamos a medida.
            </p>
          </div>
          <Link className="btn btn-primary btn-lg" to="/contacto">
            Solicitar cotización
          </Link>
        </div>
      </section>

      {added && (
        <div className="toast" role="status">
          <svg className="ic ok-ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <span>{added}</span>
          <Link to="/carrito">Ver carrito</Link>
          <button type="button" className="icon-btn" aria-label="Cerrar aviso" onClick={() => setAdded(null)}>
            <svg className="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}

      {configuringProduct && (
        <ProductConfiguratorModal product={configuringProduct} onClose={closeConfigurator} onAdd={handleModalAdd} />
      )}
    </>
  )
}

export default CatalogPage
