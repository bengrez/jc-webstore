import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Product } from '../../data/types'
import { adminFetch } from './adminApi'
import AdminProductPreview from './AdminProductPreview'
import type { PreviewState } from './AdminProductPreview'
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

const productToForm = (product: AdminProduct): typeof emptyForm => ({
  name: product.name,
  description: product.description,
  category: product.category,
  price: product.price,
  images: joinLines(product.images),
  tags: joinLines(product.tags),
  specs: joinLines(product.specs),
  personalization: product.personalization,
  minOrder: product.minOrder,
  leadTime: product.leadTime,
  availability: product.availability,
  badge: product.badge ?? '',
  sampleEligible: product.sampleEligible,
  isActive: product.isActive,
})

const PREVIEW_PLACEHOLDER_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#ecefe8"/><text x="200" y="155" font-family="sans-serif" font-size="20" fill="#8a9185" text-anchor="middle">Agrega una imagen</text></svg>'
  )

// Mismas reglas que valida el backend al guardar (productInputSchema).
const getMissingFields = (form: typeof emptyForm) => {
  const missing: string[] = []
  if (!form.name.trim()) missing.push('Nombre')
  if (!form.description.trim()) missing.push('Descripción')
  if (!Number.isInteger(Number(form.price)) || Number(form.price) <= 0) {
    missing.push('Precio (número entero mayor a 0)')
  }
  if (splitLines(form.images).length === 0) missing.push('Al menos una imagen')
  if (splitLines(form.tags).length === 0) missing.push('Al menos un tag')
  if (splitLines(form.specs).length === 0) missing.push('Al menos una característica (specs)')
  if (!form.personalization.trim()) missing.push('Personalización')
  if (!form.leadTime.trim()) missing.push('Plazo de entrega')
  if (!form.minOrder.trim()) missing.push('Pedido mínimo')
  return missing
}

const getWarnings = (form: typeof emptyForm) => {
  const warnings: string[] = []
  if (form.minOrder.trim() && !/\d/.test(form.minOrder)) {
    warnings.push('El pedido mínimo no tiene un número: el configurador partirá en 1 unidad.')
  }
  if (form.description.trim().length > 140) {
    warnings.push('La descripción es larga; en la tarjeta del catálogo puede verse muy alta.')
  }
  return warnings
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
  const formSectionRef = useRef<HTMLElement>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)

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
    setForm(productToForm(selected))
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

  const handleImageUpload = async (file: File) => {
    setImageUploading(true)
    setImageUploadError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const { url } = await adminFetch<{ url: string }>('/api/uploads/logo', {
        method: 'POST',
        body,
      })
      setForm((prev) => ({
        ...prev,
        images: prev.images.trim() ? `${prev.images.trim()}\n${url}` : url,
      }))
    } catch (error) {
      const message = (error as { message?: string })?.message
      setImageUploadError(message ?? 'No se pudo subir la imagen.')
    } finally {
      setImageUploading(false)
    }
  }

  // La vista previa incluye la opción que se está editando, aunque aún no se guarde.
  const draftOptions = useMemo(() => {
    const saved = selected?.options ?? []
    if (!showOptionForm || !optionForm.label.trim()) return saved
    const draft = { ...optionForm, id: editingOptionId ?? -1 }
    const merged =
      editingOptionId !== null
        ? saved.map((opt) => (opt.id === editingOptionId ? draft : opt))
        : [...saved, draft]
    return [...merged].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [selected, showOptionForm, optionForm, editingOptionId])

  const previewProduct = useMemo<Product>(() => {
    const images = splitLines(form.images)
    return {
      id: selected?.id ?? 'preview',
      name: form.name.trim() || 'Nombre del producto',
      description: form.description.trim() || 'Aquí aparecerá la descripción del producto.',
      price: Number(form.price) || 0,
      image: images[0] ?? PREVIEW_PLACEHOLDER_IMAGE,
      images: images.length > 0 ? images : [PREVIEW_PLACEHOLDER_IMAGE],
      category: form.category,
      leadTime: form.leadTime.trim(),
      availability: form.availability,
      badge: form.badge.trim() || null,
      tags: splitLines(form.tags),
      specs: splitLines(form.specs),
      personalization: form.personalization,
      minOrder: form.minOrder,
      sampleEligible: form.sampleEligible,
      options: draftOptions,
    }
  }, [form, selected, draftOptions])

  const isDirty = JSON.stringify(form) !== JSON.stringify(selected ? productToForm(selected) : emptyForm)
  const previewState: PreviewState = !selected
    ? isDirty
      ? 'draft'
      : 'new'
    : isDirty
      ? 'unsaved'
      : selected.isActive
        ? 'published'
        : 'inactive'

  const optionTypeLabel = (type: ProductOptionType) => {
    if (type === 'COLOR') return 'Color'
    if (type === 'TEXT') return 'Texto'
    return 'Archivo'
  }

  return (
    <div className="admin-grid admin-products">
      <section className="admin-card admin-products__list">
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
              <th className="admin-products__extra-col">Categoría</th>
              <th className="admin-products__extra-col">Precio</th>
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
                    onClick={() => {
                      setSelectedId(product.id)
                      // En pantallas medianas el listado va arriba: llevamos al formulario.
                      if (window.innerWidth < 1280) {
                        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    {product.name}
                  </button>
                </td>
                <td className="admin-products__extra-col">{product.category}</td>
                <td className="admin-products__extra-col">{product.price}</td>
                <td>{product.isActive ? 'Activo' : 'Inactivo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-card admin-products__form" ref={formSectionRef}>
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
          <div className="admin-form__upload">
            <label className="button button--ghost" aria-disabled={imageUploading}>
              {imageUploading ? 'Subiendo…' : 'Subir imagen'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                disabled={imageUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) handleImageUpload(file)
                }}
              />
            </label>
            <span>La primera imagen es la portada. Formato horizontal 4:3, máx. 5 MB.</span>
          </div>
          {imageUploadError && (
            <div className="admin-status" data-variant="error" role="alert">
              {imageUploadError}
            </div>
          )}

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

      <div className="admin-products__preview">
        <AdminProductPreview
          product={previewProduct}
          state={previewState}
          missing={getMissingFields(form)}
          warnings={getWarnings(form)}
          includesDraftOption={Boolean(selected) && showOptionForm && optionForm.label.trim() !== ''}
        />
      </div>
    </div>
  )
}

export default AdminProductsPage
