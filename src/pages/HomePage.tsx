import { Link } from 'react-router-dom'
import { useThemeMode } from '../context/ThemeContext'
import './home.css'

const stats = [
  { label: 'Producción', value: '10-20 días' },
  { label: 'Personalización', value: 'Bordado + packaging' },
  { label: 'Cobertura', value: 'Todo Chile' },
]

const highlights = [
  { title: 'Producción local', description: 'Taller en Santiago con entrega nacional.' },
  { title: 'Diseño rápido', description: 'Colores, bordados y empaques sin rodeos.' },
  { title: 'Atención directa', description: 'Hablas con Juany y el equipo siempre.' },
]

const HomePage = () => {
  const { mode } = useThemeMode()

  const heroContent =
    mode === 'graduation'
      ? {
          label: 'Modo graduación',
          title: 'Kit completo para graduaciones',
          subtitle: 'Estolas, túnicas y birretes listos para tus colores y escudo.',
          checklist: ['Estolas y túnicas', 'Birretes y foto', 'Empaque listo'],
          primaryCta: 'Ver graduación',
        }
      : {
          label: 'Modo corporativo',
          title: 'Merchandising listo para usar',
          subtitle: 'Kits y regalos corporativos con terminación premium.',
          checklist: ['Welcome kits', 'Textil eco', 'Grabado y bordado'],
          primaryCta: 'Ver corporativo',
        }

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="pill">{heroContent.label}</span>
          <h1>{heroContent.title}</h1>
          <p>{heroContent.subtitle}</p>
          <div className="home-hero__stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
          <div className="home-hero__cta">
            <Link to="/catalogo" className="button button--primary">
              {heroContent.primaryCta}
            </Link>
            <Link to="/sobre-nosotros" className="button button--ghost">
              Sobre nosotros
            </Link>
          </div>
        </div>
        <div className="home-hero__panel" aria-hidden="true">
          <div className="home-hero__badge">
            <span>Desde 2012</span>
            <strong>Confecciones Juany</strong>
          </div>
          <div className="home-hero__card">
            <p>Checklist rápido</p>
            <ul>
              {heroContent.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link to="/carrito" className="button button--accent">
              Armar cotización
            </Link>
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
          <span className="badge badge--grad">Graduación</span>
          <h3>Graduación, sin complicaciones</h3>
          <p>Estolas, birretes y túnicas personalizables para tu ceremonia.</p>
          <Link to="/catalogo" className="link">
            Ver graduación
          </Link>
        </div>
        <div className="home-modes__card home-modes__card--corporate">
          <span className="badge badge--corp">Corporativo</span>
          <h3>Regalos corporativos listos</h3>
          <p>Kits, textiles y accesorios con terminación premium.</p>
          <Link to="/catalogo" className="link">
            Ver corporativo
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
