import { useEffect, useState } from 'react'
import { adminFetch } from './adminApi'
import './admin.css'

type ContactMessage = {
  id: number
  name: string
  email: string
  phone?: string | null
  company?: string | null
  message: string
  handled: boolean
  createdAt: string
}

const AdminMessagesPage = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [pendingOnly, setPendingOnly] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminFetch<ContactMessage[]>(`/api/admin/messages${pendingOnly ? '?pending=true' : ''}`)
      .then((data) => {
        setMessages(data)
        setError(null)
      })
      .catch(() => setError('No fue posible cargar los mensajes.'))
  }, [pendingOnly])

  const toggleHandled = async (message: ContactMessage) => {
    try {
      const updated = await adminFetch<ContactMessage>(`/api/admin/messages/${message.id}`, {
        method: 'PATCH',
        json: { handled: !message.handled },
      })
      setMessages((prev) =>
        pendingOnly && updated.handled
          ? prev.filter((item) => item.id !== updated.id)
          : prev.map((item) => (item.id === updated.id ? updated : item))
      )
    } catch {
      setError('No fue posible actualizar el mensaje.')
    }
  }

  return (
    <div className="admin-grid">
      <section className="admin-card">
        <div className="admin-form__actions">
          <h2 style={{ margin: 0 }}>Mensajes de contacto</h2>
          <label>
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(event) => setPendingOnly(event.target.checked)}
              style={{ marginRight: 8 }}
            />
            Solo pendientes
          </label>
        </div>

        {error && (
          <div className="admin-status" data-variant="error" role="alert">
            {error}
          </div>
        )}

        {messages.length === 0 && !error ? (
          <p style={{ color: 'var(--color-muted)' }}>
            {pendingOnly ? 'No hay mensajes pendientes.' : 'Aún no llegan mensajes.'}
          </p>
        ) : (
          <table className="admin-table" aria-label="Mensajes de contacto">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Contacto</th>
                <th>Mensaje</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.id}>
                  <td>{new Date(message.createdAt).toLocaleString('es-CL')}</td>
                  <td>
                    <div>{message.name}</div>
                    <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
                      <a href={`mailto:${message.email}`} style={{ color: 'inherit' }}>
                        {message.email}
                      </a>
                      {message.phone && <div>{message.phone}</div>}
                      {message.company && <div>{message.company}</div>}
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'pre-wrap', maxWidth: 420 }}>{message.message}</td>
                  <td>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => toggleHandled(message)}
                    >
                      {message.handled ? 'Reabrir' : 'Marcar atendido'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default AdminMessagesPage
