import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

const Layout = () => {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // Con ancla (/#taller) baja a esa sección; sin ancla vuelve arriba
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    if (target) target.scrollIntoView({ block: 'start', behavior: 'auto' })
    else window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])

  return (
    <div className="site">
      <a className="skip" href="#main">
        Saltar al contenido
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
