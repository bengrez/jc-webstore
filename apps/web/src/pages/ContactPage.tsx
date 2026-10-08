import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './contact.css'

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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSending(true)
    setError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string }
        throw new Error(
          response.status === 400
            ? 'Revisa que el nombre, el correo y el mensaje estén completos.'
            : payload.message ?? 'No pudimos enviar tu mensaje.'
        )
      }

      setSubmitted(true)
      setForm(initialFormState)
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Si urge, escríbenos directamente a contacto@gradumarketing.cl.`
          : 'No pudimos enviar tu mensaje.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="contact-page">
      <header className="contact-hero">
        <h1>Hablemos de tu pedido</h1>
        <p>Completa el formulario y respondemos en menos de 24 horas hábiles.</p>
      </header>

      {submitted && (
        <div className="contact-success">
          <div>
            <h2>Mensaje recibido</h2>
            <p>Te contactaremos pronto. Si urge, llámanos al +56 9 1234 5678.</p>
          </div>
          <div className="contact-success__card">
            <div className="contact-success__avatar" aria-hidden="true">
              J
            </div>
            <div>
              <p>“Reviso cada solicitud personalmente.”</p>
              <span>Juany · Diseñadora y dueña</span>
            </div>
          </div>
        </div>
      )}

      <section className="contact-grid">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form__field">
            <label htmlFor="name">Nombre y apellido</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Ej: Juana Pérez"
              value={form.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="contact-form__field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="correo@institucion.cl"
              value={form.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="contact-form__field">
            <label htmlFor="phone">Teléfono</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+56 9 1234 5678"
              inputMode="tel"
              value={form.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className="contact-form__field">
            <label htmlFor="company">Institución o empresa</label>
            <input
              id="company"
              name="company"
              type="text"
              placeholder="Nombre de la organización"
              value={form.company}
              onChange={handleInputChange}
            />
          </div>

          <div className="contact-form__field contact-form__field--full">
            <label htmlFor="message">Cuéntanos tu necesidad</label>
            <textarea
              id="message"
              name="message"
              placeholder="Describe tu ceremonia o campaña, cantidades y fecha estimada."
              rows={5}
              value={form.message}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Honeypot anti-spam: oculto para personas, los bots suelen completarlo. */}
          <div className="contact-form__hp" aria-hidden="true">
            <label htmlFor="website">Sitio web</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={handleInputChange}
            />
          </div>

          {error && (
            <p className="contact-form__error contact-form__field--full" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="button button--primary" disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar mensaje'}
          </button>
        </form>

        <aside className="contact-sidebar">
          <div>
            <h2>Datos de contacto</h2>
            <p>contacto@gradumarketing.cl</p>
            <p>+56 9 1234 5678</p>
          </div>
          <div>
            <h3>Horario</h3>
            <p>Lunes a viernes · 09:00 a 18:30</p>
            <p>Atención presencial o remota.</p>
          </div>
          <div>
            <h3>Visítanos</h3>
            <p>Taller en Santiago, Chile (con cita previa).</p>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default ContactPage
