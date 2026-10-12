import { useEffect, useRef, useState } from 'react'
import type { Product, ProductOption } from '../../data/types'
import type { CartItemConfig } from '../../context/CartContext'
import { costura } from '../../design/costura'
import { formatCurrency } from '../../utils/format'
import '../../design/pages/configurator.css'

type Props = {
  product: Product
  onClose: () => void
  onAdd: (product: Product, quantity: number, configuration: CartItemConfig[]) => void
  /** Vista previa desde el admin: se ve igual, pero no sube archivos ni agrega al carrito. */
  preview?: boolean
  /** Edición desde el carrito: carga las opciones y la cantidad del ítem y el botón guarda en vez de agregar. */
  initial?: { quantity: number; configuration: CartItemConfig[] }
}

const parseMinOrder = (minOrder: string): number => {
  const match = minOrder.match(/\d+/)
  return match ? Number(match[0]) : 1
}

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg className="ic" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {d.split('|').map((p) => (
      <path key={p} d={p} />
    ))}
  </svg>
)

const CHECK = 'M5 12.5l4.5 4.5L19 7.5'
const WARN = 'M12 4l9 16H3L12 4z|M12 10v4M12 17v.01'

/** Color de la marca de selección según la claridad del círculo. */
const tickColor = (hex: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return '#fff'
  const n = parseInt(m[1], 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.6 ? '#18202D' : '#fff'
}

const tagOf = (option: ProductOption) => (option.required ? 'Obligatorio' : 'Opcional')

const OptionField = ({
  option,
  value,
  onChange,
  uploading,
  onFileChange,
  uploadError,
  invalid,
  disabled = false,
}: {
  option: ProductOption
  value: string
  onChange: (value: string) => void
  uploading: boolean
  onFileChange: (file: File) => void
  uploadError: string | null
  invalid: boolean
  disabled?: boolean
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const legId = `opt-${option.id}-l`
  const inId = `opt-${option.id}-in`

  if (option.type === 'COLOR') {
    const chosen = option.choices.find((c) => c.value === value)
    return (
      <div role="group" aria-labelledby={legId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="lbl">
          <span id={legId}>{option.label}</span>
          <span className="lbl-tag">{tagOf(option)}</span>
        </div>
        <div className="opt-sw">
          {option.choices.map((choice) => {
            const on = value === choice.value
            return (
              <button
                key={choice.value}
                type="button"
                className="sw"
                aria-pressed={on}
                aria-label={choice.label}
                title={choice.label}
                onClick={() => onChange(choice.value)}
              >
                <span className="sw-dot" style={{ background: choice.value }}>
                  {on && (
                    <svg className="ic" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ color: tickColor(choice.value) }}>
                      <path d={CHECK} />
                    </svg>
                  )}
                </span>
              </button>
            )
          })}
        </div>
        <p className="sw-name" aria-live="polite">
          {chosen ? (
            <>
              Elegido: <b>{chosen.label}</b>
            </>
          ) : value ? (
            <>
              Elegido: <b>{value}</b>
            </>
          ) : (
            'Elige una opción'
          )}
        </p>
      </div>
    )
  }

  if (option.type === 'TEXT') {
    return (
      <div className="field">
        <label htmlFor={inId}>
          <span>{option.label}</span>
          <span className="lbl-tag">{tagOf(option)}</span>
        </label>
        <input
          id={inId}
          type="text"
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Ej: ${option.label}...`}
          aria-invalid={invalid || undefined}
        />
      </div>
    )
  }

  if (option.type === 'FILE') {
    const fileName = value ? decodeURIComponent(value.split('/').pop() ?? value) : ''
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="lbl">
          <span>{option.label}</span>
          <span className="lbl-tag">{tagOf(option)}</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          style={{ display: 'none' }}
          tabIndex={-1}
          aria-label={option.label}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileChange(file)
            e.target.value = ''
          }}
        />
        {value ? (
          <div className="filerow">
            <Icon d="M7 3h7l4 4v14H7V3z|M14 3v4h4" size={20} />
            <a href={value} target="_blank" rel="noopener noreferrer" className="nm">
              {fileName}
            </a>
            <button type="button" className="btn-text is-danger" aria-label={`Quitar ${fileName}`} onClick={() => onChange('')} disabled={disabled}>
              Quitar
            </button>
          </div>
        ) : (
          <div className="drop">
            <span className="drop-ic">
              <Icon d="M12 16V5|M7.5 9.5L12 5l4.5 4.5|M5 19h14" size={22} />
            </span>
            <div className="drop-t">
              <b>Sube tu archivo</b>
              <span className="hint">Imagen o PDF.</span>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading || disabled}>
              {uploading ? 'Subiendo…' : 'Elegir archivo'}
            </button>
          </div>
        )}
        {uploadError && (
          <p className="err" role="alert">
            <Icon d={WARN} />
            <span>{uploadError}</span>
          </p>
        )}
      </div>
    )
  }

  return null
}

const ProductConfiguratorModal = ({ product, onClose, onAdd, preview = false, initial }: Props) => {
  const minQty = parseMinOrder(product.minOrder)
  const [quantity, setQuantity] = useState(initial ? Math.max(minQty, initial.quantity) : minQty)
  // Lo que el cliente está escribiendo; se ajusta al mínimo al salir del campo, no en cada tecla
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selections, setSelections] = useState<Record<number, string>>(() =>
    Object.fromEntries((initial?.configuration ?? []).map((entry) => [entry.optionId, entry.value]))
  )
  const [uploading, setUploading] = useState<Record<number, boolean>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({})
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({})
  const backdropRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [specsOpen, setSpecsOpen] = useState(false)

  // Escape cierra; Tab queda atrapado dentro del diálogo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const items = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      } else if (!dialogRef.current.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Foco inicial en el diálogo y devolución al elemento que lo abrió
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => opener?.focus?.()
  }, [])

  // La cinta de costura del header sigue el scroll del panel mientras el configurador está abierto
  useEffect(() => {
    costura.refresh()
    const later = window.setTimeout(costura.refresh, 400) // tras cargar fuentes e imágenes
    return () => {
      window.clearTimeout(later)
      costura.refresh()
    }
  }, [])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleFileUpload = async (option: ProductOption, file: File) => {
    setUploading((prev) => ({ ...prev, [option.id]: true }))
    setUploadErrors((prev) => ({ ...prev, [option.id]: '' }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/uploads/customer-logo', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('Error al subir el archivo.')
      const data = (await response.json()) as { url: string }
      setSelections((prev) => ({ ...prev, [option.id]: data.url }))
    } catch {
      setUploadErrors((prev) => ({ ...prev, [option.id]: 'No se pudo subir el archivo. Intenta nuevamente.' }))
    } finally {
      setUploading((prev) => ({ ...prev, [option.id]: false }))
    }
  }

  const handleAdd = () => {
    if (preview) return
    const errors: Record<number, string> = {}

    for (const option of product.options) {
      if (option.required && !selections[option.id]) {
        errors[option.id] = `${option.label} es obligatorio.`
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    const configuration: CartItemConfig[] = product.options
      .filter((opt) => selections[opt.id])
      .map((opt) => ({
        optionId: opt.id,
        label: opt.label,
        type: opt.type,
        value: selections[opt.id],
      }))

    onAdd(product, quantity, configuration)
    onClose()
  }

  const images = product.images.length > 0 ? product.images : [product.image]
  const errorList = Object.values(validationErrors)
  const available = product.availability === 'Disponible'
  const specsList = (
    <ul className="specs">
      {product.specs.map((spec) => (
        <li key={spec}>
          <Icon d={CHECK} />
          <span>{spec}</span>
        </li>
      ))}
    </ul>
  )
  const persText = product.personalization ? (
    <p className="t-small c-ink2">
      <b style={{ color: 'var(--tinta)' }}>Personalización:</b> {product.personalization}
    </p>
  ) : null

  return (
    <div
      className="ovl"
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      <div className="dlg" ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Configurar ${product.name}`} tabIndex={-1}>
        <button type="button" className="icon-btn dlg-x" onClick={onClose} aria-label="Cerrar">
          <Icon d="M6 6l12 12M18 6L6 18" size={22} />
        </button>

        <div className="dlg-body">
          <div className="dlg-gal">
            <div className="dlg-main">
              <img src={images[activeImageIndex]} alt={product.name} />
              {product.badge && <span className="badge">{product.badge}</span>}
            </div>
            {images.length > 1 && (
              <div className="thumbs">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    className="thumb"
                    aria-current={i === activeImageIndex}
                    onClick={() => setActiveImageIndex(i)}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
            <div className="hide-m" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
              <p className="t-body c-ink2">{product.description}</p>
              {product.specs.length > 0 && (
                <div>
                  <h3 className="t-label" style={{ marginBottom: 10 }}>Detalles del producto</h3>
                  {specsList}
                </div>
              )}
              {persText}
            </div>
          </div>

          <div className="dlg-cfg">
            <div className="dlg-head">
              <h2 className="dlg-title">{product.name}</h2>
              <div className="dlg-meta">
                <span className={`avail ${available ? 'avail-in' : 'avail-pre'}`}>
                  <span className="dot" />
                  {product.availability}
                </span>
                <span className="meta">
                  <Icon d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z|M12 7.5V12l3 2" size={15} />
                  {product.leadTime}
                </span>
              </div>
              {product.stockNote && <span className="hint">{product.stockNote}</span>}
            </div>
            <p className="price-big">
              Desde <strong>{formatCurrency(product.price)}</strong> por unidad + IVA
            </p>
            <p className="t-body c-ink2 show-m">{product.description}</p>

            {product.options.length > 0 && (
              <div className="opts">
                {product.options.map((option) => (
                  <div key={option.id} className="opt">
                    <OptionField
                      option={option}
                      value={selections[option.id] ?? ''}
                      onChange={(val) => {
                        setSelections((prev) => ({ ...prev, [option.id]: val }))
                        setValidationErrors((prev) => {
                          const next = { ...prev }
                          delete next[option.id]
                          return next
                        })
                      }}
                      uploading={uploading[option.id] ?? false}
                      onFileChange={(file) => handleFileUpload(option, file)}
                      uploadError={uploadErrors[option.id] || null}
                      invalid={Boolean(validationErrors[option.id])}
                      disabled={preview}
                    />
                    {validationErrors[option.id] && (
                      <p className="err" role="alert">
                        <Icon d={WARN} />
                        <span>{validationErrors[option.id]}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="field">
              <div className="lbl">
                <span id="qty-l">Cantidad</span>
                {minQty > 1 && <span className="lbl-tag">Mínimo {minQty} unidades</span>}
              </div>
              <div className="qty" role="group" aria-labelledby="qty-l">
                <button
                  type="button"
                  onClick={() => {
                    setQuantityDraft(null)
                    setQuantity((q) => Math.max(minQty, q - 1))
                  }}
                  disabled={quantity <= minQty}
                  aria-label="Disminuir cantidad"
                >
                  <Icon d="M5 12h14" size={20} />
                </button>
                <input
                  type="number"
                  min={minQty}
                  value={quantityDraft ?? quantity}
                  onChange={(e) => {
                    setQuantityDraft(e.target.value)
                    const val = Number(e.target.value)
                    if (Number.isInteger(val) && val >= minQty) setQuantity(val)
                  }}
                  onBlur={() => setQuantityDraft(null)}
                  aria-label="Cantidad"
                />
                <button
                  type="button"
                  onClick={() => {
                    setQuantityDraft(null)
                    setQuantity((q) => q + 1)
                  }}
                  aria-label="Aumentar cantidad"
                >
                  <Icon d="M12 5v14M5 12h14" size={20} />
                </button>
              </div>
            </div>

            {product.sampleEligible && (
              <p className="note">
                <Icon d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z|M12 11v5M12 8v.01" size={20} />
                <span>Hay muestras disponibles. Solicítalas antes de confirmar tu pedido.</span>
              </p>
            )}

            {(product.specs.length > 0 || product.personalization) && (
              <div className="acc show-m">
                <button type="button" className="acc-btn" aria-expanded={specsOpen} aria-controls="pcm-specs" onClick={() => setSpecsOpen((v) => !v)}>
                  <span>Especificaciones y personalización</span>
                  <Icon d="M6 9l6 6 6-6" size={20} />
                </button>
                {specsOpen && (
                  <div className="acc-body" id="pcm-specs">
                    {specsList}
                    {persText}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="dlg-foot">
          <div className="foot-sum">
            {errorList.length > 0 ? (
              <p className="foot-err" role="alert">
                <Icon d={WARN} />
                <span>{errorList.length === 1 ? errorList[0] : `Faltan ${errorList.length} datos obligatorios.`}</span>
              </p>
            ) : (
              <>
                <span className="t-cap c-muted">
                  Subtotal estimado<span className="hide-m">, {formatCurrency(product.price)} por unidad</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <strong>{formatCurrency(product.price * quantity)}</strong>
                  <span className="t-small c-muted">+ IVA</span>
                </span>
              </>
            )}
            {preview && (
              <span className="hint">Vista previa: así verá la ficha el cliente. Aquí no se agrega al carrito.</span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleAdd}
            disabled={preview}
            title={preview ? 'Vista previa: el botón funciona en el sitio publicado' : undefined}
          >
            {initial ? 'Guardar cambios' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductConfiguratorModal
