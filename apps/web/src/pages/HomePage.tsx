import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductCard from '../components/catalog/ProductCard'
import { MILESTONES, RESPONSE_TIME } from '../data/content'
import type { Product } from '../data/types'
import { useThemeMode } from '../context/ThemeContext'
import type { ThemeMode } from '../context/ThemeContext'
import '../design/pages/home.css'

const Svg = ({ size = 18, children }: { size?: number; children: ReactNode }) => (
  <svg
    className="ic"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
)

const Arrow = () => (
  <Svg>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)

const CapIcon = ({ size = 16 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M2 9.5l10-5 10 5-10 5-10-5z" />
    <path d="M6 12v4.5c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8V12M22 9.5V15" />
  </Svg>
)

const GiftIcon = ({ size = 16 }: { size?: number }) => (
  <Svg size={size}>
    <rect x="3.5" y="8" width="17" height="4" rx="1" />
    <path d="M5 12v7.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V12M12 8v12.5" />
    <path d="M12 8C10 8 7.5 7.2 7.5 5.5S10 3.5 12 8c2-4.5 4.5-3.8 4.5-2.5S14 8 12 8z" />
  </Svg>
)

const modeFor = (product: Product): ThemeMode =>
  product.category === 'graduaciones' ? 'graduation' : 'corporate'

const HomePage = () => {
  const { setMode } = useThemeMode()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    document.title = 'Confecciones Juany Reyes | Artículos de graduación y publicitarios'
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/products')
      .then(async (response) => {
        if (!response.ok) throw new Error('catalog')
        return (await response.json()) as Product[]
      })
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setProducts(data)
      })
      .catch(() => {
        /* sin conteos ni destacados si la carga falla */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loaded = products.length > 0
  const gradCount = products.filter((p) => p.category === 'graduaciones').length
  const mktCount = products.filter((p) => p.category === 'marketing').length

  const featured = useMemo(() => {
    const withBadge = products.filter((p) => p.badge)
    const rest = products.filter((p) => !p.badge)
    return [...withBadge, ...rest].slice(0, 4)
  }, [products])

  const countLabel = (n: number) => (loaded ? ` (${n} ${n === 1 ? 'producto' : 'productos'})` : '')

  const handleConfigure = (product: Product) => {
    setMode(modeFor(product))
    navigate(`/catalogo?producto=${encodeURIComponent(product.id)}`)
  }

  return (
    <>
      <section className="wrap hero" aria-labelledby="hero-h">
        <div className="hero-copy">
          <h1 id="hero-h" className="t-display">
            Artículos de graduación y publicitarios, hechos a tu medida
          </h1>
          <p className="t-lead" style={{ maxWidth: '34em' }}>
            Estolas, túnicas, polerones, poleras, jockeys y kits con tus colores, tu escudo o tu
            logo. Los fabricamos en nuestro taller de Santiago, con entregas en Santiago y envíos a
            regiones.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-lg" to="/catalogo">
              Ver catálogo
            </Link>
            <Link className="lnk" to="/contacto">
              Hablar con Juany
              <Arrow />
            </Link>
          </div>
        </div>
        <div className="hero-media">
          <figure className="m1">
            <img
              src="/catalog/grad-stole-magna-1.jpg"
              alt="Egresada con toga negra y estola bordada en dorado"
              style={{ objectPosition: '50% 30%' }}
            />
            <figcaption className="m-tag">
              <CapIcon />
              Graduación
            </figcaption>
          </figure>
          <figure className="m2">
            <img src="/catalog/mkt-botella-termica-1.jpg" alt="Botellas térmicas de colores" />
            <figcaption className="m-tag">
              <GiftIcon />
              Publicitarios
            </figcaption>
          </figure>
          <figure className="m3">
            <img
              src="/catalog/grad-toga-muceta-1.jpg"
              alt="Titulada con toga y muceta roja sosteniendo su diploma"
              style={{ objectPosition: '50% 30%' }}
            />
            <figcaption className="m-tag">
              <CapIcon />
              Graduación
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="wrap sec-tight" aria-label="Por qué elegirnos">
        <ul className="vals">
          <li className="val">
            <span className="val-ic">
              <Svg size={22}>
                <path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z" />
                <circle cx="12" cy="10" r="2.3" />
              </Svg>
            </span>
            <div>
              <h3>Producción local</h3>
              <p>Taller propio en Santiago, terminaciones controladas.</p>
            </div>
          </li>
          <li className="val">
            <span className="val-ic">
              <Svg size={22}>
                <path d="M4 20l1-4.2L16.5 4.3a1.8 1.8 0 0 1 2.5 0l.7.7a1.8 1.8 0 0 1 0 2.5L8.2 19 4 20z" />
                <path d="M14.5 6.5l3 3" />
              </Svg>
            </span>
            <div>
              <h3>Personalización</h3>
              <p>Colores, bordados y packaging a tu medida.</p>
            </div>
          </li>
          <li className="val">
            <span className="val-ic">
              <Svg size={22}>
                <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
              </Svg>
            </span>
            <div>
              <h3>Contacto directo</h3>
              <p>Hablas con Juany y el equipo en cada paso.</p>
            </div>
          </li>
        </ul>
      </section>

      <section className="wrap sec" aria-labelledby="lines-h">
        <div className="sec-head">
          <h2 id="lines-h" className="t-h1">
            ¿Qué estás buscando?
          </h2>
        </div>
        <div className="lines">
          <article className="line-card">
            <div className="line-img">
              <img
                src="/catalog/grad-tunica-ceremonial-1.jpg"
                alt=""
                loading="lazy"
                style={{ objectPosition: '50% 30%' }}
              />
            </div>
            <div className="line-body">
              <h3 className="t-h2" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CapIcon size={28} />
                Graduación
              </h3>
              <p className="t-body c-ink2">
                Estolas, túnicas, birretes, polerones de generación y recuerdos para colegios y
                universidades.
              </p>
              <Link className="lnk stretch" to="/catalogo?linea=graduaciones" onClick={() => setMode('graduation')}>
                Ver graduación{countLabel(gradCount)}
                <Arrow />
              </Link>
            </div>
          </article>
          <article className="line-card">
            <div className="line-img">
              <img src="/catalog/mkt-polera-pique-1.jpg" alt="" loading="lazy" />
            </div>
            <div className="line-body">
              <h3 className="t-h2" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <GiftIcon size={28} />
                Publicitarios
              </h3>
              <p className="t-body c-ink2">
                Poleras, polerones, jockeys, botellas, tazas y kits con el logo de tu empresa.
              </p>
              <Link className="lnk stretch" to="/catalogo?linea=marketing" onClick={() => setMode('corporate')}>
                Ver publicitarios{countLabel(mktCount)}
                <Arrow />
              </Link>
            </div>
          </article>
        </div>
      </section>

      {featured.length > 0 && (
        <section
          className="wrap sec"
          style={{ paddingTop: 0 }}
          aria-labelledby="feat-h"
        >
          <div className="sec-head">
            <h2 id="feat-h" className="t-h1">
              Los más pedidos
            </h2>
            <Link className="lnk" to="/catalogo">
              Ver todo el catálogo
              <Arrow />
            </Link>
          </div>
          <div className="grid-cards">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} onConfigure={handleConfigure} />
            ))}
          </div>
        </section>
      )}

      <section className="wrap sec" style={{ paddingTop: 0 }} aria-labelledby="how-h">
        <div className="sec-head" style={{ marginBottom: 40 }}>
          <div>
            <h2 id="how-h" className="t-h1">
              Cómo pedir tu cotización
            </h2>
            <p className="t-lead" style={{ marginTop: 12 }}>
              Aquí no pagas al pedir: armas tu solicitud y te respondemos con una cotización final.
            </p>
          </div>
        </div>
        <ol className="steps">
          <li className="step">
            <span className="step-n">1</span>
            <h3>Elige y personaliza</h3>
            <p>Escoge productos, colores y textos. Sube tu logo o escudo si lo tienes.</p>
          </li>
          <li className="step">
            <span className="step-n">2</span>
            <h3>Envía tu solicitud</h3>
            <p>Suma todo al carrito y completa tus datos de contacto.</p>
          </li>
          <li className="step">
            <span className="step-n">3</span>
            <h3>Recibe tu cotización</h3>
            <p>
              Respondemos dentro de {RESPONSE_TIME}, con personalización y despacho incluidos.
            </p>
          </li>
          <li className="step">
            <span className="step-n">4</span>
            <h3>Aprueba y recibe</h3>
            <p>
              Revisas un prototipo digital antes de fabricar. Pagas contra factura una vez aprobada
              la propuesta.
            </p>
          </li>
        </ol>
      </section>

      <section className="band dark" id="taller" aria-labelledby="taller-h">
        <div className="wrap band-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start' }}>
            <h2 id="taller-h" className="t-h1">
              Taller familiar desde 2012
            </h2>
            <p>
              Juany dirige el taller y revisa cada pedido. Trabajamos con colegios, universidades y
              empresas en todo Chile.
            </p>
            <Link className="btn btn-light btn-lg" to="/contacto">
              Solicitar cotización
            </Link>
          </div>
          <ol className="tl">
            {MILESTONES.map((m) => (
              <li key={m.year}>
                <b>{m.year}</b>
                <div>
                  <h3>{m.title}</h3>
                  <p>{m.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}

export default HomePage
