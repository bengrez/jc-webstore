import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import LegalConsent from '../components/legal/LegalConsent'
import { useCart } from '../context/CartContext'
import { LEGAL_VERSION } from '../data/legal'
import { formatCurrency } from '../utils/format'
import '../design/pages/cart.css'

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

const ICON_ERR = (
  <svg className="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 4l9 16H3L12 4z" />
    <path d="M12 10v4M12 17v.01" />
  </svg>
)

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={id} className="err" role="alert">
      {ICON_ERR}
      <span>{message}</span>
    </p>
  ) : null

const CartPage = () => {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart()
  const [form, setForm] = useState(initialFormState)
  const [submitted, setSubmitted] = useState<null | { folio: string; token: string; emailSent: boolean }>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<null | { type: 'success' | 'error'; message: string }>(
    null
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [legalAccepted, setLegalAccepted] = useState(false)

  const hasItems = items.length > 0

  const lines = useMemo(() => {
    const sum = (category: string) =>
      items.filter((i) => i.category === category).reduce((acc, i) => acc + i.price * i.quantity, 0)
    const count = (category: string) => items.filter((i) => i.category === category).length
    return {
      gCount: count('graduaciones'),
      pCount: count('marketing'),
      gTotal: sum('graduaciones'),
      pTotal: sum('marketing'),
    }
  }, [items])
  const plural = (n: number) => `${n} ${n === 1 ? 'producto' : 'productos'}`

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

    if (!legalAccepted) {
      nextErrors.legal = 'Debes aceptar el aviso de privacidad y los términos para enviar la solicitud.'
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
      const firstInvalid = validationErrors.name
        ? 'cart-name'
        : validationErrors.email
          ? 'cart-email'
          : validationErrors.phone
            ? 'cart-phone'
            : 'cart-legal'
      window.setTimeout(() => document.getElementById(firstInvalid)?.focus(), 0)
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
          legal: { accepted: legalAccepted, version: LEGAL_VERSION },
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
        // La aceptación legal trae su propio motivo (p. ej. documentos actualizados: recargar)
        const legalError = payload.error?.startsWith('legal_') ? payload.message : undefined
        setStatus({
          type: 'error',
          message: legalError ?? 'No fue posible enviar tu solicitud. Intenta nuevamente.',
        })
        return
      }

      const payload = (await response.json()) as { folio: string; token: string; emailSent: boolean }

      setSubmitted({ folio: payload.folio, token: payload.token, emailSent: payload.emailSent })
      setStatus({ type: 'success', message: '¡Solicitud enviada!' })
      clearCart()
      setForm(initialFormState)
      setErrors({})
      setLegalAccepted(false)
    } catch {
      setStatus({ type: 'error', message: 'No fue posible enviar tu solicitud. Intenta nuevamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="wrap" style={{ maxWidth: 800, paddingTop: 'clamp(36px,5vw,72px)', paddingBottom: 'clamp(48px,6vw,88px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start' }}>
          <span className="ok-badge">
            <svg className="ic" width="32" height="32" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <h1 className="t-h1">Solicitud enviada</h1>
          <p className="t-lead">
            Gracias por confiar en Confecciones Juany Reyes. Responderemos dentro de 24 horas hábiles con tu
            cotización final.
          </p>
          <div className="folio" style={{ width: '100%' }}>
            <span className="t-small c-ink2">Folio de tu solicitud</span>
            <b>{submitted.folio}</b>
          </div>
          {!submitted.emailSent && (
            <p className="hint" role="status">
              Registramos tu solicitud, pero no pudimos enviar el correo automático. Si no recibes respuesta
              pronto, contáctanos por los canales del sitio.
            </p>
          )}
          <figure style={{ margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <blockquote className="quote">“Tu proyecto ya está en mis manos.”</blockquote>
            <figcaption className="t-small c-ink2">
              Juany, diseñadora y fundadora. Te enviaremos avances o prototipos según lo necesites.
            </figcaption>
          </figure>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <Link
              to={`/cotizacion/${submitted.folio}?t=${encodeURIComponent(submitted.token)}`}
              className="btn btn-primary btn-lg"
            >
              Ver estado de cotización
            </Link>
            <Link to="/catalogo" className="btn btn-secondary btn-lg">
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!hasItems) {
    return (
      <>
        <div className="wrap" style={{ paddingTop: 'clamp(28px,4vw,48px)' }}>
          <h1 className="t-h1">Carrito de cotizaciones</h1>
        </div>
        <div className="wrap">
          <div className="empty-cart">
            <span className="empty-ic">
              <svg className="ic" width="44" height="44" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5.5 8h13l-1.1 11.2a1.5 1.5 0 0 1-1.5 1.3H8.1a1.5 1.5 0 0 1-1.5-1.3L5.5 8z" />
                <path d="M9 8V7a3 3 0 0 1 6 0v1" />
              </svg>
            </span>
            <h2 className="t-h2">Tu carrito está vacío</h2>
            <p className="t-lead">Agrega productos de graduación o publicitarios y pide tu cotización.</p>
            <Link to="/catalogo" className="btn btn-primary btn-lg" style={{ marginTop: 8 }}>
              Ver catálogo
            </Link>
          </div>
        </div>
      </>
    )
  }

  const submitLabel = submitting ? 'Enviando…' : 'Enviar solicitud'

  return (
    <>
      <div className="wrap" style={{ paddingTop: 'clamp(28px,4vw,48px)' }}>
        <h1 className="t-h1">Carrito de cotizaciones</h1>
        <p className="t-lead" style={{ marginTop: 12, maxWidth: '44em' }}>
          Revisa tus productos y completa tus datos. Los valores son “desde” y van + IVA.
        </p>
      </div>

      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 'clamp(40px,5vw,72px)' }}>
        <div className="cart-grid">
          <section className="cg-lines" aria-labelledby="items-h">
            <h2 id="items-h" className="vh">
              Productos en tu carrito
            </h2>
            <ul className="lines-list">
              {items.map((item) => (
                <li key={item.cartItemKey} className="ln">
                  <div className="ln-img">
                    <img src={item.image} alt="" loading="lazy" />
                  </div>
                  <div className="ln-main">
                    <span className="ln-kind">
                      {item.category === 'graduaciones' ? 'Graduación' : 'Publicitarios'}
                    </span>
                    <h3 className="ln-name">{item.name}</h3>
                    {item.leadTime && <span className="ln-moq">{item.leadTime}</span>}
                    {item.configuration.length > 0 && (
                      <ul className="ln-cfg">
                        {item.configuration.map((entry) => (
                          <li key={entry.optionId}>
                            <span className="k">{entry.label}:</span>
                            {entry.type === 'COLOR' ? (
                              <>
                                <span className="ln-sw" style={{ background: entry.value }} />
                                <span>{item.options.find((o) => o.id === entry.optionId)?.choices.find((c) => c.value === entry.value)?.label ?? entry.value}</span>
                              </>
                            ) : entry.type === 'FILE' ? (
                              <a href={entry.value} target="_blank" rel="noopener noreferrer" className="lnk">
                                {decodeURIComponent(entry.value.split('/').pop() ?? entry.value)}
                              </a>
                            ) : (
                              <span>{entry.value}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="ln-act">
                      <button
                        type="button"
                        className="btn-text is-danger"
                        aria-label={`Quitar ${item.name} del carrito`}
                        onClick={() => removeItem(item.cartItemKey)}
                      >
                        <svg className="ic" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4l1-12M9 7V4.5h6V7" />
                        </svg>
                        Quitar
                      </button>
                    </div>
                  </div>
                  <div className="ln-side">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div className="qty" role="group" aria-label={`Cantidad de ${item.name}`}>
                        <button
                          type="button"
                          onClick={() => handleQuantityButton(item.cartItemKey, -1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Disminuir cantidad de ${item.name}`}
                        >
                          <svg className="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M5 12h14" />
                          </svg>
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
                          <svg className="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>
                      {item.minOrder && <span className="ln-moq">{item.minOrder}</span>}
                    </div>
                    <div className="ln-sub">
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <strong>{formatCurrency(item.price * item.quantity)}</strong>
                        <span className="ln-iva">+ IVA</span>
                      </span>
                      <span>{`${formatCurrency(item.price)} c/u + IVA`}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 12 }}>
              <Link to="/catalogo" className="lnk">
                <svg className="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Seguir explorando productos
              </Link>
            </div>
          </section>

          <aside className="panel cg-side" aria-labelledby="sum-h">
            <h2 id="sum-h" className="t-h3">
              Resumen estimado
            </h2>
            <div style={{ marginTop: 8 }}>
              {lines.gCount > 0 && (
                <div className="sum-row">
                  <span>
                    Graduación<span className="sub">{plural(lines.gCount)}</span>
                  </span>
                  <b>{formatCurrency(lines.gTotal)}</b>
                </div>
              )}
              {lines.pCount > 0 && (
                <div className="sum-row">
                  <span>
                    Publicitarios<span className="sub">{plural(lines.pCount)}</span>
                  </span>
                  <b>{formatCurrency(lines.pTotal)}</b>
                </div>
              )}
              <div className="sum-row sum-total">
                <span>Subtotal estimado</span>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <b>{formatCurrency(total)}</b>
                  <span className="t-small c-muted">+ IVA</span>
                </span>
              </div>
            </div>
            <p className="hint" style={{ marginTop: 4 }}>
              Valor referencial; sumamos personalización y despacho en la cotización final.
            </p>
            <div className="hide-m" style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="submit" form="cart-form" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitLabel}
              </button>
              <p className="t-cap c-muted" style={{ textAlign: 'center' }}>
                Enviar no implica pago. Respondemos en 24 horas hábiles.
              </p>
            </div>
            <ul className="policy" style={{ paddingTop: 16, borderTop: '1px solid var(--linea)', marginTop: 18 }}>
              <li>
                <svg className="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                  <circle cx="12" cy="12" r="2.8" />
                </svg>
                <span>Incluimos prototipo digital antes de fabricar.</span>
              </li>
              <li>
                <svg className="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M3 6.5h11v10H3z" />
                  <path d="M14 10h4l3 3v3.5h-7" />
                  <circle cx="7.5" cy="18" r="1.8" />
                  <circle cx="17" cy="18" r="1.8" />
                </svg>
                <span>Coordinamos entregas en Santiago o envíos a región.</span>
              </li>
              <li>
                <svg className="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2v-17z" />
                  <path d="M9 8.5h6M9 12h6" />
                </svg>
                <span>Pagos contra factura una vez aprobada la propuesta.</span>
              </li>
            </ul>
          </aside>

          <section className="cg-form" id="datos" aria-labelledby="datos-h">
            <div className="panel">
              <h2 id="datos-h" className="t-h3">
                Tus datos de contacto
              </h2>
              {status?.type === 'error' && (
                <div className="alert alert-err" role="alert" aria-live="assertive" style={{ marginTop: 16 }}>
                  {ICON_ERR}
                  <span>{status.message}</span>
                </div>
              )}
              <form id="cart-form" className="form-grid" style={{ marginTop: 20 }} noValidate onSubmit={handleSubmit}>
                <div className="fgrid2">
                  <div className="field">
                    <label htmlFor="cart-name">
                      <span>Nombre y apellido</span>
                      <span className="lbl-tag">Obligatorio</span>
                    </label>
                    <input
                      id="cart-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      className={`input${errors.name ? ' is-err' : ''}`}
                      value={form.name}
                      onChange={handleInputChange}
                      required
                      aria-invalid={errors.name ? true : undefined}
                      aria-describedby={errors.name ? 'cart-name-error' : undefined}
                    />
                    <FieldError id="cart-name-error" message={errors.name} />
                  </div>
                  <div className="field">
                    <label htmlFor="cart-email">
                      <span>Correo electrónico</span>
                      <span className="lbl-tag">Obligatorio</span>
                    </label>
                    <input
                      id="cart-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      className={`input${errors.email ? ' is-err' : ''}`}
                      value={form.email}
                      onChange={handleInputChange}
                      required
                      aria-invalid={errors.email ? true : undefined}
                      aria-describedby={errors.email ? 'cart-email-error' : undefined}
                    />
                    <FieldError id="cart-email-error" message={errors.email} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="cart-phone">
                    <span>Teléfono</span>
                    <span className="lbl-tag">Opcional</span>
                  </label>
                  <input
                    id="cart-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    className={`input${errors.phone ? ' is-err' : ''}`}
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="+56 9 1234 5678"
                    aria-invalid={errors.phone ? true : undefined}
                    aria-describedby={errors.phone ? 'cart-phone-error' : undefined}
                  />
                  <FieldError id="cart-phone-error" message={errors.phone} />
                </div>
                <div className="field">
                  <label htmlFor="cart-message">
                    <span>Detalles adicionales</span>
                    <span className="lbl-tag">Opcional</span>
                  </label>
                  <textarea
                    id="cart-message"
                    name="message"
                    rows={4}
                    className="input"
                    value={form.message}
                    onChange={handleInputChange}
                    placeholder="Fechas, colores o personalización que necesitas."
                  />
                </div>
                <LegalConsent
                  id="cart-legal"
                  checked={legalAccepted}
                  onChange={(checked) => {
                    setLegalAccepted(checked)
                    if (checked) {
                      setErrors((prev) => {
                        if (!prev.legal) return prev
                        const next = { ...prev }
                        delete next.legal
                        return next
                      })
                      setStatus((prev) => (prev?.type === 'error' ? null : prev))
                    }
                  }}
                  error={errors.legal}
                />
              </form>
            </div>
          </section>
        </div>
      </div>

      <div className="bar-m show-m">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="t-cap c-muted">Subtotal estimado</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <strong>{formatCurrency(total)}</strong>
            <span className="t-small c-muted">+ IVA</span>
          </span>
        </div>
        <button
          type="submit"
          form="cart-form"
          className="btn btn-primary btn-lg"
          style={{ whiteSpace: 'nowrap' }}
          disabled={submitting}
        >
          {submitLabel}
        </button>
      </div>
    </>
  )
}

export default CartPage
