import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminFetch, type ApiError } from './adminApi'
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
    isPublic: boolean
    createdAt: string
    authorEmail: string
  }>
  customerPortalUrl: string | null
  revisions: Array<{
    rev: number
    fileName: string
    netAmount: number
    ivaAmount: number
    totalAmount: number
    validUntil: string
    issuedAt: string
    sentAt: string | null
    issuedBy: string
  }>
}

const errorMessage = (error: unknown, fallback: string) => {
  const message = (error as ApiError | undefined)?.message
  return typeof message === 'string' && message ? message : fallback
}

const formatDate = (value: string) => new Date(value).toLocaleString('es-CL')

const AdminQuoteDetailPage = () => {
  const { id } = useParams()
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [noteBody, setNoteBody] = useState('')
  const [notePublic, setNotePublic] = useState(false)
  const [saving, setSaving] = useState(false)

  // Send quote state
  const [quotedPrices, setQuotedPrices] = useState<Record<number, number>>({})
  const [adminMessage, setAdminMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<null | { variant: 'success' | 'error'; message: string }>(null)

  // `refresh`: recarga tras enviar; si falla se conserva la vista actual en vez de taparla con un error
  const loadQuote = useCallback(async (refresh = false) => {
    if (!id) return
    try {
      const data = await adminFetch<QuoteDetail>(`/api/admin/quotes/${id}`)
      setQuote(data)
      setError(null)
      const initialPrices: Record<number, number> = {}
      for (const item of data.items) {
        initialPrices[item.id] = item.quotedUnitPrice ?? item.unitPrice
      }
      setQuotedPrices(initialPrices)
      setAdminMessage(data.adminMessage ?? '')
    } catch {
      if (!refresh) setError('No fue posible cargar la cotización.')
    }
  }, [id])

  useEffect(() => {
    loadQuote()
  }, [loadQuote])

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
        { method: 'POST', json: { body: noteBody, isPublic: notePublic } }
      )
      setQuote((prev) => (prev ? { ...prev, notes: [created, ...prev.notes] } : prev))
      setNoteBody('')
      setNotePublic(false)
    } finally {
      setSaving(false)
    }
  }

  const pricesInvalid = quote
    ? quote.items.some((item) => {
        const price = quotedPrices[item.id] ?? item.unitPrice
        return !Number.isInteger(price) || price <= 0
      })
    : true

  // Mismo cálculo que el server (quote-totals.ts): IVA redondeado sobre el neto total
  const screenNet = quote
    ? quote.items.reduce((sum, item) => sum + (quotedPrices[item.id] ?? item.unitPrice) * item.quantity, 0)
    : 0
  const screenIva = Math.round(screenNet * 0.19)

  // Abre el PDF con lo que está en pantalla, sin guardar ni enviar
  const handlePreview = () => {
    if (!quote) return
    const params = new URLSearchParams({
      prices: quote.items.map((item) => `${item.id}:${quotedPrices[item.id] ?? item.unitPrice}`).join(','),
      message: adminMessage.trim(),
    })
    window.open(`/api/admin/quotes/${quote.id}/pdf-preview?${params}`, '_blank', 'noopener')
  }

  const handleSendQuote = async () => {
    if (!quote) return
    setSending(true)
    setSendStatus(null)
    try {
      const result = await adminFetch<{ fileName: string; totalAmount: number; warning?: string }>(
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
      await loadQuote(true)
      setSendStatus({
        variant: 'success',
        message: `Enviada a ${quote.customerEmail} con ${result.fileName} adjunto (total ${result.totalAmount.toLocaleString('es-CL')} con IVA).${result.warning ? ` ${result.warning}` : ''}`,
      })
    } catch (err) {
      setSendStatus({
        variant: 'error',
        message: errorMessage(err, 'No se pudo enviar. La cotización no cambió de estado; intenta de nuevo.'),
      })
    } finally {
      setSending(false)
    }
  }

  // Aceptadas o rechazadas ya no se re-emiten; las cotizadas sí (nueva revisión)
  const isFinalStatus = quote?.status === 'ACCEPTED' || quote?.status === 'REJECTED'

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
          <strong>Neto:</strong> {screenNet.toLocaleString('es-CL')} · <strong>IVA 19 %:</strong>{' '}
          {screenIva.toLocaleString('es-CL')} · <strong>Total:</strong> {(screenNet + screenIva).toLocaleString('es-CL')}
        </p>

        {/* ── Send formal quote ── */}
        {!isFinalStatus && (
          <div style={{ marginTop: 24, padding: 16, borderRadius: 12, border: '1px solid var(--color-divider)', background: 'rgba(255,255,255,0.6)' }}>
            <h3 style={{ marginTop: 0 }}>
              {quote.revisions.length === 0
                ? 'Enviar cotización formal'
                : `Re-emitir cotización (revisión ${quote.revisions[0].rev + 1})`}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 0 }}>
              Ajusta los precios netos arriba, revisa la vista previa del PDF y luego envíala al cliente por correo.
              {quote.revisions.length > 0 && ' La versión anterior se conserva; el cliente recibirá la nueva revisión.'}
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
            {sendStatus && (
              <div className="admin-status" data-variant={sendStatus.variant} role="status" style={{ marginBottom: 10 }}>
                {sendStatus.message}
              </div>
            )}
            {pricesInvalid && (
              <div className="admin-status" data-variant="error" style={{ marginBottom: 10 }}>
                Todos los precios cotizados deben ser enteros mayores que cero.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="button button--ghost" onClick={handlePreview} disabled={pricesInvalid}>
                Vista previa del PDF
              </button>
              <button
                type="button"
                className="button button--accent"
                onClick={handleSendQuote}
                disabled={sending || pricesInvalid}
              >
                {sending
                  ? 'Enviando…'
                  : quote.revisions.length === 0
                    ? 'Enviar cotización formal'
                    : 'Enviar nueva revisión'}
              </button>
            </div>
          </div>
        )}

        {quote.quotedAt && (
          <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: 12 }}>
            Última emisión: {formatDate(quote.quotedAt)}
          </p>
        )}

        {quote.customerPortalUrl && (
          <p style={{ fontSize: '0.85rem', marginTop: 4, overflowWrap: 'anywhere' }}>
            <strong>Link del cliente (descarga el PDF):</strong>{' '}
            <a href={quote.customerPortalUrl} target="_blank" rel="noopener noreferrer" className="link">
              {quote.customerPortalUrl}
            </a>
          </p>
        )}

        {quote.revisions.length > 0 && (
          <>
            <h3>Emisiones</h3>
            <table className="admin-table" aria-label="Revisiones emitidas">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Emitida</th>
                  <th>Enviada</th>
                  <th>Neto</th>
                  <th>Total c/IVA</th>
                  <th>Válida hasta</th>
                  <th>Por</th>
                </tr>
              </thead>
              <tbody>
                {quote.revisions.map((revision) => (
                  <tr key={revision.rev}>
                    <td>
                      <a href={`/api/admin/quotes/${quote.id}/revisions/${revision.rev}/pdf`} className="link">
                        {revision.fileName}
                      </a>
                    </td>
                    <td>{formatDate(revision.issuedAt)}</td>
                    <td>{revision.sentAt ? formatDate(revision.sentAt) : 'No enviada'}</td>
                    <td>{revision.netAmount.toLocaleString('es-CL')}</td>
                    <td>{revision.totalAmount.toLocaleString('es-CL')}</td>
                    <td>{new Date(revision.validUntil).toLocaleDateString('es-CL')}</td>
                    <td>{revision.issuedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
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
          <label className="admin-form__checkbox">
            <input
              type="checkbox"
              checked={notePublic}
              onChange={(event) => setNotePublic(event.target.checked)}
            />
            Visible para el cliente en el portal
          </label>
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
                <div style={{ fontWeight: 600 }}>
                  {note.authorEmail}{' '}
                  {note.isPublic && <span className="admin-badge admin-badge--active">Visible al cliente</span>}
                </div>
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
