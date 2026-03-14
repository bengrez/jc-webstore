import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminFetch } from './adminApi'
import './admin.css'

type QuoteStatus = 'NEW' | 'IN_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED'

type ConfigEntry = {
  optionId: number
  label: string
  type: 'COLOR' | 'TEXT' | 'FILE'
  value: string
}

type QuoteDetail = {
  id: number
  folio: string
  status: QuoteStatus
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  customerMessage?: string | null
  subtotal: number
  createdAt: string
  items: Array<{
    id: number
    quantity: number
    unitPrice: number
    productName: string
    productCategory: string
    productLeadTime: string
    productMinOrder: string
    productAvailability: string
    configuration: ConfigEntry[]
  }>
  notes: Array<{
    id: number
    body: string
    createdAt: string
    authorEmail: string
  }>
}

const AdminQuoteDetailPage = () => {
  const { id } = useParams()
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [noteBody, setNoteBody] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    adminFetch<QuoteDetail>(`/api/admin/quotes/${id}`)
      .then((data) => {
        setQuote(data)
        setError(null)
      })
      .catch(() => setError('No fue posible cargar la cotización.'))
  }, [id])

  const handleStatusChange = async (next: QuoteStatus) => {
    if (!quote) return
    setSaving(true)
    try {
      const updated = await adminFetch<{ status: QuoteStatus }>(`/api/admin/quotes/${quote.id}`, {
        method: 'PATCH',
        json: { status: next },
      })
      setQuote((prev) => (prev ? { ...prev, status: updated.status } : prev))
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async (event: FormEvent) => {
    event.preventDefault()
    if (!quote) return
    setSaving(true)
    try {
      const created = await adminFetch<QuoteDetail['notes'][number]>(
        `/api/admin/quotes/${quote.id}/notes`,
        {
          method: 'POST',
          json: { body: noteBody },
        }
      )
      setQuote((prev) => (prev ? { ...prev, notes: [created, ...prev.notes] } : prev))
      setNoteBody('')
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <div className="admin-card">
        <p>{error}</p>
        <Link to="/admin/quotes" className="link">
          Volver
        </Link>
      </div>
    )
  }

  if (!quote) {
    return <div className="admin-card">Cargando…</div>
  }

  return (
    <div className="admin-grid">
      <section className="admin-card">
        <div className="admin-form__actions">
          <h2 style={{ margin: 0 }}>{quote.folio}</h2>
          <Link to="/admin/quotes" className="link">
            Volver
          </Link>
        </div>

        <p style={{ marginTop: 8, color: 'var(--color-muted)' }}>
          Creada el {new Date(quote.createdAt).toLocaleString('es-CL')}
        </p>

        <div className="admin-form__row">
          <div>
            <strong>Cliente</strong>
            <div>{quote.customerName}</div>
            <div>{quote.customerEmail}</div>
            {quote.customerPhone && <div>{quote.customerPhone}</div>}
          </div>
          <div>
            <strong>Estado</strong>
            <select
              value={quote.status}
              onChange={(event) => handleStatusChange(event.target.value as QuoteStatus)}
              disabled={saving}
            >
              <option value="NEW">Nueva</option>
              <option value="IN_REVIEW">En revisión</option>
              <option value="QUOTED">Cotizada</option>
              <option value="ACCEPTED">Aceptada</option>
              <option value="REJECTED">Rechazada</option>
            </select>
          </div>
        </div>

        {quote.customerMessage && (
          <>
            <strong>Mensaje</strong>
            <p>{quote.customerMessage}</p>
          </>
        )}

        <h3>Items</h3>
        <table className="admin-table" aria-label="Items de la cotización">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Unit.</th>
              <th>Subtotal</th>
              <th>Info</th>
              <th>Configuración</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id}>
                <td>{item.productName}</td>
                <td>{item.quantity}</td>
                <td>{item.unitPrice}</td>
                <td>{item.unitPrice * item.quantity}</td>
                <td>
                  <div>{item.productAvailability}</div>
                  <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
                    {item.productLeadTime} · {item.productMinOrder}
                  </div>
                </td>
                <td>
                  {item.configuration && item.configuration.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {item.configuration.map((c) => (
                        <li key={c.optionId} style={{ fontSize: '0.82rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-muted)' }}>{c.label}:</span>{' '}
                          {c.type === 'COLOR' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: c.value, border: '1px solid rgba(0,0,0,0.15)' }} />
                              {c.value}
                            </span>
                          ) : c.type === 'FILE' ? (
                            <a href={c.value} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-strong)', textDecoration: 'underline' }}>
                              {decodeURIComponent(c.value.split('/').pop() ?? c.value)}
                            </a>
                          ) : (
                            c.value
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: 'var(--color-muted)', fontSize: '0.82rem' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p>
          <strong>Subtotal referencial:</strong> {quote.subtotal} + IVA
        </p>
      </section>

      <section className="admin-card">
        <h3 style={{ marginTop: 0 }}>Notas internas</h3>
        <form className="admin-form" onSubmit={handleAddNote}>
          <label htmlFor="note-body">Nueva nota</label>
          <textarea
            id="note-body"
            rows={4}
            value={noteBody}
            onChange={(event) => setNoteBody(event.target.value)}
            required
          />
          <button type="submit" className="button button--accent" disabled={saving}>
            Agregar nota
          </button>
        </form>

        {quote.notes.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>Sin notas aún.</p>
        ) : (
          <div className="admin-grid">
            {quote.notes.map((note) => (
              <div key={note.id} style={{ paddingTop: 10, borderTop: '1px solid var(--color-divider)' }}>
                <div style={{ fontWeight: 600 }}>{note.authorEmail}</div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
                  {new Date(note.createdAt).toLocaleString('es-CL')}
                </div>
                <p style={{ marginBottom: 0 }}>{note.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default AdminQuoteDetailPage

