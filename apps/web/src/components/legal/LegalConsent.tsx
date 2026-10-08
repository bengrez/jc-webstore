import { PRIVACY_PATH, TERMS_PATH } from '../../data/legal'
import './legal.css'

type LegalConsentProps = {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string | null
}

// Casilla de aceptación de los formularios de cotización y de contacto. Los documentos se abren
// en otra pestaña para no perder lo que la persona ya escribió.
const LegalConsent = ({ id, checked, onChange, error }: LegalConsentProps) => (
  <div className="legal-consent">
    <div className="legal-consent__row">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <label htmlFor={id}>
        He leído y acepto el{' '}
        <a href={PRIVACY_PATH} target="_blank" rel="noopener">
          aviso de privacidad
        </a>{' '}
        y los{' '}
        <a href={TERMS_PATH} target="_blank" rel="noopener">
          términos de la cotización
        </a>
        .
      </label>
    </div>
    {error && (
      <p id={`${id}-error`} className="legal-consent__error" role="alert">
        {error}
      </p>
    )}
  </div>
)

export default LegalConsent
