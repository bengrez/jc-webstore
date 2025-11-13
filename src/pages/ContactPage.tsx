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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    setForm(initialFormState)
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

          <button type="submit" className="button button--primary">
            Enviar mensaje
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
            <p>Atendemos de forma presencial y remota.</p>
          </div>
          <div>
            <h3>Visítanos</h3>
            <p>Taller en Santiago, Chile.</p>
            <p>Agenda previa coordinando por correo.</p>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default ContactPage
