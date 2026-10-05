import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './contact.css'

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  message: '',
}

const ContactPage = () => {
  const [form, setForm] = useState(initialFormState)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          message: form.message.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('No fue posible enviar tu mensaje.')
      }

      setSubmitted(true)
      setForm(initialFormState)
    } catch {
      setError('No fue posible enviar tu mensaje. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="contact-page">
      <header className="contact-header">
        <h1>Contacto</h1>
        <p>Completa el formulario y respondemos en menos de 24 horas hábiles.</p>
      </header>

      {submitted && (
        <div className="contact-success">
          <h2>Mensaje recibido</h2>
          <p>Te contactaremos pronto.</p>
        </div>
      )}

      <section className="contact-grid">
        <form className="contact-form" onSubmit={handleSubmit}>
          {error && <p className="contact-form__error">{error}</p>}

          <div className="contact-form__field">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="contact-form__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
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
              placeholder="+56 9 ..."
              value={form.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className="contact-form__field">
            <label htmlFor="company">Empresa</label>
            <input
              id="company"
              name="company"
              type="text"
              value={form.company}
              onChange={handleInputChange}
            />
          </div>

          <div className="contact-form__field contact-form__field--full">
            <label htmlFor="message">Mensaje</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={form.message}
              onChange={handleInputChange}
              required
            />
          </div>

          <button type="submit" className="button button--primary" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </form>

        <aside className="contact-sidebar">
          <div className="contact-sidebar__block">
            <h3>Contacto directo</h3>
            <p>contacto@confeccionesjuany.cl</p>
            <p>Santiago, Chile</p>
          </div>
          <div className="contact-sidebar__block">
            <h3>Horario</h3>
            <p>Lunes a viernes, 09:00 - 18:30</p>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default ContactPage
