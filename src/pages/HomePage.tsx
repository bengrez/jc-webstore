import { Link } from 'react-router-dom'
import { useThemeMode } from '../context/ThemeContext'
import './home.css'

const highlights = [
  {
    title: 'Hecho a mano en Chile',
    description: 'Cada pieza se confecciona en nuestro taller familiar con telas seleccionadas y terminaciones impecables.',
  },
  {
    title: 'Diseño a tu medida',
    description: 'Personalizamos colores, bordados e insumos especiales para reflejar la identidad de tu institución o marca.',
  },
  {
    title: 'Equipo experto',
    description: 'La diseñadora y dueña acompaña cada etapa: desde la idea inicial hasta la entrega final, siempre con seguimiento cercano.',
  },
]

const serviceStats = [
  { label: 'Tiempo de producción', value: '10-20 días' },
  { label: 'Personalización', value: '100% bordados, packaging' },
  { label: 'Cobertura', value: 'Envíos a todo Chile' },
]

const HomePage = () => {
  const { mode } = useThemeMode()

  const heroContent =
    mode === 'graduation'
      ? {
          title: 'Ceremonias que emocionan y permanecen',
          subtitle:
            'Diseñamos estolas, túnicas y birretes premium para universidades, colegios y academias que valoran la tradición.',
          primaryCta: 'Ver catálogo de graduación',
        }
      : {
          title: 'Marca corporativa que deja huella',
          subtitle:
            'Creamos regalos y artículos publicitarios con acabados de lujo para campañas, ferias y eventos empresariales.',
          primaryCta: 'Explorar artículos publicitarios',
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
        <h2>Lo que nos diferencia</h2>
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
          <h3>Vestimenta solemne para hitos académicos</h3>
          <p>
            Capas, estolas bordadas y birretes con calidades premium, listas para personalizar con
            colores institucionales, insignias y nombres.
          </p>
          <Link to="/catalogo" className="link">
            Ver categoría
          </Link>
        </div>
        <div className="home-modes__card">
          <span className="home-modes__badge home-modes__badge--corporate">Corporativo</span>
          <h3>Regalos para conectar con tus clientes</h3>
          <p>
            Kits de bienvenida, textiles promocionales y elementos de merchandising con acabados
            premium y empaques listos para sorprender.
          </p>
          <Link to="/catalogo" className="link">
            Explorar artículos
          </Link>
        </div>
      </section>

      <section className="home-story">
        <div className="home-story__content">
          <h2>Empresa familiar con alma de taller</h2>
          <p className="dropcap">
            Somos una familia de artesanas y diseñadores que trabaja junto a universidades, colegios
            y empresas en todo Chile. Juany, nuestra fundadora y diseñadora, participa en cada
            detalle para asegurar que cada pieza llegue impecable y a tiempo.
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
