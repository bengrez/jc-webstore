import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import LegalConsent from '../components/legal/LegalConsent'
import { LEGAL_VERSION } from '../data/legal'
import { Link } from 'react-router-dom'
import '../design/pages/contact.css'

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  message: '',
  website: '',
}

const ContactPage = () => {
  const [form, setForm] = useState(initialFormState)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [legalError, setLegalError] = useState<string | null>(null)

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!legalAccepted) {
      setLegalError('Debes aceptar el aviso de privacidad y los términos para enviar el mensaje.')
      return
    }
    setSending(true)
    setError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, legal: { accepted: legalAccepted, version: LEGAL_VERSION } }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
        throw new Error(
          payload.error?.startsWith('legal_')
            ? payload.message
            : response.status === 400
              ? 'Revisa que el nombre, el correo y el mensaje estén completos.'
              : payload.message ?? 'No pudimos enviar tu mensaje.'
        )
      }

      setSubmitted(true)
      setForm(initialFormState)
      setLegalAccepted(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Si urge, escríbenos directamente a contacto@confeccionesjuany.cl.`
          : 'No pudimos enviar tu mensaje.'
      )
    } finally {
      setSending(false)
    }
  }

  const warn = (
    <svg className="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 4l9 16H3L12 4z" />
      <path d="M12 10v4M12 17v.01" />
    </svg>
  )

  return (
    <div className="contact-page">
      <div className="wrap" style={{ paddingTop: 'clamp(28px,4vw,48px)' }}>
        <h1 className="t-h1">Contacto</h1>
        <p className="t-lead" style={{ marginTop: 12, maxWidth: '44em' }}>
          Completa el formulario y respondemos en menos de 24 horas hábiles.
        </p>
      </div>

      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 'clamp(48px,6vw,88px)' }}>
        <div className="contact-grid">
          <section aria-labelledby="form-h">
            {submitted ? (
              <div className="panel cform-ok" role="status">
                <span className="ok-badge">
                  <svg className="ic" width="32" height="32" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <h2 id="form-h" className="t-h2">Mensaje recibido</h2>
                <p className="t-body c-ink2">Te contactaremos pronto.</p>
                <div className="cform-actions">
                  <Link className="btn btn-primary" to="/catalogo">Ver catálogo</Link>
                  <button type="button" className="btn btn-secondary" onClick={() => setSubmitted(false)}>
                    Enviar otro mensaje
                  </button>
                </div>
              </div>
            ) : (
              <div className="panel">
                <h2 id="form-h" className="vh">Formulario de contacto</h2>
                {error && (
                  <div className="alert alert-err" role="alert" style={{ marginBottom: 20 }}>
                    {warn}
                    <span>{error}</span>
                  </div>
                )}
                <form className="form-grid" onSubmit={handleSubmit}>
                  <div className="fgrid2">
                    <div className="field">
                      <label htmlFor="name"><span>Nombre</span><span className="lbl-tag">Obligatorio</span></label>
                      <input id="name" name="name" className="input" type="text" autoComplete="name"
                        value={form.name} onChange={handleInputChange} required />
                    </div>
                    <div className="field">
                      <label htmlFor="email"><span>Email</span><span className="lbl-tag">Obligatorio</span></label>
                      <input id="email" name="email" className="input" type="email" autoComplete="email"
                        inputMode="email" value={form.email} onChange={handleInputChange} required />
                    </div>
                    <div className="field">
                      <label htmlFor="phone"><span>Teléfono</span><span className="lbl-tag">Opcional</span></label>
                      <input id="phone" name="phone" className="input" type="tel" autoComplete="tel"
                        inputMode="tel" placeholder="+56 9 ..." value={form.phone} onChange={handleInputChange} />
                    </div>
                    <div className="field">
                      <label htmlFor="company"><span>Empresa</span><span className="lbl-tag">Opcional</span></label>
                      <input id="company" name="company" className="input" type="text" autoComplete="organization"
                        value={form.company} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="message"><span>Mensaje</span><span className="lbl-tag">Obligatorio</span></label>
                    <textarea id="message" name="message" className="input" rows={5}
                      placeholder="Cuéntanos qué necesitas, para cuándo y cuántas unidades."
                      value={form.message} onChange={handleInputChange} required />
                  </div>

                  {/* Honeypot anti-spam: oculto para personas, los bots suelen completarlo. */}
                  <div className="cform-hp" aria-hidden="true">
                    <label htmlFor="website">Sitio web</label>
                    <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off"
                      value={form.website} onChange={handleInputChange} />
                  </div>

                  <LegalConsent
                    id="contact-legal"
                    checked={legalAccepted}
                    onChange={(checked) => {
                      setLegalAccepted(checked)
                      if (checked) setLegalError(null)
                    }}
                    error={legalError}
                  />

                  <div>
                    <button type="submit" className="btn btn-primary btn-lg cform-submit" disabled={sending}>
                      {sending ? 'Enviando…' : 'Enviar mensaje'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>

          <aside className="cinfo-aside" aria-label="Otras formas de contacto">
            <div className="panel">
              <div className="cinfo cinfo-list">
                <div className="cinfo-item">
                  <span className="val-ic">
                    <svg className="ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M4 7l8 6 8-6" />
                    </svg>
                  </span>
                  <div>
                    <h2>Contacto directo</h2>
                    <p><a href="mailto:contacto@confeccionesjuany.cl">contacto@confeccionesjuany.cl</a></p>
                    <p>Santiago, Chile</p>
                  </div>
                </div>
                <div className="cinfo-item">
                  <span className="val-ic">
                    <svg className="ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
                    </svg>
                  </span>
                  <div>
                    <h2>Horario</h2>
                    <p>Lunes a viernes, 09:00 a 18:30</p>
                  </div>
                </div>
                <div className="cinfo-item">
                  <span className="val-ic">
                    <svg className="ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
                    </svg>
                  </span>
                  <div>
                    <h2>WhatsApp y teléfono</h2>
                    <p><span className="ph">por confirmar</span></p>
                  </div>
                </div>
              </div>
            </div>
            <div className="panel cta">
              <h2 className="t-h4">¿Ya sabes qué productos quieres?</h2>
              <p className="t-small c-ink2">
                Arma tu cotización en el catálogo: elige colores, sube tu logo y envía la solicitud.
              </p>
              <Link className="btn btn-secondary" to="/catalogo">Ir al catálogo</Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
