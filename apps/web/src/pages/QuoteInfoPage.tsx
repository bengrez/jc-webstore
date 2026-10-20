import { Link } from 'react-router-dom'
import { RESPONSE_TIME } from '../data/content'

// Ruta heredada /cotizacion/…: ya no existe consulta de cotizaciones en el sitio. No lee el folio
// ni el token de la URL ni pide nada al servidor: sólo explica cómo seguimos el contacto.
const QuoteInfoPage = () => (
  <div className="wrap sec" style={{ maxWidth: 800 }}>
    <header style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <h1 className="t-h1">Te contactaremos por correo o teléfono</h1>
      <p className="t-lead">
        Las cotizaciones ya no se consultan en el sitio. Revisamos cada solicitud en el taller y te respondemos dentro
        de {RESPONSE_TIME} por el correo o el teléfono que dejaste.
      </p>
      <p className="t-small c-ink2">
        Si necesitas hablar de una solicitud que ya enviaste, escríbenos indicando su número.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        <Link to="/contacto" className="btn btn-primary btn-lg">
          Ir a contacto
        </Link>
        <Link to="/catalogo" className="btn btn-secondary btn-lg">
          Ver catálogo
        </Link>
      </div>
    </header>
  </div>
)

export default QuoteInfoPage
