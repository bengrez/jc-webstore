import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useThemeMode } from '../context/ThemeContext'
import './home.css'

const highlights = [
  {
    title: 'Hecho a mano en Chile',
    description: 'Cada pieza se confecciona en nuestro taller familiar con telas seleccionadas y terminaciones impecables.',
  },
  {
    title: 'Diseño a tu medida',
    description: 'Personalizamos colores, bordados e insumos especiales para reflejar la identidad de tu institución o marca.',
  },
  {
    title: 'Equipo experto',
    description: 'Juany acompaña cada etapa: idea inicial, prototipo, ajustes y entrega con seguimiento cercano.',
  },
]

const serviceStats = [
  { label: 'Tiempo de producción', value: '10-20 días' },
  { label: 'Personalización', value: 'Bordados, grabados, packaging' },
  { label: 'Cobertura', value: 'Envíos a todo Chile' },
]

const testimonials = [
  {
    quote: 'Recibimos las estolas impecables y a tiempo. La maqueta previa nos dio plena confianza.',
    name: 'María José, Dirección Académica',
  },
  {
    quote: 'Los kits corporativos elevaron la experiencia de onboarding. Gran calidad y empaque premium.',
    name: 'Felipe, RR.HH. industria tecnológica',
  },
  {
    quote: 'Resolvieron un pedido express sin sacrificar detalle. Equipo muy comprometido.',
    name: 'Carolina, Coordinación de Eventos',
  },
]

const gallery = [
  {
    title: 'Ceremonia universitaria',
    image: 'https://images.unsplash.com/photo-1455732063391-5f50f0c1d9d9?auto=format&fit=crop&w=900&q=80',
    detail: 'Estolas bordadas y birretes personalizados con nombre.',
  },
  {
    title: 'Kit de bienvenida ejecutivo',
    image: 'https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=900&q=80',
    detail: 'Tarjetas de bienvenida, termo grabado y libreta vegana.',
  },
  {
    title: 'Textil corporativo eco',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    detail: 'Bolsas recicladas con bordado 3 hilos y etiqueta interna.',
  },
]

const clientLogos = ['Universidad Aurora', 'Colegio Los Robles', 'Grupo Lumen', 'TechNova', 'Municipalidad Centro']

const HomePage = () => {
  const { mode } = useThemeMode()
  const [heroForm, setHeroForm] = useState({ nombre: '', email: '', proyecto: '' })
  const [heroSubmitted, setHeroSubmitted] = useState(false)
  const [testimonialIndex, setTestimonialIndex] = useState(0)

  const heroContent =
    mode === 'graduation'
      ? {
          title: 'Ceremonias que emocionan y permanecen',
          subtitle:
            'Diseñamos estolas, túnicas y birretes premium para universidades, colegios y academias que valoran la tradición.',
          primaryCta: 'Ver catálogo de graduación',
        }
      : {
          title: 'Marca corporativa que deja huella',
          subtitle:
            'Creamos regalos y artículos publicitarios con acabados de lujo para campañas, ferias y eventos empresariales.',
          primaryCta: 'Explorar artículos publicitarios',
        }

  const handleHeroChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setHeroForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleHeroSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHeroSubmitted(true)
    console.log('lead-form', heroForm)
  }

  const rotateTestimonial = (direction: 'prev' | 'next') => {
    setTestimonialIndex((current) => {
      if (direction === 'next') return (current + 1) % testimonials.length
      return current === 0 ? testimonials.length - 1 : current - 1
    })
  }

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="home-hero__eyebrow">
            {mode === 'graduation' ? 'Modo Graduación' : 'Modo Corporativo'}
          </span>
          <h1>{heroContent.title}</h1>
          <p>{heroContent.subtitle}</p>
          <div className="home-hero__meta">
            {serviceStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
          <div className="home-hero__cta">
            <Link to="/catalogo" className="button button--primary">
              {heroContent.primaryCta}
            </Link>
            <Link to="/sobre-nosotros" className="button button--ghost">
              Conoce nuestra historia
            </Link>
          </div>
          <div className="home-hero__chips" aria-label="Atajos de contacto">
            <Link to="/contacto">Responder en &lt;24h</Link>
            <a href="https://wa.me/56912345678" target="_blank" rel="noreferrer">
              WhatsApp inmediato
            </a>
            <span>Checklist de logos incluido</span>
          </div>
        </div>
        <div className="home-hero__visual">
          <div className="home-hero__badge">
            <span>Desde 2012</span>
            <strong>Confecciones Juany</strong>
          </div>
          <form className="home-hero__form" onSubmit={handleHeroSubmit}>
            <p className="home-hero__form-title">Solicita propuesta inmediata</p>
            <label>
              Nombre
              <input
                name="nombre"
                type="text"
                value={heroForm.nombre}
                onChange={handleHeroChange}
                required
                placeholder="Nombre y apellido"
              />
            </label>
            <label>
              Correo
              <input
                name="email"
                type="email"
                value={heroForm.email}
                onChange={handleHeroChange}
                required
                placeholder="correo@empresa.cl"
              />
            </label>
            <label>
              Necesidad
              <textarea
                name="proyecto"
                rows={3}
                value={heroForm.proyecto}
                onChange={handleHeroChange}
                placeholder="Cantidad, fecha, tipo de ceremonia o campaña"
              />
            </label>
            <button type="submit" className="button button--accent">
              Enviar y agendar
            </button>
            {heroSubmitted && <p className="home-hero__form-success">¡Gracias! Te contactaremos en minutos hábiles.</p>}
          </form>
        </div>
      </section>

      <section className="home-highlights">
        <h2>Lo que nos diferencia</h2>
        <div className="home-highlights__grid">
          {highlights.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <div className="home-sla">
          <div>
            <p>Compromiso de entrega</p>
            <strong>Fechas garantizadas por escrito + seguimiento de despacho.</strong>
          </div>
          <div>
            <p>Política de tranquilidad</p>
            <strong>Correcciones incluidas cuando la muestra aprobada difiere del resultado.</strong>
          </div>
        </div>
      </section>

      <section className="home-modes">
        <div className="home-modes__card">
          <span className="home-modes__badge">Graduación</span>
          <h3>Vestimenta solemne para hitos académicos</h3>
          <p>
            Capas, estolas bordadas y birretes con calidades premium, listas para personalizar con
            colores institucionales, insignias y nombres.
          </p>
          <Link to="/catalogo" className="link">
            Ver categoría
          </Link>
        </div>
        <div className="home-modes__card">
          <span className="home-modes__badge home-modes__badge--corporate">Corporativo</span>
          <h3>Regalos para conectar con tus clientes</h3>
          <p>
            Kits de bienvenida, textiles promocionales y elementos de merchandising con acabados
            premium y empaques listos para sorprender.
          </p>
          <Link to="/catalogo" className="link">
            Explorar artículos
          </Link>
        </div>
      </section>

      <section className="home-logos">
        <div>
          <p className="eyebrow">Confían en nosotros</p>
          <h2>Instituciones y empresas a lo largo de Chile</h2>
        </div>
        <div className="home-logos__grid">
          {clientLogos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </section>

      <section className="home-testimonials">
        <div className="home-testimonials__header">
          <p className="eyebrow">Testimonios</p>
          <h2>Resultados que generan confianza</h2>
          <div className="home-testimonials__controls" aria-label="Controles de testimonios">
            <button type="button" onClick={() => rotateTestimonial('prev')} aria-label="Testimonio anterior">
              ←
            </button>
            <button type="button" onClick={() => rotateTestimonial('next')} aria-label="Siguiente testimonio">
              →
            </button>
          </div>
        </div>
        <article className="home-testimonial" aria-live="polite">
          <p>“{testimonials[testimonialIndex].quote}”</p>
          <strong>{testimonials[testimonialIndex].name}</strong>
        </article>
      </section>

      <section className="home-gallery">
        <div className="home-gallery__header">
          <div>
            <p className="eyebrow">Galería</p>
            <h2>Proyectos recientes</h2>
            <p className="home-gallery__note">Fotografías reales de entregas y montajes.</p>
          </div>
          <Link to="/catalogo" className="button button--ghost">
            Ver más
          </Link>
        </div>
        <div className="home-gallery__grid">
          {gallery.map((item) => (
            <article key={item.title}>
              <img src={item.image} alt={item.title} loading="lazy" />
              <div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-story">
        <div className="home-story__content">
          <h2>Empresa familiar con alma de taller</h2>
          <p className="dropcap">
            Somos una familia de artesanas y diseñadores que trabaja junto a universidades, colegios
            y empresas en todo Chile. Juany, nuestra fundadora y diseñadora, participa en cada
            detalle para asegurar que cada pieza llegue impecable y a tiempo.
          </p>
          <div className="home-story__list">
            <span>Atención directa con Juany.</span>
            <span>Prototipos previos y pruebas de color.</span>
            <span>Reportes de avance y control de calidad.</span>
          </div>
          <Link to="/contacto" className="button button--accent">
            Agenda una cotización
          </Link>
        </div>
        <div className="home-story__panel" aria-hidden="true">
          <div className="home-story__pattern" />
        </div>
      </section>

      <section className="home-faq">
        <h2>Preguntas frecuentes</h2>
        <div className="home-faq__grid">
          <details>
            <summary>¿Desde cuánto puedo pedir?</summary>
            <p>Graduación desde 15 unidades. Corporativo desde 25 unidades. Ajustamos según stock y urgencia.</p>
          </details>
          <details>
            <summary>¿Incluyen diseño?</summary>
            <p>Sí, preparamos artes de bordado e impresión y compartimos previsualizaciones antes de producir.</p>
          </details>
          <details>
            <summary>¿Puedo enviar mi propio insumo?</summary>
            <p>Coordinamos recepción de insumos y realizamos pruebas antes de producir en volumen.</p>
          </details>
          <details>
            <summary>¿Cómo manejan los despachos?</summary>
            <p>Despacho consolidado o por persona. Seguimiento y seguro opcional disponibles.</p>
          </details>
        </div>
      </section>
    </div>
  )
}

export default HomePage
