import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, HOURS, LOCATION } from '../../data/content'
import { PRIVACY_PATH, TERMS_PATH } from '../../data/legal'

const Footer = () => {
  return (
    <footer className="ftr dark">
      <div className="wrap ftr-in">
        <div className="ftr-brand">
          <div className="ftr-logo">
            <img src="/brand/simbolo-blanco.png" width="48" height="48" alt="" />
            <span className="ftr-name">
              <span>Confecciones</span>
              <span>Juany Reyes</span>
            </span>
          </div>
          <p>Estolas, birretes, kits corporativos y regalos personalizados. Producción local en Santiago.</p>
        </div>
        <nav aria-label="Navegación del sitio">
          <h2 className="ftr-h">Navegación</h2>
          <ul>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/sobre-nosotros">Nosotros</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="ftr-h">Contacto</h2>
          <ul>
            <li>{CONTACT_EMAIL}</li>
            <li>{LOCATION}</li>
            <li>{HOURS}</li>
          </ul>
        </div>
      </div>
      <div className="wrap">
        <div className="ftr-bottom">
          <span>&copy; {new Date().getFullYear()} Confecciones Juany Reyes. Todos los derechos reservados.</span>
          <nav aria-label="Documentos legales">
            <Link to={PRIVACY_PATH}>Aviso de privacidad</Link>
            <Link to={TERMS_PATH}>Términos de la cotización</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer
