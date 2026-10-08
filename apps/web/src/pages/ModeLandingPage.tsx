import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '../context/ThemeContext'
import type { ThemeMode } from '../context/ThemeContext'
import './mode-landing.css'

const OPTIONS: Array<{
  id: ThemeMode
  title: string
  subtitle: string
  icon: string
}> = [
  {
    id: 'graduation',
    title: 'Graduaciones',
    subtitle: 'Estolas, birretes y ceremonias',
    icon: '🎓',
  },
  {
    id: 'corporate',
    title: 'Corporativo',
    subtitle: 'Kits, regalos y merchandising',
    icon: '🏢',
  },
]

const ModeLandingPage = () => {
  const { setMode } = useThemeMode()
  const navigate = useNavigate()

  const handleSelect = (next: ThemeMode) => {
    setMode(next)
    navigate('/inicio')
  }

  return (
    <section className="mode-landing">
      <div className="mode-landing__shell">
        <span className="mode-landing__brand">Confecciones Juany Reyes</span>
        <h1>Elige tu experiencia</h1>
        <p className="mode-landing__tagline">Confección artesanal en Santiago desde 2012</p>

        <div className="mode-landing__grid">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`mode-landing__card mode-landing__card--${option.id}`}
              onClick={() => handleSelect(option.id)}
            >
              <span className="mode-landing__icon">{option.icon}</span>
              <h2>{option.title}</h2>
              <p>{option.subtitle}</p>
              <span className="mode-landing__cta">Explorar →</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ModeLandingPage
