import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminFetch } from './adminApi'
import './admin.css'

type QuoteStatus = 'NEW' | 'IN_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED'

const quoteStatusLabel = (s: QuoteStatus) => {
  const map: Record<QuoteStatus, string> = {
    NEW: 'Nueva', IN_REVIEW: 'En revisión', QUOTED: 'Cotizada',
    ACCEPTED: 'Aceptada', REJECTED: 'Rechazada',
  }
  return map[s]
}

const quoteStatusVariant = (s: QuoteStatus) => {
  const map: Record<QuoteStatus, string> = {
    NEW: 'new', IN_REVIEW: 'review', QUOTED: 'quoted',
    ACCEPTED: 'accepted', REJECTED: 'rejected',
  }
  return map[s]
}

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
  adminMessage?: string | null
  quotedAt?: string | null
  subtotal: number
  createdAt: string
  items: Array<{
    id: number
    quantity: number
    unitPrice: number
    quotedUnitPrice?: number | null
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

  // Send quote state
  const [quotedPrices, setQuotedPrices] = useState<Record<number, number>>({})
  const [adminMessage, setAdminMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<null | 'success' | 'error'>(null)

  useEffect(() => {
    if (!id) return
    adminFetch<QuoteDetail>(`/api/admin/quotes/${id}`)
      .then((data) => {
        setQuote(data)
        setError(null)
        const initialPrices: Record<number, number> = {}
        for (const item of data.items) {
          initialPrices[item.id] = item.quotedUnitPrice ?? item.unitPrice
        }
        setQuotedPrices(initialPrices)
        if (data.adminMessage) setAdminMessage(data.adminMessage)
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
        { method: 'POST', json: { body: noteBody } }
      )
      setQuote((prev) => (prev ? { ...prev, notes: [created, ...prev.notes] } : prev))
      setNoteBody('')
    } finally {
      setSaving(false)
    }
  }

  const handleSendQuote = async () => {
    if (!quote) return
    setSending(true)
    setSendStatus(null)
    try {
      const result = await adminFetch<{ status: string; quotedAt: string; quotedSubtotal: number }>(
        `/api/admin/quotes/${quote.id}/send-quote`,
        {
          method: 'POST',
          json: {
            adminMessage: adminMessage.trim() || null,
            items: quote.items.map((item) => ({
              itemId: item.id,
              quotedUnitPrice: quotedPrices[item.id] ?? item.unitPrice,
            })),
          },
        }
      )
      setQuote((prev) =>
        prev
          ? {
              ...prev,
              status: result.status as QuoteStatus,
              adminMessage: adminMessage.trim() || null,
              quotedAt: result.quotedAt,
              subtotal: result.quotedSubtotal,
            }
          : prev
      )
      setSendStatus('success')
    } catch {
      setSendStatus('error')
    } finally {
      setSending(false)
    }
  }

  const isFinalStatus =
    quote?.status === 'QUOTED' ||
    quote?.status === 'ACCEPTED' ||
    quote?.status === 'REJECTED'

  if (error) {
    return (
      <div className="admin-card">
        <p>{error}</p>
        <Link to="/admin/quotes" className="link">Volver</Link>
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
          <Link to="/admin/quotes" className="link">Volver</Link>
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
            <div style={{ marginBottom: 8, marginTop: 4 }}>
              <span className={`admin-badge admin-badge--status-${quoteStatusVariant(quote.status)}`}>
                {quoteStatusLabel(quote.status)}
              </span>
            </div>
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
            <strong>Mensaje del cliente</strong>
            <p>{quote.customerMessage}</p>
          </>
        )}

        <h3>Items</h3>
        <table className="admin-table" aria-label="Items de la cotización">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio original</th>
              <th>Precio cotizado</th>
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
                <td style={{ color: 'var(--color-text-muted)' }}>{item.unitPrice.toLocaleString('es-CL')}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    value={quotedPrices[item.id] ?? item.unitPrice}
                    onChange={(e) =>
                      setQuotedPrices((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                    }
                    style={{ width: 100, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--color-divider)', fontSize: '0.9rem' }}
                    disabled={isFinalStatus}
                  />
                </td>
                <td>
                  {((quotedPrices[item.id] ?? item.unitPrice) * item.quantity).toLocaleString('es-CL')}
                </td>
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
          <strong>Subtotal:</strong>{' '}
          {quote.subtotal.toLocaleString('es-CL')} + IVA
        </p>

        {/* ── Send formal quote ── */}
        {(quote.status === 'NEW' || quote.status === 'IN_REVIEW') && (
          <div style={{ marginTop: 24, padding: 16, borderRadius: 12, border: '1px solid var(--color-divider)', background: 'rgba(255,255,255,0.6)' }}>
            <h3 style={{ marginTop: 0 }}>Enviar cotización formal</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 0 }}>
              Ajusta los precios cotizados arriba si es necesario, luego envía la cotización al cliente por email con un PDF adjunto.
            </p>
            <label htmlFor="admin-message" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Mensaje al cliente (opcional)
            </label>
            <textarea
              id="admin-message"
              rows={3}
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              placeholder="Ej: Incluimos el costo de bordado en los precios indicados…"
              style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 10, border: '1px solid var(--color-divider)', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
            {sendStatus === 'success' && (
              <div className="admin-status" data-variant="success" style={{ marginBottom: 10 }}>
                Cotización enviada al cliente por email con PDF adjunto.
              </div>
            )}
            {sendStatus === 'error' && (
              <div className="admin-status" data-variant="error" style={{ marginBottom: 10 }}>
                No se pudo enviar. Intenta de nuevo.
              </div>
            )}
            <button
              type="button"
              className="button button--accent"
              onClick={handleSendQuote}
              disabled={sending}
            >
              {sending ? 'Enviando…' : 'Enviar cotización formal'}
            </button>
          </div>
        )}

        {quote.status === 'QUOTED' && quote.quotedAt && (
          <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: 12 }}>
            Cotización formal enviada el {new Date(quote.quotedAt).toLocaleString('es-CL')}
          </p>
        )}
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
