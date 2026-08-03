import { Link, useNavigate } from 'react-router-dom'
import { useThemeMode } from '../context/ThemeContext'
import type { ThemeMode } from '../context/ThemeContext'
import './home.css'

const highlights = [
  {
    title: 'Producción local',
    description: 'Hecho en Santiago con telas probadas y terminaciones limpias.',
  },
  {
    title: 'Personalización rápida',
    description: 'Colores, bordados y empaques listos sin rodeos.',
  },
  {
    title: 'Contacto directo',
    description: 'Hablas con Juany y el equipo en cada paso.',
  },
]

const serviceStats = [
  { label: 'Producción', value: '10-20 días' },
  { label: 'Personalización', value: 'Bordado y packaging' },
  { label: 'Cobertura', value: 'Chile completo' },
]

const HomePage = () => {
  const { mode, setMode } = useThemeMode()
  const navigate = useNavigate()

  // Sin el selector de modo en "/", estas tarjetas son la vía principal para
  // cruzar de una colección a la otra: deben cambiar el modo, no solo navegar.
  const goToCollection = (target: ThemeMode) => {
    setMode(target)
    navigate('/catalogo')
  }

  const heroContent =
    mode === 'graduation'
      ? {
          title: 'Kit completo para graduaciones',
          subtitle: 'Estolas, túnicas y birretes listos para tus colores y escudo.',
          primaryCta: 'Ver graduación',
        }
      : {
          title: 'Merchandising listo para usar',
          subtitle: 'Kits y regalos corporativos con acabados premium y entrega simple.',
          primaryCta: 'Ver corporativo',
        }

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="home-hero__eyebrow">
            {mode === 'graduation' ? 'Modo Graduación' : 'Modo Corporativo'}
          </span>
          <h1>{heroContent.title}</h1>
          <p>{heroContent.subtitle}</p>
          <div className="home-hero__meta">
            {serviceStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
          <div className="home-hero__cta">
            <Link to="/catalogo" className="button button--primary">
              {heroContent.primaryCta}
            </Link>
            <Link to="/sobre-nosotros" className="button button--ghost">
              Conoce nuestra historia
            </Link>
          </div>
        </div>
        <div className="home-hero__visual" aria-hidden="true">
          <div className="home-hero__badge">
            <span>Desde 2012</span>
            <strong>Confecciones Juany</strong>
          </div>
        </div>
      </section>

      <section className="home-highlights">
        <h2>Por qué elegirnos</h2>
        <div className="home-highlights__grid">
          {highlights.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-modes">
        <div className="home-modes__card">
          <span className="home-modes__badge">Graduación</span>
          <h3>Graduación, sin complicaciones</h3>
          <p>Estolas, birretes y túnicas personalizables para tu ceremonia.</p>
          <button type="button" className="link" onClick={() => goToCollection('graduation')}>
            Ver graduación
          </button>
        </div>
        <div className="home-modes__card">
          <span className="home-modes__badge home-modes__badge--corporate">Corporativo</span>
          <h3>Regalos corporativos listos</h3>
          <p>Kits, textiles y accesorios con terminación premium.</p>
          <button type="button" className="link" onClick={() => goToCollection('corporate')}>
            Ver corporativo
          </button>
        </div>
      </section>

      <section className="home-story">
        <div className="home-story__content">
          <h2>Taller familiar</h2>
          <p className="dropcap">
            Juany dirige el taller y revisa cada pedido. Trabajamos para colegios, universidades y
            empresas en Chile con foco en calidad y cumplimiento.
          </p>
          <Link to="/contacto" className="button button--accent">
            Agenda una cotización
          </Link>
        </div>
        <div className="home-story__panel" aria-hidden="true">
          <div className="home-story__pattern" />
        </div>
      </section>
    </div>
  )
}

export default HomePage
