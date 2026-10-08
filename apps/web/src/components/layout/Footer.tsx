import { Link } from 'react-router-dom'
import { PRIVACY_PATH, TERMS_PATH } from '../../data/legal'
import './footer.css'

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <h3>Confecciones Juany Reyes</h3>
          <p>Estolas, birretes, kits corporativos y regalos personalizados. Producción local en Santiago.</p>
        </div>
        <div className="site-footer__links">
          <h4>Navegación</h4>
          <ul>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/sobre-nosotros">Nosotros</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
          </ul>
        </div>
        <div className="site-footer__contact">
          <h4>Contacto</h4>
          <p>contacto@confeccionesjuany.cl</p>
          <p>Santiago, Chile</p>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>&copy; {new Date().getFullYear()} Confecciones Juany Reyes. Todos los derechos reservados.</span>
        <nav className="site-footer__legal" aria-label="Documentos legales">
          <Link to={PRIVACY_PATH}>Aviso de privacidad</Link>
          <Link to={TERMS_PATH}>Términos de la cotización</Link>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
