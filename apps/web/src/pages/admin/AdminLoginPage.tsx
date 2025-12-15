import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { adminFetch } from './adminApi'
import './admin.css'

const AdminLoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<null | { type: 'error' | 'success'; message: string }>(
    null
  )
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const redirectPath = useMemo(() => {
    const state = location.state as undefined | { from?: string }
    return state?.from ?? '/admin/products'
  }, [location.state])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      await adminFetch('/api/admin/login', {
        method: 'POST',
        json: { email, password },
      })
      setStatus({ type: 'success', message: 'Sesión iniciada.' })
      navigate(redirectPath, { replace: true })
    } catch {
      setStatus({ type: 'error', message: 'Credenciales inválidas.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-shell">
      <main className="admin-main">
        <div className="admin-card">
          <h1>Acceso admin</h1>
          <p className="lede">Inicia sesión para administrar productos y cotizaciones.</p>

          {status && (
            <div className="admin-status" data-variant={status.type} role="status" aria-live="polite">
              {status.message}
            </div>
          )}

          <form className="admin-form" onSubmit={handleSubmit}>
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="admin-password">Contraseña</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            <button type="submit" className="button button--primary" disabled={submitting}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default AdminLoginPage

