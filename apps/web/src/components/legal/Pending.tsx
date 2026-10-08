import type { ReactNode } from 'react'
import './legal.css'

// Dato o política que falta definir con la clienta: se ve marcado en el borrador
const Pending = ({ children }: { children: ReactNode }) => <mark className="legal-pending">{children}</mark>

export default Pending
