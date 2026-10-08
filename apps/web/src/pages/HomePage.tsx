import { Link } from 'react-router-dom'
import { useThemeMode } from '../context/ThemeContext'
import './home.css'

const HomePage = () => {
  const { mode, setMode } = useThemeMode()

  const hero =
    mode === 'graduation'
      ? {
          title: 'Estolas y kits para tu ceremonia',
          subtitle: 'Personaliza colores, bordados y entrega coordinada.',
          cta: 'Ver catálogo',
        }
      : {
          title: 'Merchandising con acabado premium',
          subtitle: 'Kits corporativos y regalos listos para tu marca.',
          cta: 'Ver catálogo',
        }

  return (
    <div className="home">
      <section className="home__hero">
        <h1>{hero.title}</h1>
        <p>{hero.subtitle}</p>
        <Link to="/catalogo" className="button button--primary button--large">
          {hero.cta}
        </Link>
      </section>

      <section className="home__features">
        <article className="home__feature">
          <h3>Producción local</h3>
          <p>Taller propio en Santiago, terminaciones controladas.</p>
        </article>
        <article className="home__feature">
          <h3>Personalización</h3>
          <p>Colores, bordados y packaging a tu medida.</p>
        </article>
        <article className="home__feature">
          <h3>Contacto directo</h3>
          <p>Hablas con Juany y el equipo en cada paso.</p>
        </article>
      </section>

      <section className="home__modes">
        {/* Sin el selector de modo en "/" (PR #7), estas tarjetas son la vía para cruzar de
            una colección a la otra: además de navegar, cambian el modo. */}
        <Link
          to="/catalogo"
          className="home__mode-card home__mode-card--graduation"
          onClick={() => setMode('graduation')}
        >
          <span className="eyebrow">Graduaciones</span>
          <h2>Estolas, birretes y túnicas</h2>
          <span className="link">Explorar</span>
        </Link>
        <Link
          to="/catalogo"
          className="home__mode-card home__mode-card--corporate"
          onClick={() => setMode('corporate')}
        >
          <span className="eyebrow">Corporativo</span>
          <h2>Kits y regalos premium</h2>
          <span className="link">Explorar</span>
        </Link>
      </section>

      <section className="home__cta-section">
        <h2>Taller familiar desde 2012</h2>
        <p>
          Juany dirige el taller y revisa cada pedido. Trabajamos con colegios, universidades y
          empresas en todo Chile.
        </p>
        <Link to="/contacto" className="button button--accent">
          Solicitar cotización
        </Link>
      </section>
    </div>
  )
}

export default HomePage
