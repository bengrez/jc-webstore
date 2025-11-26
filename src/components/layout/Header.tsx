import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useThemeMode } from '../../context/ThemeContext'
import './header.css'

const NAV_LINKS = [
  { to: '/inicio', label: 'Inicio' },
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
  const trackCta = (label: string) => {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'cta_click', label })
  }

  return (
    <header className="site-header">
      <div className="site-header__upper">
        <NavLink to="/inicio" className="site-header__brand" onClick={handleNavigate}>
          <img src="/logo.png" alt="Gradumarketing logo" className="site-header__logo" />
          <div className="site-header__brand-text">
            <span className="brand-label">Gradumarketing</span>
            <span className="brand-tagline">Estolas & marketing hecho en Chile</span>
          </div>
        </NavLink>

        <div className="site-header__actions">
          <div className="site-header__mode-context">
            <span className="site-header__mode-label">Enfoque</span>
            <span className="site-header__mode-value">
              {mode === 'graduation' ? 'Graduación' : 'Corporativo'}
            </span>
            <NavLink to="/" className="site-header__mode-change" onClick={handleNavigate}>
              Cambiar
            </NavLink>
          </div>
          <div className="site-header__cta">
            <NavLink
              to="/contacto"
              className="button button--ghost"
              onClick={() => trackCta('cotizar-header')}
            >
              Cotizar
            </NavLink>
            <a
              className="button button--primary"
              href="https://wa.me/56912345678"
              target="_blank"
              rel="noreferrer"
              onClick={() => trackCta('whatsapp-header')}
            >
              WhatsApp
            </a>
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
            <p className="site-header__nav-mode-copy">
              Selecciona el enfoque que necesites desde la portada principal.
            </p>
            <NavLink to="/" className="button button--ghost" onClick={handleNavigate}>
              Elegir enfoque
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
                  end={link.to === '/'}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="site-header__mobile-cta">
            <NavLink to="/contacto" className="button button--primary" onClick={handleNavigate}>
              Solicitar cotización
            </NavLink>
            <a className="button button--ghost" href="https://wa.me/56912345678" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header
