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
  // Token del link del correo: autoriza descargar el PDF (el folio solo no basta)
  const [searchParams] = useSearchParams()
  const token = searchParams.get('t')
  const [inputFolio, setInputFolio] = useState(folio ?? '')
  const [quote, setQuote] = useState<PortalQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responding, setResponding] = useState(false)
  const [responded, setResponded] = useState<'ACCEPTED' | 'REJECTED' | null>(null)

  const fetchQuote = async (f: string) => {
    if (!f.trim()) return
    setLoading(true)
    setError(null)
    setQuote(null)
    setResponded(null)

    try {
      const response = await fetch(`/api/portal/quotes/${encodeURIComponent(f.trim())}`)
      if (response.status === 404) {
        setError('No encontramos una cotización con ese folio.')
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
    if (folio) fetchQuote(folio)
  }, [folio])

  const handleRespond = async (action: 'ACCEPT' | 'REJECT') => {
    if (!quote) return
    setResponding(true)
    try {
      await fetch(`/api/portal/quotes/${quote.folio}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED'
      setResponded(newStatus)
      setQuote((prev) => (prev ? { ...prev, status: newStatus } : prev))
    } catch {
      // user can retry
    } finally {
      setResponding(false)
    }
  }

  const statusInfo = quote ? STATUS_LABELS[quote.status] ?? { label: quote.status, className: '' } : null
  const canDownload = Boolean(quote?.pdfAvailable && token && folio && quote.folio.toUpperCase() === folio.toUpperCase())
  const formatDay = (value: string) =>
    new Date(value).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="portal">
      <header className="portal__header">
        <h1>Consultar cotización</h1>
        <p>Ingresa tu folio para ver el estado de tu solicitud.</p>
      </header>

      <div className="portal__search">
        <input
          type="text"
          value={inputFolio}
          onChange={(e) => setInputFolio(e.target.value)}
          placeholder="COT-000001"
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchQuote(inputFolio)
          }}
        />
        <button
          type="button"
          className="button button--primary"
          onClick={() => fetchQuote(inputFolio)}
          disabled={loading}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && <p className="portal__error">{error}</p>}

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
          {quote.status === 'QUOTED' && !responded && (
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
