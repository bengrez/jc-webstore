import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '../context/ThemeContext'
import type { ThemeMode } from '../context/ThemeContext'
import './mode-landing.css'

const OPTIONS: Array<{
  id: ThemeMode
  title: string
  eyebrow: string
  description: string
  bullets: string[]
}> = [
  {
    id: 'graduation',
    title: 'Graduaciones',
    eyebrow: 'Ceremonias y recuerdos',
    description: 'Estolas, túnicas y birretes listos para personalizar con tus colores.',
    bullets: ['Estolas bordadas', 'Birretes y foto', 'Entrega coordinada'],
  },
  {
    id: 'corporate',
    title: 'Corporativo',
    eyebrow: 'Marca y bienvenida',
    description: 'Kits y regalos corporativos listos para sorprender clientes y equipos.',
    bullets: ['Welcome kits', 'Textil promocional', 'Grabados y bordados'],
  },
]

const ModeLandingPage = () => {
  const { mode, setMode } = useThemeMode()
  const navigate = useNavigate()

  const handleSelect = (next: ThemeMode) => {
    setMode(next)
    navigate('/inicio')
  }

  return (
    <section className="mode-landing">
      <div className="mode-landing__shell">
        <p className="mode-landing__eyebrow">Elige tu experiencia</p>
        <h1>Gradumarketing a tu medida</h1>
        <p className="mode-landing__lede">
          Decide si quieres ver artículos de graduaciones o soluciones corporativas. Guardaremos tu
          preferencia para seguir navegando.
        </p>

        <div className="mode-landing__grid">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="mode-landing__card"
              data-active={mode === option.id}
              onClick={() => handleSelect(option.id)}
            >
              <span className="mode-landing__badge">{option.eyebrow}</span>
              <div className="mode-landing__title-row">
                <h2>{option.title}</h2>
                <span className="mode-landing__cta">Entrar</span>
              </div>
              <p className="mode-landing__description">{option.description}</p>
              <ul className="mode-landing__bullets">
                {option.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="mode-landing__note">
          <span>Tip</span>
          <p>Puedes volver aquí desde el menú principal para cambiar el modo.</p>
        </div>
      </div>
    </section>
  )
}

export default ModeLandingPage
