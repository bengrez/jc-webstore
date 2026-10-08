import { LEGAL_UPDATED_AT, LEGAL_VERSION } from '../../data/legal'
import './legal.css'

const LegalDraftBanner = () => (
  <div className="legal-draft-banner" role="note">
    <strong>Borrador — revisar con la clienta y, idealmente, con un abogado.</strong>
    <span>
      Este texto es un borrador de trabajo, no asesoría legal. Versión {LEGAL_VERSION}, actualizado el{' '}
      {LEGAL_UPDATED_AT}.
    </span>
  </div>
)

export default LegalDraftBanner
