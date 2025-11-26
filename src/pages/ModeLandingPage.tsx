import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '../context/ThemeContext'
import type { ThemeMode } from '../context/ThemeContext'
import './mode-landing.css'

const MODE_OPTIONS: Array<{
  id: ThemeMode
  label: string
  eyebrow: string
  description: string
  bullets: string[]
}> = [
  {
    id: 'graduation',
    label: 'Graduaciones',
    eyebrow: 'Ceremonias y recuerdos',
    description:
      'Estolas, túnicas, birretes y detalles que hacen especial el día de tu promoción. Producción local y personalización sin complicaciones.',
    bullets: [
      'Estolas bordadas y túnicas hechas a medida',
      'Kits con birrete, fotografía y packaging premium',
      'Entregas coordinadas con colegios y universidades',
    ],
  },
  {
    id: 'corporate',
    label: 'Corporativo',
    eyebrow: 'Marca y bienvenida',
    description:
      'Kits de onboarding, regalos corporativos y textiles sostenibles para equipos y clientes. Diseñados a tu medida y entregados en tiempo.',
    bullets: [
      'Welcome kits listos para entregar',
      'Merchandising eco y textil corporativo',
      'Producción ágil y seguimiento personalizado',
    ],
  },
]

const ModeLandingPage = () => {
  const { setMode, mode } = useThemeMode()
  const navigate = useNavigate()

  const handleChoose = (nextMode: ThemeMode) => {
    setMode(nextMode)
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'mode_selected', mode: nextMode })
    navigate('/inicio')
  }

  return (
    <section className="mode-landing">
      <div className="mode-landing__shell">
        <div className="mode-landing__intro">
          <p className="mode-landing__eyebrow">Elige tu experiencia</p>
          <h1>Gradumarketing para graduaciones o para marcas corporativas</h1>
          <p className="mode-landing__lede">
            Te acompañamos con producción local, tiempos claros y diseño cuidado. Selecciona cómo
            quieres explorar la tienda y guardaremos tu preferencia para tus próximas visitas.
          </p>
        </div>

        <div className="mode-landing__grid">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="mode-landing__card"
              data-active={mode === option.id}
              onClick={() => handleChoose(option.id)}
            >
              <span className="mode-landing__badge">{option.eyebrow}</span>
              <div className="mode-landing__title-row">
                <h2>{option.label}</h2>
                <span className="mode-landing__cta">Entrar</span>
              </div>
              <p className="mode-landing__description">{option.description}</p>
              <ul className="mode-landing__bullets">
                {option.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="mode-landing__note">
          <span>Tip</span>
          <p>Puedes volver a esta pantalla en cualquier momento para cambiar el enfoque.</p>
        </div>
      </div>
    </section>
  )
}

export default ModeLandingPage
