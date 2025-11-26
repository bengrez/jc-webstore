import { useEffect, useState } from 'react'
import './footer.css'

const Footer = () => {
  const [catFact, setCatFact] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadFact = async () => {
      try {
        const response = await fetch('https://catfact.ninja/fact')
        if (!response.ok) return
        const data: unknown = await response.json()
        if (cancelled) return
        if (data && typeof data === 'object' && 'fact' in data && typeof (data as { fact?: unknown }).fact === 'string') {
          setCatFact((data as { fact: string }).fact)
        }
      } catch {
        /* ignore errors silently */
      }
    }

    void loadFact()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <div>
          <h3>Gradumarketing</h3>
          <p>
            Estolas, túnicas y artículos publicitarios hechos a mano en Chile con atención
            cercana y profesional.
          </p>
        </div>
        <div className="site-footer__contact">
          <h4>Contacto</h4>
          <p>contacto@gradumarketing.cl</p>
          <p>+56 9 1234 5678</p>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} Gradumarketing. Todos los derechos reservados.</span>
        <span>Diseño dual: Graduación & Corporativo</span>
        {catFact && <span className="site-footer__fact">Dato gatuno: {catFact}</span>}
      </div>
    </footer>
  )
}

export default Footer
