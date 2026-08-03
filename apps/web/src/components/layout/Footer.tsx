import './footer.css'

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <div>
          <h3>Confecciones Juany</h3>
          <p>Estolas, túnicas y artículos publicitarios hechos en Chile.</p>
        </div>
        <div className="site-footer__contact">
          <h4>Contacto</h4>
          <p>contacto@gradumarketing.cl</p>
          <p>+56 9 1234 5678</p>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>
          © {new Date().getFullYear()} Confecciones Juany. Todos los derechos reservados.
        </span>
        <span>Diseño dual: Graduación & Corporativo</span>
      </div>
    </footer>
  )
}

export default Footer
