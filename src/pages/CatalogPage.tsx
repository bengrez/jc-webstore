import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/catalog/ProductCard'
import ProductDetailModal from '../components/catalog/ProductDetailModal'
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
  const [priceRange, setPriceRange] = useState<'all' | 'under-15000' | '15000-25000' | 'above-25000'>(
    'all'
  )
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'Disponible' | 'A pedido'>('all')
  const [leadTimeFilter, setLeadTimeFilter] = useState<'all' | '10' | '15' | '20'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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
      ? byCategory.filter(
          (product) => product.badge && badgeFilters.includes(product.badge as 'Top ventas' | 'Nuevo')
        )
      : byCategory
    const byPrice = byBadge.filter((product) => {
      if (priceRange === 'under-15000') return product.price < 15000
      if (priceRange === '15000-25000') return product.price >= 15000 && product.price <= 25000
      if (priceRange === 'above-25000') return product.price > 25000
      return true
    })
    const byAvailability =
      availabilityFilter === 'all'
        ? byPrice
        : byPrice.filter((product) => product.availability === availabilityFilter)
    const byLeadTime =
      leadTimeFilter === 'all'
        ? byAvailability
        : byAvailability.filter((product) => parseLeadTime(product.leadTime) <= Number(leadTimeFilter))

    const sorted = [...byLeadTime].sort((a, b) => {
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
  }, [availabilityFilter, badgeFilters, leadTimeFilter, priceRange, selectedCategory, sortOption])

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
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'add_to_cart', productId: product.id })
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
        <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link to="/">Inicio</Link>
            </li>
            <li aria-current="page">Catálogo</li>
          </ol>
        </nav>
        <span className="catalog-hero__mode">
          {mode === 'graduation' ? 'Modo Graduación' : 'Modo Corporativo'}
        </span>
        <h1>Catálogo Gradumarketing</h1>
        <p>
          Elige la colección que necesitas y descubre opciones listas para personalizar con tus
          colores, bordados y empaques.
        </p>
        <div className="catalog-hero__anchors" aria-label="Navegación rápida">
          <a href="#colecciones">Colecciones</a>
          <a href="#faq">Preguntas frecuentes</a>
          <a href="#politicas">Políticas de entrega</a>
        </div>
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

      <section className="catalog-section" id="colecciones">
        <div className="catalog-section__header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
            <div className="catalog-guidance">
              <p>
                Valores desde {selectedCategory === 'graduaciones' ? '$14.990' : '$11.990'} antes de IVA.
                Mínimos flexibles y despacho a todo Chile. Incluye revisión de artes y maqueta digital.
              </p>
              <p>
                Plazos habituales: 10-20 días hábiles. Consulta disponibilidad express para fechas límite.
              </p>
            </div>
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
              <div className="catalog-filters catalog-filters--secondary">
                <label>
                  Precio
                  <select value={priceRange} onChange={(event) => setPriceRange(event.target.value as typeof priceRange)}>
                    <option value="all">Todos</option>
                    <option value="under-15000">Menos de $15.000</option>
                    <option value="15000-25000">$15.000 - $25.000</option>
                    <option value="above-25000">Sobre $25.000</option>
                  </select>
                </label>
                <label>
                  Disponibilidad
                  <select
                    value={availabilityFilter}
                    onChange={(event) => setAvailabilityFilter(event.target.value as typeof availabilityFilter)}
                  >
                    <option value="all">Todas</option>
                    <option value="Disponible">En stock</option>
                    <option value="A pedido">A pedido</option>
                  </select>
                </label>
                <label>
                  Entrega máxima
                  <select
                    value={leadTimeFilter}
                    onChange={(event) => setLeadTimeFilter(event.target.value as typeof leadTimeFilter)}
                  >
                    <option value="all">Sin filtro</option>
                    <option value="10">Hasta 10 días</option>
                    <option value="15">Hasta 15 días</option>
                    <option value="20">Hasta 20 días</option>
                  </select>
                </label>
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
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onViewDetails={(item) => setSelectedProduct(item)}
              />
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

      <section className="catalog-panels" id="politicas">
        <article>
          <h3>Despacho y SLA</h3>
          <p>Envíos a todo Chile con seguimiento y control de calidad en origen.</p>
          <ul>
            <li>Producción: 10-20 días hábiles según complejidad.</li>
            <li>Despacho: 48 horas promedio en RM, 3-5 días regiones.</li>
            <li>Garantía de ajuste: cambios por tallas o correcciones de arte incluidos.</li>
          </ul>
        </article>
        <article>
          <h3>Política de devoluciones</h3>
          <p>Correcciones sin costo cuando la muestra aprobada difiere del resultado final.</p>
          <ul>
            <li>Señal del 50% para iniciar producción.</li>
            <li>Protocolos de embalaje para graduaciones y gifting corporativo.</li>
            <li>Seguro de transporte disponible bajo solicitud.</li>
          </ul>
        </article>
        <article>
          <h3>Comparativa rápida</h3>
          <div className="catalog-compare">
            <div>
              <p>Graduación</p>
              <ul>
                <li>Estolas, túnicas y birretes personalizados.</li>
                <li>MOQ desde 15 unidades.</li>
                <li>Envío planchado y empaquetado por persona.</li>
              </ul>
            </div>
            <div>
              <p>Corporativo</p>
              <ul>
                <li>Kits de bienvenida y regalos ejecutivos.</li>
                <li>MOQ desde 25 unidades.</li>
                <li>Pick & pack por sede o colaborador.</li>
              </ul>
            </div>
          </div>
        </article>
      </section>

      <section className="catalog-faq" id="faq">
        <h2>Preguntas frecuentes</h2>
        <div className="catalog-faq__items">
          <details open>
            <summary>¿Cómo reciben el arte o logo?</summary>
            <p>Envíanos PDF editable o PNG alta resolución. Compartimos maqueta digital para aprobación antes de producir.</p>
          </details>
          <details>
            <summary>¿Puedo pedir muestras físicas?</summary>
            <p>Sí, ofrecemos kit de muestras y bordados de prueba. El costo se descuenta de tu orden final.</p>
          </details>
          <details>
            <summary>¿Tienen opciones express?</summary>
            <p>Disponibles bajo confirmación de stock. Contáctanos para priorizar fechas de ceremonia o evento.</p>
          </details>
          <details>
            <summary>¿Envían reportes de avance?</summary>
            <p>Compartimos fotos de producción y tracking de despacho con SLA comprometido por escrito.</p>
          </details>
        </div>
        <div className="catalog-downloads">
          <div>
            <p>Descarga lookbook PDF</p>
            <a className="button button--ghost" href="https://example.com/lookbook.pdf" target="_blank" rel="noreferrer">
              Ver lookbook
            </a>
          </div>
          <div>
            <p>Plantilla de logos</p>
            <a className="button button--ghost" href="https://example.com/plantilla-ai" target="_blank" rel="noreferrer">
              Descargar plantilla
            </a>
          </div>
        </div>
      </section>

      <div className="catalog-sticky-cta" aria-label="Solicitar cotización">
        <div>
          <p>¿Listo para cotizar? Respondemos en menos de 24 horas hábiles.</p>
          <span>Atención directa con Juany.</span>
        </div>
        <div className="catalog-sticky-cta__actions">
          <Link className="button button--primary" to="/contacto">
            Solicitar cotización
          </Link>
          <a className="button button--ghost" href="https://wa.me/56912345678" target="_blank" rel="noreferrer">
            WhatsApp inmediato
          </a>
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  )
}

export default CatalogPage
