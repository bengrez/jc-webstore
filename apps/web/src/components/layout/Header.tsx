import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import ModeSwitch from '../shared/ModeSwitch'
import './header.css'

const NAV_LINKS = [
  { to: '/inicio', label: 'Inicio' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/sobre-nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
]

const Header = () => {
  const [open, setOpen] = useState(false)
  const { items } = useCart()
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  const handleToggle = () => setOpen((prev) => !prev)
  const handleNavigate = () => setOpen(false)

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/inicio" className="site-header__brand" onClick={handleNavigate}>
          <img
            src="/brand/logo.jpeg"
            alt="Confecciones Juany Reyes"
            className="site-header__logo"
          />
        </NavLink>

        <nav className={`site-header__nav ${open ? 'is-open' : ''}`}>
          <ul className="site-header__links">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `site-header__link ${isActive ? 'is-active' : ''}`
                  }
                  onClick={handleNavigate}
                  end={link.to === '/inicio'}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="site-header__nav-footer">
            <NavLink to="/" className="button button--ghost" onClick={handleNavigate}>
              Cambiar modo
            </NavLink>
          </div>
        </nav>

        <div className="site-header__actions">
          <div className="site-header__mode-switch">
            <ModeSwitch />
          </div>
          <NavLink to="/carrito" className="site-header__cart" onClick={handleNavigate}>
            Carrito
            {cartCount > 0 && <span className="site-header__cart-badge">{cartCount}</span>}
          </NavLink>
          <button
            type="button"
            className="site-header__menu-toggle"
            aria-expanded={open}
            aria-label="Menú"
            onClick={handleToggle}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
