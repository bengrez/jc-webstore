import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { adminFetch } from './adminApi'
import './admin.css'

type ProductCategory = 'graduaciones' | 'marketing'
type AvailabilityLabel = 'Disponible' | 'A pedido'
type ProductOptionType = 'COLOR' | 'TEXT' | 'FILE'

type AdminProductOption = {
  id: number
  type: ProductOptionType
  label: string
  required: boolean
  choices: Array<{ label: string; value: string }>
  sortOrder: number
}

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
  options: AdminProductOption[]
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

const emptyOptionForm = {
  type: 'TEXT' as ProductOptionType,
  label: '',
  required: false,
  sortOrder: 0,
  choices: [] as Array<{ label: string; value: string }>,
}

const AdminProductsPage = () => {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState<null | { type: 'error' | 'success'; message: string }>(null)

  // Options state
  const [optionForm, setOptionForm] = useState(emptyOptionForm)
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null)
  const [optionStatus, setOptionStatus] = useState<null | { type: 'error' | 'success'; message: string }>(null)
  const [showOptionForm, setShowOptionForm] = useState(false)

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
    setShowOptionForm(false)
    setEditingOptionId(null)
    setOptionStatus(null)
  }, [selected])

  const handleCreateNew = () => {
    setSelectedId(null)
    setForm(emptyForm)
    setStatus(null)
    setShowOptionForm(false)
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

  // Option handlers
  const handleEditOption = (option: AdminProductOption) => {
    setEditingOptionId(option.id)
    setOptionForm({
      type: option.type,
      label: option.label,
      required: option.required,
      sortOrder: option.sortOrder,
      choices: [...option.choices],
    })
    setShowOptionForm(true)
  }

  const handleAddOption = () => {
    setEditingOptionId(null)
    setOptionForm(emptyOptionForm)
    setShowOptionForm(true)
  }

  const handleCancelOption = () => {
    setShowOptionForm(false)
    setEditingOptionId(null)
    setOptionForm(emptyOptionForm)
    setOptionStatus(null)
  }

  const handleSaveOption = async () => {
    if (!selected) return
    setOptionStatus(null)

    try {
      if (editingOptionId !== null) {
        const updated = await adminFetch<AdminProductOption>(
          `/api/admin/products/${selected.id}/options/${editingOptionId}`,
          { method: 'PUT', json: optionForm }
        )
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selected.id
              ? { ...p, options: p.options.map((o) => (o.id === updated.id ? updated : o)) }
              : p
          )
        )
        setOptionStatus({ type: 'success', message: 'Opción actualizada.' })
      } else {
        const created = await adminFetch<AdminProductOption>(
          `/api/admin/products/${selected.id}/options`,
          { method: 'POST', json: optionForm }
        )
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selected.id ? { ...p, options: [...p.options, created] } : p
          )
        )
        setOptionStatus({ type: 'success', message: 'Opción creada.' })
      }
      setShowOptionForm(false)
      setEditingOptionId(null)
      setOptionForm(emptyOptionForm)
    } catch {
      setOptionStatus({ type: 'error', message: 'No fue posible guardar la opción.' })
    }
  }

  const handleDeleteOption = async (optId: number) => {
    if (!selected) return
    await adminFetch(`/api/admin/products/${selected.id}/options/${optId}`, { method: 'DELETE' })
    setProducts((prev) =>
      prev.map((p) =>
        p.id === selected.id ? { ...p, options: p.options.filter((o) => o.id !== optId) } : p
      )
    )
  }

  const addChoice = () => {
    setOptionForm((prev) => ({ ...prev, choices: [...prev.choices, { label: '', value: '#000000' }] }))
  }

  const updateChoice = (index: number, field: 'label' | 'value', val: string) => {
    setOptionForm((prev) => {
      const next = [...prev.choices]
      next[index] = { ...next[index], [field]: val }
      return { ...prev, choices: next }
    })
  }

  const removeChoice = (index: number) => {
    setOptionForm((prev) => ({ ...prev, choices: prev.choices.filter((_, i) => i !== index) }))
  }

  const optionTypeLabel = (type: ProductOptionType) => {
    if (type === 'COLOR') return 'Color'
    if (type === 'TEXT') return 'Texto'
    return 'Archivo'
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

        {/* Options section – only shown when a product is selected */}
        {selected && (
          <div style={{ marginTop: 32, borderTop: '1px solid var(--color-divider)', paddingTop: 24 }}>
            <div className="admin-form__actions" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Opciones de personalización</h3>
              {!showOptionForm && (
                <button type="button" className="button button--primary" onClick={handleAddOption}>
                  Añadir opción
                </button>
              )}
            </div>

            {optionStatus && (
              <div className="admin-status" data-variant={optionStatus.type} role="status" aria-live="polite" style={{ marginBottom: 12 }}>
                {optionStatus.message}
              </div>
            )}

            {selected.options.length === 0 && !showOptionForm && (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
                Sin opciones. Añade colores, campos de texto o carga de archivos.
              </p>
            )}

            {selected.options.length > 0 && (
              <table className="admin-table" style={{ marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Label</th>
                    <th>Obligatoria</th>
                    <th>Orden</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selected.options.map((opt) => (
                    <tr key={opt.id}>
                      <td>{optionTypeLabel(opt.type)}</td>
                      <td>{opt.label}</td>
                      <td>{opt.required ? 'Sí' : 'No'}</td>
                      <td>{opt.sortOrder}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="link"
                            style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.85rem' }}
                            onClick={() => handleEditOption(opt)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="link"
                            style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}
                            onClick={() => handleDeleteOption(opt.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {showOptionForm && (
              <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h4 style={{ margin: 0 }}>{editingOptionId !== null ? 'Editar opción' : 'Nueva opción'}</h4>

                <div className="admin-form__row">
                  <div>
                    <label>Tipo</label>
                    <select
                      value={optionForm.type}
                      onChange={(e) => setOptionForm((prev) => ({ ...prev, type: e.target.value as ProductOptionType, choices: [] }))}
                    >
                      <option value="TEXT">Texto</option>
                      <option value="COLOR">Color</option>
                      <option value="FILE">Archivo</option>
                    </select>
                  </div>
                  <div>
                    <label>Orden</label>
                    <input
                      type="number"
                      min={0}
                      value={optionForm.sortOrder}
                      onChange={(e) => setOptionForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <label>Label</label>
                  <input
                    value={optionForm.label}
                    onChange={(e) => setOptionForm((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="Ej: Color de ribete"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    id="opt-required"
                    type="checkbox"
                    checked={optionForm.required}
                    onChange={(e) => setOptionForm((prev) => ({ ...prev, required: e.target.checked }))}
                  />
                  <label htmlFor="opt-required" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Obligatoria</label>
                </div>

                {optionForm.type === 'COLOR' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label>Colores</label>
                      <button type="button" className="button button--ghost" style={{ padding: '4px 12px', fontSize: '0.82rem' }} onClick={addChoice}>
                        + Color
                      </button>
                    </div>
                    {optionForm.choices.map((choice, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <input
                          type="color"
                          value={choice.value}
                          onChange={(e) => updateChoice(i, 'value', e.target.value)}
                          style={{ width: 42, height: 34, padding: 2, border: '1px solid var(--color-divider)', borderRadius: 6, cursor: 'pointer' }}
                        />
                        <input
                          value={choice.label}
                          onChange={(e) => updateChoice(i, 'label', e.target.value)}
                          placeholder="Nombre del color"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => removeChoice(i)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="admin-form__actions">
                  <button type="button" className="button button--accent" onClick={handleSaveOption}>
                    {editingOptionId !== null ? 'Guardar cambios' : 'Crear opción'}
                  </button>
                  <button type="button" className="button button--ghost" onClick={handleCancelOption}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default AdminProductsPage
