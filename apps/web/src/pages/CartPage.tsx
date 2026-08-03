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
  const [submitted, setSubmitted] = useState<null | { folio: string; emailSent: boolean }>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<null | { type: 'success' | 'error'; message: string }>(
    null
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const hasItems = items.length > 0

  const handleQuantityButton = (cartItemKey: string, delta: number) => {
    const current = items.find((item) => item.cartItemKey === cartItemKey)?.quantity ?? 0
    const next = Math.max(0, current + delta)
    updateQuantity(cartItemKey, next)
  }

  const handleQuantityInput = (cartItemKey: string, event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    if (Number.isNaN(value)) return
    updateQuantity(cartItemKey, Math.max(0, value))
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
      nextErrors.phone = 'Ingresa un teléfono válido.'
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    setSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            message: form.message.trim() || null,
          },
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            configuration: item.configuration,
          })),
        }),
      })

      if (!response.ok) {
        setStatus({ type: 'error', message: 'No fue posible enviar tu solicitud. Intenta nuevamente.' })
        return
      }

      const payload = (await response.json()) as { folio: string; emailSent: boolean }

      setSubmitted({ folio: payload.folio, emailSent: payload.emailSent })
      setStatus({ type: 'success', message: '¡Solicitud enviada!' })
      clearCart()
      setForm(initialFormState)
      setErrors({})
    } catch {
      setStatus({ type: 'error', message: 'No fue posible enviar tu solicitud. Intenta nuevamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="cart-page">
        <header className="cart-header">
          <h1>Solicitud enviada</h1>
          <p>
            Gracias por confiar en Confecciones Juany. Responderemos dentro de 24 horas hábiles con tu
            cotización final.
          </p>
        </header>
        <div className="cart-summary">
          <div className="cart-summary__row">
            <span>Folio</span>
            <strong>{submitted.folio}</strong>
          </div>
          {!submitted.emailSent && (
            <p className="cart-summary__note">
              Registramos tu solicitud, pero no pudimos enviar el correo automático. Si no recibes
              respuesta pronto, contáctanos por los canales del sitio.
            </p>
          )}
        </div>
        <div className="cart-success">
          <div className="cart-success__note">
            <p>
              <strong>"Tu proyecto ya está en mis manos."</strong> — Juany, diseñadora y fundadora.
            </p>
            <span>Te enviaremos avances o prototipos según lo necesites.</span>
          </div>
          <div className="cart-success__actions">
            <Link to="/catalogo" className="button button--primary">
              Volver al catálogo
            </Link>
            <Link to="/" className="button button--ghost">
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
        <p>Ajusta cantidades y completa tus datos. Los valores son "desde" y van + IVA.</p>
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
          <p>Agrega productos y alterna entre modo Graduación o Corporativo según necesites.</p>
          <Link to="/catalogo" className="button button--primary">
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items">
            {items.map((item) => (
              <article key={item.cartItemKey} className="cart-item">
                <div className="cart-item__info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <span className="cart-item__lead">{item.leadTime}</span>
                  {item.configuration.length > 0 && (
                    <ul className="cart-item__config">
                      {item.configuration.map((entry) => (
                        <li key={entry.optionId}>
                          <span className="cart-item__config-label">{entry.label}:</span>{' '}
                          {entry.type === 'COLOR' ? (
                            <span className="cart-item__config-value">
                              <span
                                className="cart-item__config-swatch"
                                style={{ background: entry.value }}
                              />
                              {entry.value}
                            </span>
                          ) : entry.type === 'FILE' ? (
                            <a
                              href={entry.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cart-item__config-file"
                            >
                              {decodeURIComponent(entry.value.split('/').pop() ?? entry.value)}
                            </a>
                          ) : (
                            <span className="cart-item__config-value">{entry.value}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="cart-item__controls">
                  <div className="cart-item__quantity">
                    <span className="cart-item__label">Cantidad</span>
                    <div className="cart-quantity-input">
                      <button
                        type="button"
                        onClick={() => handleQuantityButton(item.cartItemKey, -1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Disminuir cantidad de ${item.name}`}
                      >
                        –
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => handleQuantityInput(item.cartItemKey, event)}
                        aria-label={`Cantidad de ${item.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityButton(item.cartItemKey, 1)}
                        aria-label={`Aumentar cantidad de ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-item__price">
                    <span className="cart-item__label">Precio unitario</span>
                    <strong>{`${formatCurrency(item.price)} + IVA`}</strong>
                  </div>

                  <div className="cart-item__subtotal">
                    <span className="cart-item__label">Subtotal</span>
                    <strong>{`${formatCurrency(item.price * item.quantity)} + IVA`}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="cart-item__remove"
                  onClick={() => removeItem(item.cartItemKey)}
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
                <strong>{`${formatCurrency(total)} + IVA`}</strong>
              </div>
              <p className="cart-summary__note">
                Valor referencial; sumamos personalización y despacho en la cotización final.
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

              <button type="submit" className="button button--accent" disabled={submitting}>
                {submitting ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  )
}

export default CartPage
