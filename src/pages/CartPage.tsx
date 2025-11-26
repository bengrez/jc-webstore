import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatCurrency } from '../utils/format'
import './cart.css'

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

const progressSteps = ['Selección', 'Cotización final']

const CartPage = () => {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart()
  const [form, setForm] = useState(initialFormState)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<null | { type: 'success' | 'error'; message: string }>(
    null
  )

  const hasItems = items.length > 0

  const handleQuantityButton = (productId: string, delta: number) => {
    const current = items.find((item) => item.id === productId)?.quantity ?? 0
    const next = Math.max(0, current + delta)
    updateQuantity(productId, next)
  }

  const handleQuantityInput = (productId: string, event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    if (Number.isNaN(value)) return
    updateQuantity(productId, Math.max(0, value))
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
    setStatus((prev) => (prev?.type === 'error' ? null : prev))
  }

  const validateForm = () => {
    const nextErrors: Record<string, string> = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phonePattern = /^\+?\d[\d .-]{7,}$/

    if (!form.name.trim()) {
      nextErrors.name = 'El nombre es obligatorio.'
    }

    if (!form.email.trim()) {
      nextErrors.email = 'El correo electrónico es obligatorio.'
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Ingresa un correo electrónico válido.'
    }

    if (form.phone.trim() && !phonePattern.test(form.phone.trim())) {
      nextErrors.phone = 'Ingresa un teléfono válido (incluye código de país).'
    }

    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasItems) {
      setStatus({ type: 'error', message: 'Agrega productos al carrito antes de enviar.' })
      return
    }

    const validationErrors = validateForm()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setStatus({ type: 'error', message: 'Revisa los campos requeridos antes de enviar.' })
      return
    }

    setErrors({})
    setStatus({ type: 'success', message: '¡Solicitud enviada! Te contactaremos pronto.' })
    setSubmitted(true)
    clearCart()
    setForm(initialFormState)
  }

  if (submitted) {
    return (
      <div className="cart-page">
        <header className="cart-header">
          <h1>Solicitud enviada</h1>
          <p>
            Gracias por confiar en Gradumarketing. Juany y el equipo revisarán tu selección y te
            responderán dentro de 24 horas hábiles con los próximos pasos.
          </p>
        </header>
        {status?.message && (
          <div className="cart-status" role="status" aria-live="polite" data-variant={status.type}>
            {status.message}
          </div>
        )}
        <div className="cart-success">
          <div className="cart-success__note">
            <p>
              <strong>“Tu proyecto ya está en mis manos.”</strong> — Juany, diseñadora y fundadora.
            </p>
            <span>Te enviaremos avances, prototipos o reuniones según lo necesites.</span>
          </div>
          <div className="cart-success__actions">
            <Link to="/catalogo" className="button button--primary">
              Volver al catálogo
            </Link>
            <Link to="/inicio" className="button button--ghost">
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <h1>Carrito de cotizaciones</h1>
        <p>
          Ajusta cantidades, elimina productos si lo necesitas y completa tus datos para recibir una
          cotización personalizada. El total es referencial y puede variar según personalización.
        </p>
      </header>

      <div className="cart-progress">
        {progressSteps.map((step, index) => (
          <div key={step} className="cart-progress__step" data-active={index === 0}>
            <span>{`0${index + 1}`}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>

      {!hasItems ? (
        <div className="cart-empty">
          <h2>Tu carrito está vacío</h2>
          <p>
            Agrega productos desde el catálogo para solicitar una cotización consolidada. Puedes
            cambiar de enfoque desde la portada principal si necesitas cotizar graduaciones o
            productos corporativos.
          </p>
          <Link to="/catalogo" className="button button--primary">
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items">
            {items.map((item) => (
              <article key={item.id} className="cart-item">
                <div className="cart-item__info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  {item.leadTime && <span className="cart-item__lead">{item.leadTime}</span>}
                </div>

                <div className="cart-item__controls">
                  <div className="cart-item__quantity">
                    <span className="cart-item__label">Cantidad</span>
                    <div className="cart-quantity-input">
                      <button
                        type="button"
                        onClick={() => handleQuantityButton(item.id, -1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Disminuir cantidad de ${item.name}`}
                      >
                        –
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => handleQuantityInput(item.id, event)}
                        aria-label={`Cantidad de ${item.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityButton(item.id, 1)}
                        aria-label={`Aumentar cantidad de ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-item__price">
                    <span className="cart-item__label">Precio unitario</span>
                    <strong>{formatCurrency(item.price)}</strong>
                  </div>

                  <div className="cart-item__subtotal">
                    <span className="cart-item__label">Subtotal</span>
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="cart-item__remove"
                  onClick={() => removeItem(item.id)}
                >
                  Eliminar
                </button>
              </article>
            ))}

            <Link to="/catalogo" className="link">
              Seguir explorando productos
            </Link>
          </section>

          <aside className="cart-sidebar">
            <div className="cart-summary">
              <h2>Resumen estimado</h2>
              <div className="cart-summary__row">
                <span>Subtotal</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
              <p className="cart-summary__note">
                Este valor no incluye personalización adicional ni transporte. Te enviaremos la
                cotización detallada con tiempos de entrega y ajustes necesarios.
              </p>
              <ul className="cart-summary__policy">
                <li>Incluimos prototipo digital antes de fabricar.</li>
                <li>Coordinamos entregas en Santiago o envíos a región.</li>
                <li>Pagos contra factura una vez aprobada la propuesta.</li>
              </ul>
            </div>

            <form className="cart-form" onSubmit={handleSubmit}>
              <h2>Datos para tu cotización</h2>

              {status?.type === 'error' && (
                <div className="cart-status" role="alert" aria-live="assertive" data-variant="error">
                  {status.message}
                </div>
              )}

              <label htmlFor="cart-name">Nombre y apellido</label>
              <input
                id="cart-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleInputChange}
                required
              />
              {errors.name && (
                <p className="cart-form__error" role="alert" aria-live="assertive">
                  {errors.name}
                </p>
              )}

              <label htmlFor="cart-email">Correo electrónico</label>
              <input
                id="cart-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && (
                <p className="cart-form__error" role="alert" aria-live="assertive">
                  {errors.email}
                </p>
              )}

              <label htmlFor="cart-phone">Teléfono</label>
              <input
                id="cart-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleInputChange}
                placeholder="+56 9 ..."
              />
              {errors.phone && (
                <p className="cart-form__error" role="alert" aria-live="assertive">
                  {errors.phone}
                </p>
              )}

              <label htmlFor="cart-message">Detalles adicionales</label>
              <textarea
                id="cart-message"
                name="message"
                rows={5}
                value={form.message}
                onChange={handleInputChange}
                placeholder="Incluye información sobre fechas, colores o personalización requerida."
              />

              <button type="submit" className="button button--accent">
                Enviar solicitud
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  )
}

export default CartPage
