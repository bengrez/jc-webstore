import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { adminFetch } from './adminApi'
import './admin.css'

type AdminMe = {
  id: number
  email: string
}

const AdminLayout = () => {
  const [me, setMe] = useState<AdminMe | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const redirectToLogin = useMemo(() => {
    const from = `${location.pathname}${location.search}`
    return () => navigate('/admin/login', { replace: true, state: { from } })
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    adminFetch<AdminMe>('/api/admin/me')
      .then((data) => {
        if (cancelled) return
        setMe(data)
      })
      .catch(() => {
        if (cancelled) return
        setMe(null)
        redirectToLogin()
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [redirectToLogin])

  const handleLogout = async () => {
    await adminFetch('/api/admin/logout', { method: 'POST' }).catch(() => null)
    redirectToLogin()
  }

  if (loading) {
    return (
      <div className="admin-shell">
        <main className="admin-main">
          <div className="admin-card">Cargando admin…</div>
        </main>
      </div>
    )
  }

  if (!me) {
    return null
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <strong>Panel Admin</strong>
        <nav className="admin-header__nav" aria-label="Navegación admin">
          <NavLink to="/admin/products">Productos</NavLink>
          <NavLink to="/admin/quotes">Cotizaciones</NavLink>
        </nav>
        <div className="admin-header__right">
          <span>{me.email}</span>
          <button type="button" className="button button--ghost" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout

