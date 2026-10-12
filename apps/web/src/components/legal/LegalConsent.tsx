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
    <div className="chk">
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
      <p id={`${id}-error`} className="err" role="alert" style={{ marginTop: 4 }}>
        <svg className="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 4l9 16H3L12 4z" />
          <path d="M12 10v4M12 17v.01" />
        </svg>
        <span>{error}</span>
      </p>
    )}
  </div>
)

export default LegalConsent
