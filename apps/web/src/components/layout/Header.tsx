import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { costura } from '../../design/costura'
import { MACHINE_HEAD_SVG } from '../../design/machine-svg'

// «Nosotros» lleva a la sección #taller de la home (como en el lienzo); /sobre-nosotros sigue como página aparte.
const NAV_LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Catálogo', end: false },
  { to: '/#taller', label: 'Nosotros', end: false },
  { to: '/contacto', label: 'Contacto', end: false },
]

const Chevron = () => (
  <svg className="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M9 6l6 6-6 6" />
  </svg>
)

const Header = () => {
  const [open, setOpen] = useState(false)
  const { items } = useCart()
  const { pathname, hash } = useLocation()
  const cartCount = items.length

  // La máquina de pespunte recorre la banda de tela al bajar la página (decorativa, ver design/costura.ts).
  useEffect(() => {
    costura.start()
    return () => costura.stop()
  }, [])

  // El menú del celular se cierra al cambiar de página.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const isActive = (link: (typeof NAV_LINKS)[number]) => {
    if (link.to === '/#taller') return pathname === '/' && hash === '#taller'
    if (link.to === '/') return pathname === '/' && hash !== '#taller'
    return pathname === link.to || pathname.startsWith(`${link.to}/`)
  }

  // Si ya estamos en /#taller el cambio de ruta no dispara el desplazamiento: se hace a mano
  const handleNavClick = (link: (typeof NAV_LINKS)[number]) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (link.to === '/#taller' && pathname === '/' && hash === '#taller') {
      event.preventDefault()
      document.getElementById('taller')?.scrollIntoView({ block: 'start', behavior: 'auto' })
    }
  }

  const cartLabel = cartCount > 0 ? `Carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}` : 'Carrito'

  return (
    <header className="hdr">
      <div className="hm" id="costura" aria-hidden="true">
        <div className="hm-seam">
          <i className="hm-surco" />
          <i className="hm-hoyo" />
          <i className="hm-sombra" />
          <i className="hm-hilo" />
        </div>
        <div className="hm-head" dangerouslySetInnerHTML={{ __html: MACHINE_HEAD_SVG }} />
      </div>
      <div className="hdr-lane" aria-hidden="true" />
      <div className="wrap hdr-in">
        <Link className="brand" to="/" aria-label="Confecciones Juany Reyes, ir al inicio">
          <img src="/brand/simbolo-azul.png" width="44" height="44" alt="" />
          <span className="brand-name">
            <span>Confecciones</span>
            <span>Juany Reyes</span>
          </span>
        </Link>
        <nav className="nav hide-m" aria-label="Principal">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={handleNavClick(link)} aria-current={isActive(link) ? 'page' : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <NavLink className="cart-link" to="/carrito" aria-label={cartLabel}>
          <svg className="ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5.5 8h13l-1.1 11.2a1.5 1.5 0 0 1-1.5 1.3H8.1a1.5 1.5 0 0 1-1.5-1.3L5.5 8z" />
            <path d="M9 8V7a3 3 0 0 1 6 0v1" />
          </svg>
          <span className="hide-m">Carrito</span>
          {cartCount > 0 && <span className="cart-count" aria-hidden="true">{cartCount > 99 ? '99+' : cartCount}</span>}
        </NavLink>
        <button
          type="button"
          className="icon-btn show-m"
          aria-label="Menú"
          aria-expanded={open}
          aria-controls="mnav"
          onClick={() => setOpen((prev) => !prev)}
        >
          <svg className="ic" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav id="mnav" className="mnav show-m" aria-label="Menú principal">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={handleNavClick(link)} aria-current={isActive(link) ? 'page' : undefined}>
              <span>{link.label}</span>
              <Chevron />
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}

export default Header
