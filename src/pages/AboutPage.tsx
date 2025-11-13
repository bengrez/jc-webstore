import './about.css'

const milestones = [
  {
    year: '2012',
    title: 'Nace Confecciones Juany',
    description:
      'Juany transforma su experiencia en diseño y confección en un taller familiar para atender ceremonias de colegios y universidades.',
  },
  {
    year: '2016',
    title: 'Sumamos artículos corporativos',
    description:
      'Empresas nacionales comienzan a confiar en nuestros acabados para gifting premium y kits de bienvenida personalizados.',
  },
  {
    year: '2021',
    title: 'Expansión nacional',
    description:
      'Entregamos a todo Chile con control de calidad en origen y acompañamiento remoto durante cada producción.',
  },
]

const values = [
  {
    title: 'Atención en primera persona',
    description:
      'Juany, fundadora y diseñadora, conversa contigo, propone ideas y supervisa cada entrega. No delegamos la comunicación clave.',
  },
  {
    title: 'Detalle artesanal + procesos modernos',
    description:
      'Unimos costura manual, bordados especiales e impresión digital para lograr resultados rápidos sin sacrificar calidad.',
  },
  {
    title: 'Confianza y cumplimiento',
    description:
      'Trabajamos con fechas claras, seguimiento constante y prototipos previos para asegurar que recibas exactamente lo que imaginaste.',
  },
]

const AboutPage = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <h1>Una empresa familiar que vive la confección</h1>
        <p>
          Somos Confecciones Juany, taller creativo y productora textil que acompaña a instituciones
          educativas y marcas corporativas en sus hitos más importantes. Nuestra dueña y diseñadora
          lidera cada proyecto de principio a fin.
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
        <h2>Hitos que nos trajeron hasta aquí</h2>
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
          <h2>¿Listo para planificar tu próxima ceremonia o campaña?</h2>
          <p>
            Cuéntanos tu idea y prepararemos una propuesta con muestras, tiempos y valores
            transparentes. También podemos reunirnos en nuestro taller en Santiago.
          </p>
        </div>
        <a className="button button--primary" href="mailto:contacto@gradumarketing.cl">
          Escríbenos
        </a>
      </section>
    </div>
  )
}

export default AboutPage
