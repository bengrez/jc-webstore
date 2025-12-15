import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminFetch } from './adminApi'
import './admin.css'

type QuoteStatus = 'NEW' | 'IN_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED'

type AdminQuoteListItem = {
  id: number
  folio: string
  status: QuoteStatus
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  subtotal: number
  itemsCount: number
  createdAt: string
}

const AdminQuotesPage = () => {
  const [quotes, setQuotes] = useState<AdminQuoteListItem[]>([])
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'ALL'>('ALL')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const query = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`
    adminFetch<AdminQuoteListItem[]>(`/api/admin/quotes${query}`)
      .then((data) => {
        setQuotes(data)
        setError(null)
      })
      .catch(() => setError('No fue posible cargar cotizaciones.'))
  }, [statusFilter])

  return (
    <div className="admin-grid">
      <section className="admin-card">
        <div className="admin-form__actions">
          <h2 style={{ margin: 0 }}>Cotizaciones</h2>
          <label>
            Estado
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as QuoteStatus | 'ALL')}
              style={{ marginLeft: 10 }}
            >
              <option value="ALL">Todas</option>
              <option value="NEW">Nueva</option>
              <option value="IN_REVIEW">En revisión</option>
              <option value="QUOTED">Cotizada</option>
              <option value="ACCEPTED">Aceptada</option>
              <option value="REJECTED">Rechazada</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="admin-status" data-variant="error" role="alert">
            {error}
          </div>
        )}

        <table className="admin-table" aria-label="Listado de cotizaciones">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Items</th>
              <th>Subtotal</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.id}>
                <td>
                  <Link className="link" to={`/admin/quotes/${quote.id}`}>
                    {quote.folio}
                  </Link>
                </td>
                <td>
                  <div>{quote.customerName}</div>
                  <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
                    {quote.customerEmail}
                  </div>
                </td>
                <td>{quote.status}</td>
                <td>{quote.itemsCount}</td>
                <td>{quote.subtotal}</td>
                <td>{new Date(quote.createdAt).toLocaleString('es-CL')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export default AdminQuotesPage

