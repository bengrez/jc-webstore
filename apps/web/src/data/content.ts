// Textos que la clienta debe confirmar. Se cambian aquí y se actualizan en todo el sitio.
// «por confirmar» donde todavía no hay dato definitivo (ver la lista en el handoff 010 del vault).

export const CONTACT_EMAIL = 'contacto@confeccionesjuany.cl'
export const LOCATION = 'Santiago, Chile'
export const HOURS = 'Lunes a viernes, 09:00 a 18:30'
/** null = se muestra «por confirmar» */
export const WHATSAPP: string | null = null

export const RESPONSE_TIME = '24 horas hábiles'
export const PAYMENT_NOTE = 'Pagos contra factura una vez aprobada la propuesta.'
export const SHIPPING_NOTE = 'Despachos a todo Chile con control de calidad en origen.'

export const MILESTONES = [
  {
    year: '2012',
    title: 'Nace Confecciones Juany Reyes',
    description: 'Juany abre el taller familiar para vestir ceremonias escolares.',
  },
  {
    year: '2016',
    title: 'Sumamos artículos corporativos',
    description: 'Empresas piden regalos y kits corporativos hechos a pedido.',
  },
  {
    year: '2021',
    title: 'Expansión nacional',
    description: SHIPPING_NOTE,
  },
]
