import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useThemeMode } from '../../context/ThemeContext'
import ModeSwitch from '../shared/ModeSwitch'
import './header.css'

const NAV_LINKS = [
  { to: '/inicio', label: 'Home' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/sobre-nosotros', label: 'Sobre nosotros' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/carrito', label: 'Carrito' },
]

const Header = () => {
  const { mode } = useThemeMode()
  const [open, setOpen] = useState(false)

  const handleToggle = () => setOpen((prev) => !prev)
  const handleNavigate = () => setOpen(false)

  return (
    <header className="site-header">
      <div className="site-header__upper">
        <NavLink to="/inicio" className="site-header__brand" onClick={handleNavigate}>
          <img src="/logo.png" alt="Confecciones Juany logo" className="site-header__logo" />
          <div className="site-header__brand-text">
            <span className="brand-label">Confecciones Juany</span>
            <span className="brand-tagline">Graduación y marketing en Chile</span>
          </div>
        </NavLink>

        <div className="site-header__actions">
          <div className="site-header__mode-context">
            <span className="site-header__mode-label">Modo activo</span>
            <span className="site-header__mode-value">
              {mode === 'graduation' ? 'Graduación' : 'Corporativo'}
            </span>
          </div>
          <div className="site-header__mode-switch">
            <ModeSwitch />
          </div>
          <button
            type="button"
            className="site-header__menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={handleToggle}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        className={`site-header__nav ${open ? 'is-open' : ''}`}
        aria-label="Navegación principal"
      >
        <div className="site-header__nav-panel">
          <div className="site-header__nav-mode">
            <p className="site-header__nav-mode-copy">Elige qué colección quieres ver.</p>
            <NavLink to="/" className="button button--ghost" onClick={handleNavigate}>
              Cambiar modo
            </NavLink>
          </div>
          <ul>
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
        </div>
      </nav>
    </header>
  )
}

export default Header
