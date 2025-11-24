import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './contact.css'

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  service: 'Graduación',
  fileName: '',
  message: '',
}

const ContactPage = () => {
  const [form, setForm] = useState(initialFormState)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setForm((prev) => ({ ...prev, fileName: file.name }))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 700))
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'contact_submit', payload: form })
      setSubmitted(true)
      setForm(initialFormState)
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error al enviar. Intenta nuevamente o contáctanos por WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contact-page">
      <header className="contact-hero">
        <h1>Conversemos tu proyecto</h1>
        <p>
          Completa el formulario y te responderemos dentro de 24 horas hábiles con la información que
          necesitas para tu graduación o campaña corporativa.
        </p>
      </header>

      {submitted && (
        <div className="contact-success">
          <div>
            <h2>¡Gracias por escribirnos!</h2>
            <p>
              Recibimos tu mensaje y nos pondremos en contacto contigo pronto. Si necesitas una
              respuesta urgente, llámanos al +56 9 1234 5678.
            </p>
          </div>
          <div className="contact-success__card">
            <div className="contact-success__avatar" aria-hidden="true">
              J
            </div>
            <div>
              <p>“Personalmente revisaré tu solicitud para que todo quede perfecto.”</p>
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

          <div className="contact-form__field">
            <label htmlFor="service">Interés principal</label>
            <select id="service" name="service" value={form.service} onChange={handleInputChange}>
              <option value="Graduación">Graduación</option>
              <option value="Corporativo">Corporativo</option>
              <option value="Otro">Otro</option>
            </select>
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

          <div className="contact-form__field contact-form__field--full">
            <label htmlFor="brief">
              Adjuntar logo o brief (opcional)
              <input id="brief" name="brief" type="file" onChange={handleFileChange} />
            </label>
            {form.fileName && <span className="contact-form__file">{form.fileName}</span>}
          </div>

          <button type="submit" className="button button--primary">
            {loading ? 'Enviando…' : 'Enviar mensaje'}
          </button>
          {error && <p className="contact-error">{error}</p>}
        </form>

        <aside className="contact-sidebar">
          <div>
            <h2>Datos de contacto</h2>
            <p>contacto@gradumarketing.cl</p>
            <p>+56 9 1234 5678</p>
            <div className="contact-chips">
              <a href="https://wa.me/56912345678" target="_blank" rel="noreferrer">
                Chat inmediato
              </a>
              <a href="tel:+56912345678">Llamada directa</a>
              <a href="mailto:contacto@gradumarketing.cl">Correo</a>
            </div>
          </div>
          <div>
            <h3>Horario</h3>
            <p>Lunes a viernes · 09:00 a 18:30</p>
            <p>Atendemos de forma presencial y remota.</p>
          </div>
          <div>
            <h3>Visítanos</h3>
            <p>Taller en Santiago, Chile.</p>
            <p>Agenda previa coordinando por correo.</p>
          </div>
          <div className="contact-panel">
            <h3>SLA y soporte</h3>
            <ul>
              <li>Respuesta inicial &lt; 24 horas hábiles.</li>
              <li>Entrega comprometida por escrito y seguimiento de despacho.</li>
              <li>Correcciones incluidas cuando la muestra aprobada difiere.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default ContactPage
