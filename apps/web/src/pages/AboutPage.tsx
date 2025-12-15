import './about.css'

const milestones = [
  {
    year: '2012',
    title: 'Nace Confecciones Juany',
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
    description: 'Despachos a todo Chile con control de calidad en origen.',
  },
]

const values = [
  {
    title: 'Trato directo',
    description: 'Hablas con Juany y el equipo sin intermediarios.',
  },
  {
    title: 'Detalle + rapidez',
    description: 'Costura, bordado e impresión con procesos cortos.',
  },
  {
    title: 'Cumplimiento',
    description: 'Fechas claras y prototipos antes de fabricar.',
  },
]

const AboutPage = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <h1>Somos Confecciones Juany</h1>
        <p>
          Taller de estolas, túnicas y merchandising hecho en Chile. Trabajamos con instituciones y
          marcas con apoyo directo de la fundadora.
        </p>
      </section>

      <section className="about-values">
        <h2>Nuestro sello</h2>
        <div className="about-values__grid">
          {values.map((value) => (
            <article key={value.title}>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-milestones">
        <h2>Hitos rápidos</h2>
        <div className="about-milestones__timeline">
          {milestones.map((milestone) => (
            <article key={milestone.year}>
              <div className="about-milestones__year">{milestone.year}</div>
              <div className="about-milestones__content">
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <div>
          <h2>¿Coordinamos?</h2>
          <p>Escríbenos y preparamos una propuesta breve con tiempos y valores.</p>
        </div>
        <a className="button button--primary" href="mailto:contacto@gradumarketing.cl">
          Escríbenos
        </a>
      </section>
    </div>
  )
}

export default AboutPage
