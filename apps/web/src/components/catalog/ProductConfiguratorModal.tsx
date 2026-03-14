import { useEffect, useRef, useState } from 'react'
import type { Product, ProductOption } from '../../data/types'
import type { CartItemConfig } from '../../context/CartContext'
import { formatCurrency } from '../../utils/format'
import './product-configurator-modal.css'

type Props = {
  product: Product
  onClose: () => void
  onAdd: (product: Product, quantity: number, configuration: CartItemConfig[]) => void
}

const parseMinOrder = (minOrder: string): number => {
  const match = minOrder.match(/\d+/)
  return match ? Number(match[0]) : 1
}

const OptionField = ({
  option,
  value,
  onChange,
  uploading,
  onFileChange,
  uploadError,
}: {
  option: ProductOption
  value: string
  onChange: (value: string) => void
  uploading: boolean
  onFileChange: (file: File) => void
  uploadError: string | null
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (option.type === 'COLOR') {
    return (
      <div className="pcm-option__colors">
        {option.choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            className={`pcm-option__swatch ${value === choice.value ? 'is-selected' : ''}`}
            style={{ background: choice.value }}
            onClick={() => onChange(choice.value)}
            title={choice.label}
            aria-label={choice.label}
            aria-pressed={value === choice.value}
          />
        ))}
        {value && (
          <span className="pcm-option__color-label">
            {option.choices.find((c) => c.value === value)?.label ?? value}
          </span>
        )}
      </div>
    )
  }

  if (option.type === 'TEXT') {
    return (
      <input
        type="text"
        className="pcm-option__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Ej: ${option.label}...`}
      />
    )
  }

  if (option.type === 'FILE') {
    return (
      <div className="pcm-option__file">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileChange(file)
          }}
        />
        <button
          type="button"
          className="button button--ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Subiendo…' : 'Elegir archivo'}
        </button>
        {value && (
          <a href={value} target="_blank" rel="noopener noreferrer" className="pcm-option__file-link">
            {decodeURIComponent(value.split('/').pop() ?? value)}
          </a>
        )}
        {uploadError && <p className="pcm-option__error">{uploadError}</p>}
      </div>
    )
  }

  return null
}

const ProductConfiguratorModal = ({ product, onClose, onAdd }: Props) => {
  const minQty = parseMinOrder(product.minOrder)
  const [quantity, setQuantity] = useState(minQty)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selections, setSelections] = useState<Record<number, string>>({})
  const [uploading, setUploading] = useState<Record<number, boolean>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({})
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({})
  const backdropRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

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

  return (
    <div
      className="pcm-backdrop"
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Configurar ${product.name}`}
    >
      <div className="pcm-modal">
        <button type="button" className="pcm-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        <div className="pcm-layout">
          {/* Left: image gallery */}
          <div className="pcm-gallery">
            <div className="pcm-gallery__main">
              <img src={images[activeImageIndex]} alt={product.name} />
              {product.badge && <span className="pcm-gallery__badge">{product.badge}</span>}
            </div>
            {images.length > 1 && (
              <div className="pcm-gallery__thumbs">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`pcm-gallery__thumb ${i === activeImageIndex ? 'is-active' : ''}`}
                    onClick={() => setActiveImageIndex(i)}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: configuration */}
          <div className="pcm-config">
            <div className="pcm-config__header">
              <h2 className="pcm-config__name">{product.name}</h2>
              <span className="pcm-config__lead">{product.leadTime}</span>
            </div>
            <p className="pcm-config__price">{`Desde ${formatCurrency(product.price)} + IVA`}</p>
            <p className="pcm-config__description">{product.description}</p>

            {product.specs.length > 0 && (
              <ul className="pcm-config__specs">
                {product.specs.map((spec) => (
                  <li key={spec}>{spec}</li>
                ))}
              </ul>
            )}

            {product.options.length > 0 && (
              <div className="pcm-options">
                {product.options.map((option) => (
                  <div key={option.id} className="pcm-option">
                    <label className="pcm-option__label">
                      {option.label}
                      {option.required && <span className="pcm-option__required"> *</span>}
                    </label>
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
                      uploadError={uploadErrors[option.id] ?? null}
                    />
                    {validationErrors[option.id] && (
                      <p className="pcm-option__error" role="alert">
                        {validationErrors[option.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pcm-config__quantity">
              <span className="pcm-config__qty-label">Cantidad</span>
              <div className="pcm-qty-input">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
                  disabled={quantity <= minQty}
                  aria-label="Disminuir cantidad"
                >
                  –
                </button>
                <input
                  type="number"
                  min={minQty}
                  value={quantity}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (!Number.isNaN(val)) setQuantity(Math.max(minQty, val))
                  }}
                  aria-label="Cantidad"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
              {minQty > 1 && (
                <span className="pcm-config__moq">Mínimo {minQty} unidades</span>
              )}
            </div>

            <button
              type="button"
              className="button button--accent pcm-config__add"
              onClick={handleAdd}
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductConfiguratorModal
