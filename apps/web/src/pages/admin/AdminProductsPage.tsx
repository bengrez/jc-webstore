import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { adminFetch } from './adminApi'
import './admin.css'

type ProductCategory = 'graduaciones' | 'marketing'
type AvailabilityLabel = 'Disponible' | 'A pedido'

type AdminProduct = {
  id: string
  name: string
  description: string
  category: ProductCategory
  price: number
  images: string[]
  tags: string[]
  specs: string[]
  personalization: string
  minOrder: string
  leadTime: string
  availability: AvailabilityLabel
  badge?: string | null
  sampleEligible: boolean
  isActive: boolean
}

const splitLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const joinLines = (values: string[]) => values.join('\n')

const emptyForm = {
  name: '',
  description: '',
  category: 'graduaciones' as ProductCategory,
  price: 0,
  images: '',
  tags: '',
  specs: '',
  personalization: '',
  minOrder: '',
  leadTime: '',
  availability: 'A pedido' as AvailabilityLabel,
  badge: '',
  sampleEligible: true,
  isActive: true,
}

const AdminProductsPage = () => {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState<null | { type: 'error' | 'success'; message: string }>(null)

  const selected = useMemo(
    () => products.find((product) => product.id === selectedId) ?? null,
    [products, selectedId]
  )

  const loadProducts = async () => {
    const data = await adminFetch<AdminProduct[]>('/api/admin/products?includeInactive=true')
    setProducts(data)
  }

  useEffect(() => {
    loadProducts().catch(() => {
      setStatus({ type: 'error', message: 'No fue posible cargar productos.' })
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setForm({
      name: selected.name,
      description: selected.description,
      category: selected.category,
      price: selected.price,
      images: joinLines(selected.images),
      tags: joinLines(selected.tags),
      specs: joinLines(selected.specs),
      personalization: selected.personalization,
      minOrder: selected.minOrder,
      leadTime: selected.leadTime,
      availability: selected.availability,
      badge: selected.badge ?? '',
      sampleEligible: selected.sampleEligible,
      isActive: selected.isActive,
    })
  }, [selected])

  const handleCreateNew = () => {
    setSelectedId(null)
    setForm(emptyForm)
    setStatus(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus(null)

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      images: splitLines(form.images),
      tags: splitLines(form.tags),
      specs: splitLines(form.specs),
      personalization: form.personalization,
      minOrder: form.minOrder,
      leadTime: form.leadTime,
      availability: form.availability,
      badge: form.badge ? form.badge : null,
      sampleEligible: form.sampleEligible,
      isActive: form.isActive,
    }

    try {
      if (selected) {
        const updated = await adminFetch<AdminProduct>(`/api/admin/products/${selected.id}`, {
          method: 'PUT',
          json: payload,
        })
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        setSelectedId(updated.id)
        setStatus({ type: 'success', message: 'Producto actualizado.' })
      } else {
        const created = await adminFetch<AdminProduct>('/api/admin/products', {
          method: 'POST',
          json: payload,
        })
        setProducts((prev) => [created, ...prev])
        setSelectedId(created.id)
        setStatus({ type: 'success', message: 'Producto creado.' })
      }
    } catch {
      setStatus({ type: 'error', message: 'Revisa los campos requeridos.' })
    }
  }

  const handleDeactivate = async () => {
    if (!selected) return
    await adminFetch<AdminProduct>(`/api/admin/products/${selected.id}`, { method: 'DELETE' })
    await loadProducts()
    setStatus({ type: 'success', message: 'Producto desactivado.' })
  }

  return (
    <div className="admin-grid admin-grid--2">
      <section className="admin-card">
        <div className="admin-form__actions">
          <h2 style={{ margin: 0 }}>Productos</h2>
          <button type="button" className="button button--primary" onClick={handleCreateNew}>
            Nuevo
          </button>
        </div>
        <table className="admin-table" aria-label="Listado de productos">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <button
                    type="button"
                    className="link"
                    onClick={() => setSelectedId(product.id)}
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    {product.name}
                  </button>
                </td>
                <td>{product.category}</td>
                <td>{product.price}</td>
                <td>{product.isActive ? 'Activo' : 'Inactivo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2 style={{ marginTop: 0 }}>{selected ? 'Editar producto' : 'Crear producto'}</h2>

        {status && (
          <div className="admin-status" data-variant={status.type} role="status" aria-live="polite">
            {status.message}
          </div>
        )}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form__row">
            <div>
              <label htmlFor="prod-name">Nombre</label>
              <input
                id="prod-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="prod-category">Categoría</label>
              <select
                id="prod-category"
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, category: event.target.value as ProductCategory }))
                }
              >
                <option value="graduaciones">graduaciones</option>
                <option value="marketing">marketing</option>
              </select>
            </div>
          </div>

          <label htmlFor="prod-description">Descripción</label>
          <textarea
            id="prod-description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            required
          />

          <div className="admin-form__row">
            <div>
              <label htmlFor="prod-price">Precio (desde)</label>
              <input
                id="prod-price"
                type="number"
                min={1}
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
                required
              />
            </div>
            <div>
              <label htmlFor="prod-availability">Disponibilidad</label>
              <select
                id="prod-availability"
                value={form.availability}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    availability: event.target.value as AvailabilityLabel,
                  }))
                }
              >
                <option value="Disponible">Disponible</option>
                <option value="A pedido">A pedido</option>
              </select>
            </div>
          </div>

          <label htmlFor="prod-images">Imágenes (una por línea)</label>
          <textarea
            id="prod-images"
            rows={3}
            value={form.images}
            onChange={(event) => setForm((prev) => ({ ...prev, images: event.target.value }))}
            required
          />

          <label htmlFor="prod-tags">Tags (uno por línea)</label>
          <textarea
            id="prod-tags"
            rows={2}
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            required
          />

          <label htmlFor="prod-specs">Specs (uno por línea)</label>
          <textarea
            id="prod-specs"
            rows={2}
            value={form.specs}
            onChange={(event) => setForm((prev) => ({ ...prev, specs: event.target.value }))}
            required
          />

          <div className="admin-form__row">
            <div>
              <label htmlFor="prod-leadtime">Lead time</label>
              <input
                id="prod-leadtime"
                value={form.leadTime}
                onChange={(event) => setForm((prev) => ({ ...prev, leadTime: event.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="prod-minorder">MOQ</label>
              <input
                id="prod-minorder"
                value={form.minOrder}
                onChange={(event) => setForm((prev) => ({ ...prev, minOrder: event.target.value }))}
                required
              />
            </div>
          </div>

          <label htmlFor="prod-personalization">Personalización</label>
          <textarea
            id="prod-personalization"
            rows={2}
            value={form.personalization}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, personalization: event.target.value }))
            }
            required
          />

          <div className="admin-form__row">
            <div>
              <label htmlFor="prod-badge">Badge (opcional)</label>
              <input
                id="prod-badge"
                value={form.badge}
                onChange={(event) => setForm((prev) => ({ ...prev, badge: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="prod-sample">¿Muestra disponible?</label>
              <select
                id="prod-sample"
                value={form.sampleEligible ? 'yes' : 'no'}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, sampleEligible: event.target.value === 'yes' }))
                }
              >
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <div className="admin-form__actions">
            <button type="submit" className="button button--accent">
              {selected ? 'Guardar cambios' : 'Crear producto'}
            </button>
            {selected && selected.isActive && (
              <button type="button" className="button button--ghost" onClick={handleDeactivate}>
                Desactivar
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}

export default AdminProductsPage

