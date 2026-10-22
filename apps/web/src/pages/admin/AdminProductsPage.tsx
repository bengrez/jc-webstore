import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  LOCAL_IMAGE_PATTERN,
  PRODUCT_FIELD_LABELS,
  PRODUCT_FIELD_ORDER,
  validateProductInput,
} from '../../../../server/src/shared/product-rules'
import type { ProductField, ProductFieldErrors } from '../../../../server/src/shared/product-rules'
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
  stockNote?: string | null
  isActive: boolean
  options: AdminProductOption[]
}

const splitLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const joinLines = (values: string[]) => values.join('\n')

// Mismas reglas que el server (shared/product-rules.ts): sólo imágenes de nuestro dominio.
// Las externas de productos antiguas no se ven en el sitio (CSP) y no se pueden guardar.
const isLocalImage = (url: string) => LOCAL_IMAGE_PATTERN.test(url)

const emptyForm = {
  name: '',
  description: '',
  category: 'graduaciones' as ProductCategory,
  price: 0,
  images: [] as string[],
  tags: '',
  specs: '',
  personalization: '',
  minOrder: '',
  leadTime: '',
  availability: 'A pedido' as AvailabilityLabel,
  badge: '',
  sampleEligible: true,
  stockNote: '',
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
  images: [...product.images],
  tags: joinLines(product.tags),
  specs: joinLines(product.specs),
  personalization: product.personalization,
  minOrder: product.minOrder,
  leadTime: product.leadTime,
  availability: product.availability,
  badge: product.badge ?? '',
  sampleEligible: product.sampleEligible,
  stockNote: product.stockNote ?? '',
  isActive: product.isActive,
})

const PREVIEW_PLACEHOLDER_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#ecefe8"/><text x="200" y="155" font-family="sans-serif" font-size="20" fill="#8a9185" text-anchor="middle">Agrega una imagen</text></svg>'
  )

// Lo que se envía al guardar. Las reglas (validateProductInput) las comparte el servidor, así que
// lo que el formulario da por bueno es lo que el servidor acepta.
const buildPayload = (form: typeof emptyForm, isActive = form.isActive) => ({
  name: form.name,
  description: form.description,
  category: form.category,
  price: Number(form.price),
  images: form.images,
  tags: splitLines(form.tags),
  specs: splitLines(form.specs),
  personalization: form.personalization,
  minOrder: form.minOrder,
  leadTime: form.leadTime,
  availability: form.availability,
  badge: form.badge ? form.badge : null,
  sampleEligible: form.sampleEligible,
  stockNote: form.stockNote ? form.stockNote : null,
  isActive,
})

const validateForm = (form: typeof emptyForm) => validateProductInput(buildPayload(form))

const getMissingFields = (form: typeof emptyForm) =>
  PRODUCT_FIELD_ORDER.filter((field) => validateForm(form)[field]).map((field) => PRODUCT_FIELD_LABELS[field])

// Id del control de cada campo, para enfocar el primero con error
const FIELD_IDS: Record<ProductField, string> = {
  name: 'prod-name',
  category: 'prod-category',
  description: 'prod-description',
  price: 'prod-price',
  availability: 'prod-availability',
  leadTime: 'prod-leadtime',
  minOrder: 'prod-minorder',
  images: 'prod-images',
  tags: 'prod-tags',
  specs: 'prod-specs',
  personalization: 'prod-personalization',
  badge: 'prod-badge',
  stockNote: 'prod-stock-note',
}

const orderedFields = (errors: ProductFieldErrors) => PRODUCT_FIELD_ORDER.filter((field) => errors[field])

const summaryMessage = (errors: ProductFieldErrors) =>
  `No se guardó: revisa ${orderedFields(errors).map((field) => PRODUCT_FIELD_LABELS[field]).join(', ')}. Los campos están marcados abajo.`

// Traduce el error del servidor a un mensaje por campo y un aviso general en palabras simples.
// El servidor responde `fieldErrors` en los 400; cualquier otra falla tampoco queda en un «error genérico».
const describeSaveError = (error: unknown): { fieldErrors: ProductFieldErrors; message: string } => {
  const payload = (typeof error === 'object' && error !== null ? error : {}) as {
    error?: string
    message?: string
    fieldErrors?: Record<string, unknown>
  }
  const fieldErrors: ProductFieldErrors = {}
  if (payload.fieldErrors && typeof payload.fieldErrors === 'object') {
    for (const field of PRODUCT_FIELD_ORDER) {
      const text = payload.fieldErrors[field]
      if (typeof text === 'string' && text) fieldErrors[field] = text
    }
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, message: summaryMessage(fieldErrors) }
  if (payload.error === 'unauthorized') {
    return { fieldErrors, message: 'Tu sesión venció. Vuelve a ingresar y guarda de nuevo.' }
  }
  if (payload.message) return { fieldErrors, message: `No se guardó: ${payload.message}` }
  return {
    fieldErrors,
    message: 'No se pudo guardar el producto por un problema del servidor. Espera un momento y vuelve a intentarlo.',
  }
}

// Mensaje bajo un campo
const FieldError = ({ field, errors }: { field: ProductField; errors: ProductFieldErrors }) =>
  errors[field] ? (
    <p className="admin-field-error" id={`${FIELD_IDS[field]}-error`} role="alert">
      {errors[field]}
    </p>
  ) : null

// Atributos de accesibilidad de un control con posible error
const invalidProps = (field: ProductField, errors: ProductFieldErrors) =>
  errors[field]
    ? { 'aria-invalid': true as const, 'aria-describedby': `${FIELD_IDS[field]}-error` }
    : {}

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
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  // Errores por campo; tras el primer intento de guardar se recalculan al escribir
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({})
  const [attempted, setAttempted] = useState(false)

  // Image manager state
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Options state
  const [optionForm, setOptionForm] = useState(emptyOptionForm)
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null)
  const [optionStatus, setOptionStatus] = useState<null | { type: 'error' | 'success'; message: string }>(null)
  const [showOptionForm, setShowOptionForm] = useState(false)
  const formSectionRef = useRef<HTMLElement>(null)

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
    if (attempted) setFieldErrors(validateForm(form))
  }, [form, attempted])

  const resetErrors = () => {
    setAttempted(false)
    setFieldErrors({})
  }

  const focusField = (field: ProductField) => {
    const element = document.getElementById(FIELD_IDS[field])
    element?.scrollIntoView({ block: 'center' })
    element?.focus({ preventScroll: true })
  }

  // Se carga el formulario sólo al cambiar de producto: guardar una opción reemplaza el objeto
  // del producto y no debe borrar lo que el admin está editando ni el aviso de la opción.
  const loadedProductIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!selected || loadedProductIdRef.current === selected.id) return
    loadedProductIdRef.current = selected.id
    setConfirmDeactivate(false)
    resetErrors()
    setForm(productToForm(selected))
    setShowOptionForm(false)
    setEditingOptionId(null)
    setOptionStatus(null)
  }, [selected])

  const handleCreateNew = () => {
    loadedProductIdRef.current = null
    setSelectedId(null)
    setForm(emptyForm)
    resetErrors()
    setStatus(null)
    setConfirmDeactivate(false)
    setShowOptionForm(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus(null)

    // Se valida antes de enviar: si falta algo, se marca cada campo y no se llama al servidor
    const errors = validateForm(form)
    setAttempted(true)
    setFieldErrors(errors)
    const [first] = orderedFields(errors)
    if (first) {
      setStatus({ type: 'error', message: summaryMessage(errors) })
      focusField(first)
      return
    }

    const payload = buildPayload(form)

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
      resetErrors()
    } catch (error) {
      showSaveError(error)
    }
  }

  // El servidor rechazó el guardado: se marca cada campo con su motivo
  const showSaveError = (error: unknown) => {
    const { fieldErrors: serverErrors, message } = describeSaveError(error)
    setAttempted(false)
    setFieldErrors(serverErrors)
    setStatus({ type: 'error', message })
    const [first] = orderedFields(serverErrors)
    if (first) focusField(first)
  }

  const handleDeactivate = async () => {
    if (!selected) return
    await adminFetch<AdminProduct>(`/api/admin/products/${selected.id}`, { method: 'DELETE' })
    await loadProducts()
    setStatus({ type: 'success', message: 'Producto desactivado.' })
  }

  const handleReactivate = async () => {
    if (!selected) return
    setStatus(null)
    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) {
      setAttempted(true)
      setFieldErrors(errors)
      setStatus({ type: 'error', message: `No se reactivó: ${summaryMessage(errors).replace('No se guardó: ', '')}` })
      focusField(orderedFields(errors)[0])
      return
    }
    try {
      const updated = await adminFetch<AdminProduct>(`/api/admin/products/${selected.id}`, {
        method: 'PUT',
        json: buildPayload(form, true),
      })
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setSelectedId(updated.id)
      setStatus({ type: 'success', message: 'Producto reactivado.' })
    } catch (error) {
      showSaveError(error)
    }
  }

  // Image manager handlers
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/uploads/product-image', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string }
      // El server explica el motivo (tipo no permitido, más de 5 MB): se muestra tal cual
      if (!res.ok || !data.url) throw new Error(data.message ?? 'No se pudo subir la imagen. Intenta de nuevo.')
      const url = data.url
      setForm((prev) => ({ ...prev, images: [...prev.images, url] }))
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo subir la imagen. Intenta de nuevo.',
      })
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (i: number) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))

  const handleMoveImage = (i: number, dir: 'up' | 'down') =>
    setForm((prev) => {
      const next = [...prev.images]
      const swap = dir === 'up' ? i - 1 : i + 1
      ;[next[i], next[swap]] = [next[swap], next[i]]
      return { ...prev, images: next }
    })

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
    // Como en la tienda: las imágenes externas no se muestran
    const images = form.images.filter(isLocalImage)
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
      {/* ── Listado ── */}
      <section className="admin-card admin-products__list">
        <div className="admin-form__actions">
          <h2 style={{ margin: 0 }}>Productos</h2>
          <button type="button" className="button button--primary" onClick={handleCreateNew}>
            Nuevo producto
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
            {products.map((p) => (
              <tr
                key={p.id}
                className={`admin-table__row--clickable${selectedId === p.id ? ' admin-table__row--selected' : ''}`}
                onClick={() => {
                  setSelectedId(p.id)
                  setConfirmDeactivate(false)
                  // En pantallas medianas el listado va arriba: llevamos al formulario.
                  if (window.innerWidth < 1280) {
                    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
              >
                <td>{p.name}</td>
                <td className="admin-products__extra-col">
                  <span className={`admin-badge ${p.category === 'graduaciones' ? 'admin-badge--grad' : 'admin-badge--mkt'}`}>
                    {p.category === 'graduaciones' ? 'Graduaciones' : 'Marketing'}
                  </span>
                </td>
                <td className="admin-products__extra-col">{p.price.toLocaleString('es-CL')}</td>
                <td>
                  <span className={`admin-badge ${p.isActive ? 'admin-badge--active' : 'admin-badge--inactive'}`}>
                    {p.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Formulario (al centro) y vista previa en vivo (a la derecha) ── */}
      <section className="admin-card admin-products__form" ref={formSectionRef}>
        <h2 style={{ marginTop: 0 }}>{selected ? 'Editar producto' : 'Crear producto'}</h2>

        {status && (
          <div className="admin-status" data-variant={status.type} role={status.type === 'error' ? 'alert' : 'status'} aria-live="polite">
            {status.message}
          </div>
        )}

        <form className="admin-form" onSubmit={handleSubmit} noValidate>

          {/* ── Información básica ── */}
          <div className="admin-form-section">
            <h4 className="admin-form-section__title">Información básica</h4>

            <div className="admin-form__row">
              <div>
                <label htmlFor="prod-name">Nombre</label>
                <input
                  id="prod-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  aria-required="true"
                  {...invalidProps('name', fieldErrors)}
                />
                <FieldError field="name" errors={fieldErrors} />
              </div>
              <div>
                <label htmlFor="prod-category">Categoría</label>
                <select
                  id="prod-category"
                  {...invalidProps('category', fieldErrors)}
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value as ProductCategory }))
                  }
                >
                  <option value="graduaciones">Graduaciones</option>
                  <option value="marketing">Marketing</option>
                </select>
                <FieldError field="category" errors={fieldErrors} />
              </div>
            </div>

            <label htmlFor="prod-description">Descripción</label>
            <textarea
              id="prod-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              aria-required="true"
              {...invalidProps('description', fieldErrors)}
            />
            <FieldError field="description" errors={fieldErrors} />
          </div>

          {/* ── Precio y logística ── */}
          <div className="admin-form-section">
            <h4 className="admin-form-section__title">Precio y logística</h4>

            <div className="admin-form__row">
              <div>
                <label htmlFor="prod-price">Precio (desde, en CLP)</label>
                <input
                  id="prod-price"
                  type="number"
                  inputMode="numeric"
                  value={form.price === 0 ? '' : form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="Ej: 15990"
                  aria-required="true"
                  {...invalidProps('price', fieldErrors)}
                />
                <FieldError field="price" errors={fieldErrors} />
              </div>
              <div>
                <label htmlFor="prod-availability">Disponibilidad</label>
                <select
                  id="prod-availability"
                  {...invalidProps('availability', fieldErrors)}
                  value={form.availability}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      availability: e.target.value as AvailabilityLabel,
                    }))
                  }
                >
                  <option value="Disponible">Disponible</option>
                  <option value="A pedido">A pedido</option>
                </select>
                <FieldError field="availability" errors={fieldErrors} />
              </div>
            </div>

            <div className="admin-form__row">
              <div>
                <label htmlFor="prod-leadtime">Tiempo de entrega</label>
                <input
                  id="prod-leadtime"
                  value={form.leadTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, leadTime: e.target.value }))}
                  placeholder="Ej: 7–10 días hábiles"
                  aria-required="true"
                  {...invalidProps('leadTime', fieldErrors)}
                />
                <FieldError field="leadTime" errors={fieldErrors} />
              </div>
              <div>
                <label htmlFor="prod-minorder">Pedido mínimo (MOQ)</label>
                <input
                  id="prod-minorder"
                  value={form.minOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, minOrder: e.target.value }))}
                  placeholder="Ej: Mínimo 50 unidades"
                  aria-required="true"
                  {...invalidProps('minOrder', fieldErrors)}
                />
                <FieldError field="minOrder" errors={fieldErrors} />
              </div>
            </div>
          </div>

          {/* ── Imágenes ── */}
          <div className="admin-form-section">
            <h4 className="admin-form-section__title">Fotos</h4>

            <div
              className={`admin-image-manager${fieldErrors.images ? ' admin-image-manager--invalid' : ''}`}
              id="prod-images"
              tabIndex={-1}
            >
              {form.images.length === 0 && (
                <p className="admin-image-empty">Sin fotos. Sube al menos una.</p>
              )}
              {form.images.some((url) => !isLocalImage(url)) && (
                <div className="admin-status" data-variant="error" role="alert">
                  Este producto tiene imágenes externas (de otro sitio). No se muestran en la tienda y no se
                  puede guardar con ellas: súbelas de nuevo con «Subir imagen» y elimina las marcadas.
                </div>
              )}
              {form.images.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className={`admin-image-row${isLocalImage(url) ? '' : ' admin-image-row--external'}`}
                >
                  {isLocalImage(url) ? (
                    <img src={url} alt="" className="admin-image-thumb" />
                  ) : (
                    <span className="admin-image-thumb admin-image-thumb--external" aria-hidden="true">!</span>
                  )}
                  <span className="admin-image-url" title={url}>
                    {isLocalImage(url) ? url.split('/').pop() : `Externa, no se muestra: ${url}`}
                  </span>
                  <div className="admin-image-controls">
                    <button
                      type="button"
                      onClick={() => handleMoveImage(i, 'up')}
                      disabled={i === 0}
                      title="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveImage(i, 'down')}
                      disabled={i === form.images.length - 1}
                      title="Bajar"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="admin-image-remove"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              <div className="admin-image-actions">
                <label className={`button button--ghost admin-image-upload-btn${uploadingImage ? ' is-loading' : ''}`}>
                  {uploadingImage ? 'Subiendo…' : '+ Subir imagen'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleImageUpload(f)
                    }}
                  />
                </label>

              </div>
            </div>
            <FieldError field="images" errors={fieldErrors} />
          </div>

          {/* ── Detalles ── */}
          <div className="admin-form-section">
            <h4 className="admin-form-section__title">Detalles</h4>

            <label htmlFor="prod-tags">Etiquetas (una por línea)</label>
            <textarea
              id="prod-tags"
              rows={2}
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              aria-required="true"
              {...invalidProps('tags', fieldErrors)}
            />
            <FieldError field="tags" errors={fieldErrors} />

            <label htmlFor="prod-specs">Características (una por línea)</label>
            <textarea
              id="prod-specs"
              rows={2}
              value={form.specs}
              onChange={(e) => setForm((prev) => ({ ...prev, specs: e.target.value }))}
              aria-required="true"
              {...invalidProps('specs', fieldErrors)}
            />
            <FieldError field="specs" errors={fieldErrors} />

            <label htmlFor="prod-personalization">Personalización</label>
            <textarea
              id="prod-personalization"
              rows={2}
              value={form.personalization}
              onChange={(e) => setForm((prev) => ({ ...prev, personalization: e.target.value }))}
              aria-required="true"
              {...invalidProps('personalization', fieldErrors)}
            />
            <FieldError field="personalization" errors={fieldErrors} />

            <div className="admin-form__row">
              <div>
                <label htmlFor="prod-badge">Badge (opcional)</label>
                <input
                  id="prod-badge"
                  value={form.badge}
                  onChange={(e) => setForm((prev) => ({ ...prev, badge: e.target.value }))}
                  placeholder="Ej: Nuevo, Popular…"
                  {...invalidProps('badge', fieldErrors)}
                />
                <FieldError field="badge" errors={fieldErrors} />
              </div>
              <div>
                <label htmlFor="prod-sample">¿Muestra disponible?</label>
                <select
                  id="prod-sample"
                  value={form.sampleEligible ? 'yes' : 'no'}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sampleEligible: e.target.value === 'yes' }))
                  }
                >
                  <option value="yes">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            <label htmlFor="prod-stock-note">Nota de stock (visible al cliente, opcional)</label>
            <input
              id="prod-stock-note"
              value={form.stockNote}
              onChange={(e) => setForm((prev) => ({ ...prev, stockNote: e.target.value }))}
              placeholder="Ej: Últimas 30 unidades, Sin stock hasta abril…"
              {...invalidProps('stockNote', fieldErrors)}
            />
            <FieldError field="stockNote" errors={fieldErrors} />
          </div>

          {/* ── Actions ── */}
          <div className="admin-form__actions">
            <button type="submit" className="button button--accent">
              {selected ? 'Guardar cambios' : 'Crear producto'}
            </button>
            {selected && selected.isActive && !confirmDeactivate && (
              <button
                type="button"
                className="button button--ghost"
                style={{ color: 'rgb(140, 40, 40)', borderColor: 'rgba(199, 62, 62, 0.35)' }}
                onClick={() => setConfirmDeactivate(true)}
              >
                Desactivar
              </button>
            )}
            {selected && !selected.isActive && (
              <button type="button" className="button button--ghost" onClick={handleReactivate}>
                Reactivar producto
              </button>
            )}
          </div>
        </form>

        {confirmDeactivate && (
          <div className="admin-confirm-row">
            <span>¿Seguro que quieres desactivar este producto?</span>
            <button
              type="button"
              className="button button--ghost"
              style={{ color: 'rgb(140, 40, 40)', borderColor: 'rgba(199, 62, 62, 0.35)' }}
              onClick={async () => { await handleDeactivate(); setConfirmDeactivate(false) }}
            >
              Sí, desactivar
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setConfirmDeactivate(false)}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ── Options section ── */}
        {selected && (
          <div className="admin-form-section admin-form-section--options">
            <div className="admin-form__actions" style={{ marginBottom: 4 }}>
              <h4 className="admin-form-section__title" style={{ fontSize: '0.9rem' }}>
                Opciones de personalización
              </h4>
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
                    <th>Etiqueta</th>
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
                  <label>Etiqueta</label>
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
