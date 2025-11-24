import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Product } from '../../data/types'
import { formatCurrency } from '../../utils/format'
import './product-detail-modal.css'

type ProductDetailModalProps = {
  product: Product
  onClose: () => void
  onAddToCart?: (product: Product) => void
}

const ProductDetailModal = ({ product, onClose, onAddToCart }: ProductDetailModalProps) => {
  const [sampleForm, setSampleForm] = useState({ email: '', quantity: '10', comment: '' })
  const [logoName, setLogoName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setSampleForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoName(file.name)
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'logo_upload', productId: product.id, fileName: file.name })
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    console.log('sample-request', { productId: product.id, ...sampleForm })
  }

  return (
    <div className="product-modal" role="dialog" aria-modal="true" aria-label={`Detalles de ${product.name}`}>
      <div className="product-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="product-modal__panel">
        <header className="product-modal__header">
          <div>
            <p className="product-modal__eyebrow">Ficha técnica</p>
            <h2>{product.name}</h2>
            <p className="product-modal__meta">
              {product.availability || 'Disponible'} · {product.leadTime || 'Entrega coordinada'} ·{' '}
              {product.minOrder || 'MOQ flexible'}
            </p>
          </div>
          <button type="button" className="product-modal__close" onClick={onClose} aria-label="Cerrar ficha">
            ✕
          </button>
        </header>

        <div className="product-modal__body">
          <div className="product-modal__media">
            <img src={product.image} alt={product.name} loading="lazy" />
            <div className="product-modal__badges">
              {product.badge && <span>{product.badge}</span>}
              {product.sampleEligible && <span>Incluye kit de muestra</span>}
            </div>
            <div className="product-modal__price">
              <strong>{formatCurrency(product.price)}</strong>
              <span>Desde · valores antes de IVA</span>
            </div>
            <ul className="product-modal__specs">
              {product.specs?.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
              {product.personalization && <li>{product.personalization}</li>}
            </ul>
          </div>

          <div className="product-modal__form">
            <div className="product-modal__highlight">
              <p>Incluye revisión de arte y prueba digital previa a producción.</p>
              <p>Plazo expres: confirmar antes de 48 horas para bloquear fechas.</p>
              <p>Compartiremos un checklist de entregables para agilizar la aprobación.</p>
            </div>

            <form onSubmit={handleSubmit} className="product-modal__sample-form">
              <h3>Solicitar kit de muestra</h3>
              <label className="product-modal__label" htmlFor="email">
                Correo de contacto
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={sampleForm.email}
                  onChange={handleInputChange}
                  required
                  placeholder="correo@empresa.cl"
                />
              </label>
              <label className="product-modal__label" htmlFor="quantity">
                Cantidad estimada
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  value={sampleForm.quantity}
                  onChange={handleInputChange}
                />
              </label>
              <label className="product-modal__label" htmlFor="comment">
                Comentarios
                <textarea
                  id="comment"
                  name="comment"
                  rows={3}
                  value={sampleForm.comment}
                  onChange={handleInputChange}
                  placeholder="Colores, logo, fecha de entrega"
                />
              </label>
              <label className="product-modal__label product-modal__label--file">
                Subir logo o escudo (opcional)
                <input type="file" name="logo" accept="image/*,.pdf" onChange={handleFileChange} />
                <span className="product-modal__file-name">{logoName || 'Arrastra o selecciona archivo'}</span>
              </label>
              <div className="product-modal__cta-row">
                <button type="submit" className="button button--primary">
                  Enviar solicitud
                </button>
                {onAddToCart && (
                  <button type="button" className="button button--ghost" onClick={() => onAddToCart(product)}>
                    Añadir al carrito
                  </button>
                )}
              </div>
              {submitted && <p className="product-modal__success">Solicitud recibida. Te contactaremos en horas hábiles.</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailModal
