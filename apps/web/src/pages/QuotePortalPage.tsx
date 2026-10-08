import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { formatCurrency } from '../utils/format'
import './quote-portal.css'

type ConfigEntry = { label: string; type: string; value: string }

type PortalQuote = {
  folio: string
  status: string
  customerName: string
  subtotal: number
  adminMessage?: string | null
  pdfAvailable: boolean
  formal: {
    rev: number
    issuedAt: string
    validUntil: string
    netAmount: number
    ivaAmount: number
    totalAmount: number
  } | null
  createdAt: string
  updatedAt: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    quotedUnitPrice?: number | null
    image: string | null
    configuration: ConfigEntry[]
  }>
  notes: Array<{
    body: string
    createdAt: string
  }>
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  NEW: { label: 'Recibida', className: 'status--new' },
  IN_REVIEW: { label: 'En revisión', className: 'status--review' },
  QUOTED: { label: 'Cotizada', className: 'status--quoted' },
  ACCEPTED: { label: 'Aceptada', className: 'status--accepted' },
  REJECTED: { label: 'Rechazada', className: 'status--rejected' },
}

const QuotePortalPage = () => {
  const { folio } = useParams<{ folio?: string }>()
  // Token del link del correo: autoriza ver, responder y descargar (el folio solo no basta)
  const [searchParams] = useSearchParams()
  const token = searchParams.get('t')
  const [quote, setQuote] = useState<PortalQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responding, setResponding] = useState(false)
  const [responded, setResponded] = useState<'ACCEPTED' | 'REJECTED' | null>(null)

  // El portal exige el token del link del correo: sin él no se consulta nada
  const fetchQuote = async (f: string, t: string) => {
    setLoading(true)
    setError(null)
    setQuote(null)
    setResponded(null)

    try {
      const response = await fetch(
        `/api/portal/quotes/${encodeURIComponent(f.trim())}?t=${encodeURIComponent(t)}`
      )
      if (response.status === 404 || response.status === 400) {
        setError('No encontramos la cotización o el link está incompleto. Ábrelo tal cual desde el correo.')
        return
      }
      if (!response.ok) throw new Error()
      const data = (await response.json()) as PortalQuote
      setQuote(data)
    } catch {
      setError('No fue posible consultar tu cotización. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (folio && token) fetchQuote(folio, token)
  }, [folio, token])

  const handleRespond = async (action: 'ACCEPT' | 'REJECT') => {
    if (!quote || !token) return
    setResponding(true)
    setError(null)
    try {
      const response = await fetch(`/api/portal/quotes/${quote.folio}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, token }),
      })
      if (response.status === 409) {
        // Ya se respondió (otra pestaña) o el taller cambió el estado: se muestra el estado real
        await fetchQuote(quote.folio, token)
        setError('Esta cotización ya no admite respuesta; te mostramos su estado actual.')
        return
      }
      if (!response.ok) throw new Error()
      const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED'
      setResponded(newStatus)
      setQuote((prev) => (prev ? { ...prev, status: newStatus } : prev))
    } catch {
      setError('No pudimos registrar tu respuesta. Intenta nuevamente.')
    } finally {
      setResponding(false)
    }
  }

  const statusInfo = quote ? STATUS_LABELS[quote.status] ?? { label: quote.status, className: '' } : null
  const canDownload = Boolean(quote?.pdfAvailable && token)
  const formatDay = (value: string) =>
    new Date(value).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="portal">
      <header className="portal__header">
        <h1>{folio ? `Cotización ${folio.toUpperCase()}` : 'Consultar cotización'}</h1>
        <p>Revisa el estado de tu solicitud, descarga el PDF y responde la cotización formal.</p>
      </header>

      {!token && (
        <div className="portal__access" role="note">
          <strong>Abre el link que te enviamos por correo.</strong>
          <p>
            Por seguridad, cada cotización se abre con el link personal del correo de confirmación o de la
            cotización formal{folio ? ` (${folio.toUpperCase()})` : ''}. Si no lo encuentras, escríbenos y te lo
            reenviamos.
          </p>
          <Link to="/contacto" className="link">Ir a contacto</Link>
        </div>
      )}

      {loading && <p className="portal__loading">Cargando tu cotización…</p>}
      {error && <p className="portal__error" role="alert">{error}</p>}

      {quote && statusInfo && (
        <div className="portal__result">
          <div className="portal__summary">
            <div className="portal__summary-header">
              <div>
                <span className="eyebrow">Folio</span>
                <h2>{quote.folio}</h2>
              </div>
              <span className={`portal__status ${statusInfo.className}`}>{statusInfo.label}</span>
            </div>
            <div className="portal__meta">
              <div>
                <span>Cliente</span>
                <strong>{quote.customerName}</strong>
              </div>
              <div>
                <span>Fecha</span>
                <strong>{new Date(quote.createdAt).toLocaleDateString('es-CL')}</strong>
              </div>
              <div>
                <span>Subtotal</span>
                <strong>{formatCurrency(quote.subtotal)} + IVA</strong>
              </div>
            </div>
          </div>

          {quote.formal && (
            <div className="portal__formal">
              <div className="portal__formal-header">
                <div>
                  <span className="eyebrow">
                    Cotización formal{quote.formal.rev > 0 ? ` · revisión ${quote.formal.rev}` : ''}
                  </span>
                  <p>
                    Emitida el {formatDay(quote.formal.issuedAt)} · válida hasta el{' '}
                    <strong>{formatDay(quote.formal.validUntil)}</strong>
                  </p>
                </div>
                {canDownload ? (
                  <a
                    className="button button--primary"
                    href={`/api/portal/quotes/${encodeURIComponent(quote.folio)}/pdf?t=${encodeURIComponent(token ?? '')}`}
                    download
                  >
                    Descargar PDF
                  </a>
                ) : (
                  <p className="portal__formal-hint">
                    El PDF llegó adjunto a tu correo. Para descargarlo aquí, abre el link de ese correo.
                  </p>
                )}
              </div>
              <dl className="portal__formal-totals">
                <div>
                  <dt>Neto</dt>
                  <dd>{formatCurrency(quote.formal.netAmount)}</dd>
                </div>
                <div>
                  <dt>IVA (19 %)</dt>
                  <dd>{formatCurrency(quote.formal.ivaAmount)}</dd>
                </div>
                <div className="portal__formal-total">
                  <dt>Total</dt>
                  <dd>{formatCurrency(quote.formal.totalAmount)}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Admin message when quote has been formally sent */}
          {quote.adminMessage && quote.status === 'QUOTED' && (
            <div className="portal__admin-message">
              <strong>Mensaje de Confecciones Juany Reyes</strong>
              <p>{quote.adminMessage}</p>
            </div>
          )}

          <div className="portal__items">
            <h3>Productos</h3>
            {quote.items.map((item, i) => {
              const displayPrice = item.quotedUnitPrice ?? item.unitPrice
              return (
                <div key={i} className="portal__item">
                  <div className="portal__item-info">
                    <strong>{item.name}</strong>
                    <span>{item.quantity} x {formatCurrency(displayPrice)}</span>
                  </div>
                  {item.configuration.length > 0 && (
                    <ul className="portal__item-config">
                      {item.configuration.map((c, j) => (
                        <li key={j}>
                          <span>{c.label}:</span>{' '}
                          {c.type === 'COLOR' ? (
                            <span className="portal__swatch" style={{ background: c.value }} />
                          ) : (
                            c.value
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>

          {quote.notes.length > 0 && (
            <div className="portal__notes">
              <h3>Actualizaciones</h3>
              {quote.notes.map((note, i) => (
                <div key={i} className="portal__note">
                  <p>{note.body}</p>
                  <span>{new Date(note.createdAt).toLocaleDateString('es-CL')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Accept / Reject — only when status is QUOTED and not yet responded */}
          {/* Sólo con una emisión formal hay montos que aceptar; si se cotizó por fuera
              (WhatsApp, marcada a mano) la respuesta va por ese mismo canal */}
          {quote.status === 'QUOTED' && !quote.formal && (
            <div className="portal__access" role="note">
              <strong>Te enviamos esta cotización por otro canal.</strong>
              <p>Respóndenos por ese mismo medio o escríbenos desde Contacto para confirmarla.</p>
            </div>
          )}

          {quote.status === 'QUOTED' && quote.formal && !responded && (
            <div className="portal__respond">
              <p>¿Deseas aceptar esta cotización?</p>
              <div className="portal__respond-actions">
                <button
                  type="button"
                  className="button button--accent"
                  onClick={() => handleRespond('ACCEPT')}
                  disabled={responding}
                >
                  Aceptar cotización
                </button>
                <button
                  type="button"
                  className="button button--ghost portal__reject-btn"
                  onClick={() => handleRespond('REJECT')}
                  disabled={responding}
                >
                  Rechazar
                </button>
              </div>
            </div>
          )}

          {(responded === 'ACCEPTED' || quote.status === 'ACCEPTED') && (
            <div className="portal__response-msg portal__response-msg--accepted">
              ¡Cotización aceptada! Nos pondremos en contacto para coordinar los detalles.
            </div>
          )}

          {(responded === 'REJECTED' || quote.status === 'REJECTED') && (
            <div className="portal__response-msg portal__response-msg--rejected">
              Cotización rechazada. Si tienes dudas, contáctanos directamente.
            </div>
          )}

          <Link to="/catalogo" className="link">Volver al catálogo</Link>
        </div>
      )}
    </div>
  )
}

export default QuotePortalPage
