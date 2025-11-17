import { Link } from 'react-router-dom'
import './not-found.css'

const NotFoundPage = () => {
  return (
    <section className="not-found">
      <div className="not-found__content">
        <span className="not-found__eyebrow">Página no encontrada</span>
        <h1>Ups, no pudimos encontrar esta página</h1>
        <p>
          Parece que el enlace está roto o la sección se mudó. Sigue explorando nuestras
          colecciones o cuéntanos qué necesitas para que podamos ayudarte.
        </p>

        <div className="not-found__actions">
          <Link to="/" className="button button--primary">
            Volver al inicio
          </Link>
          <div className="not-found__links">
            <Link to="/catalogo" className="link">
              Ver catálogo
            </Link>
            <Link to="/sobre-nosotros" className="link">
              Conocer nuestra historia
            </Link>
            <Link to="/contacto" className="link">
              Hablar con el equipo
            </Link>
          </div>
        </div>
      </div>

      <div className="not-found__badge" aria-hidden="true">
        <span>404</span>
        <p>Seguimos aquí para ayudarte</p>
      </div>
    </section>
  )
}

export default NotFoundPage
