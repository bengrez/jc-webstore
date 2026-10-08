import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LegalDraftBanner from '../../components/legal/LegalDraftBanner'
import Pending from '../../components/legal/Pending'
import { COMPANY, DEFAULT_LEGAL_INFO, PRIVACY_PATH } from '../../data/legal'
import type { LegalInfo } from '../../data/legal'
import './legal-page.css'

const TermsPage = () => {
  // Validez e IVA vienen del server (QUOTE_VALIDITY_DAYS e IVA_RATE): son los que usa el PDF
  const [info, setInfo] = useState<LegalInfo>(DEFAULT_LEGAL_INFO)

  useEffect(() => {
    let cancelled = false
    fetch('/api/legal')
      .then((response) => (response.ok ? (response.json() as Promise<LegalInfo>) : null))
      .then((data) => {
        if (!cancelled && data) setInfo(data)
      })
      .catch(() => null)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <article className="legal-page">
      <header className="legal-page__header">
        <h1>Términos de la cotización</h1>
        <p>Qué significa la cotización que te enviamos y qué pasa cuando la aceptas.</p>
      </header>

      <LegalDraftBanner />

      <section>
        <h2>1. Solicitud y cotización</h2>
        <p>
          Los precios del catálogo son precios base («desde»): el precio final depende de la cantidad y la
          personalización y se fija en la cotización formal. Al enviar el carrito nos pides una
          cotización; no es una compra. La cotización formal es el documento PDF con folio que te enviamos por correo y
          que puedes descargar desde el enlace de tu cotización. Si emitimos una revisión, la última reemplaza a las
          anteriores.
        </p>
      </section>

      <section>
        <h2>2. Precios e IVA</h2>
        <p>
          Los precios se expresan en pesos chilenos y son netos: a cada cotización se le suma el IVA del{' '}
          {info.ivaPercent}&nbsp;%. La cotización formal detalla el neto, el IVA y el total.{' '}
          <Pending>
            [REVISAR CON ABOGADO: a consumidores (no empresas) la Ley N° 19.496 exige informar el precio total con
            impuestos incluidos]
          </Pending>
        </p>
      </section>

      <section>
        <h2>3. Validez</h2>
        <p>
          Cada cotización formal es válida por {info.quoteValidityDays} días corridos desde su fecha de emisión, y el
          PDF indica la fecha exacta en que vence. Pasado ese plazo, los precios y los plazos pueden cambiar: si aceptas
          una cotización vencida, confirmaremos contigo los precios y plazos antes de fabricar, o te enviaremos una
          cotización nueva.
        </p>
      </section>

      <section>
        <h2>4. La cotización no es una venta</h2>
        <p>
          Ni la solicitud ni la cotización obligan a comprar ni a vender. El pedido se confirma cuando aceptas la
          cotización vigente (con el botón «Aceptar cotización» del enlace que te enviamos, o por escrito){' '}
          <Pending>[POR DEFINIR CON LA CLIENTA: y pagas el anticipo]</Pending>.
        </p>
      </section>

      <section>
        <h2>5. Anticipo y pago</h2>
        <p>
          <Pending>
            [POR DEFINIR CON LA CLIENTA: porcentaje del anticipo, cuándo se paga el saldo, medios de pago y si se emite
            factura o boleta]
          </Pending>
        </p>
      </section>

      <section>
        <h2>6. Diseño y plazos de producción</h2>
        <p>
          Antes de fabricar te enviamos una propuesta o prototipo digital para tu aprobación{' '}
          <Pending>[POR DEFINIR CON LA CLIENTA: cuántas rondas de cambios incluye]</Pending>. Los plazos de producción
          que muestra el catálogo son referenciales; el plazo de tu pedido es el de la cotización y se cuenta desde{' '}
          <Pending>[POR DEFINIR CON LA CLIENTA: la aprobación del diseño, el pago del anticipo o ambos]</Pending>.
        </p>
      </section>

      <section>
        <h2>7. Despacho o retiro</h2>
        <p>
          <Pending>
            [POR DEFINIR CON LA CLIENTA: dirección y horario de retiro, zonas y costo de despacho, quién paga el envío a
            regiones y desde cuándo corre el riesgo de la entrega]
          </Pending>
        </p>
      </section>

      <section>
        <h2>8. Cambios y devoluciones</h2>
        <p>
          Los productos se fabrican a pedido y con tu personalización.{' '}
          <Pending>
            [POR DEFINIR CON LA CLIENTA: si se aceptan cambios una vez aprobado el diseño, y qué pasa con productos con
            fallas]
          </Pending>{' '}
          Esto no limita los derechos que te da la Ley N° 19.496 sobre protección de los derechos de los consumidores,
          incluida la garantía legal si el producto tiene fallas o no corresponde a lo cotizado.{' '}
          <Pending>
            [REVISAR CON ABOGADO: plazo de la garantía legal, y si el derecho a retracto de las compras a distancia
            excluye los productos confeccionados según tus indicaciones y aplica a los que no se personalizan]
          </Pending>
        </p>
      </section>

      <section>
        <h2>9. Logos y diseños que nos entregas</h2>
        <ul>
          <li>
            Declaras que eres titular de los logos, marcas, imágenes y textos que subes, o que tienes autorización para
            usarlos en los productos que encargas.
          </li>
          <li>
            Los usamos sólo para preparar la cotización y la propuesta de diseño, y para fabricar tu pedido. No los
            publicamos ni los usamos en nuestro portafolio o redes sociales sin tu autorización por escrito.
          </li>
          <li>
            Podemos rechazar un pedido si el diseño infringe derechos de terceros o tiene contenido ilícito u ofensivo.
          </li>
          <li>
            Puedes pedirnos que eliminemos tus archivos; el <Link to={PRIVACY_PATH}>aviso de privacidad</Link> explica
            cómo y cuánto tiempo los guardamos.
          </li>
        </ul>
      </section>

      <section>
        <h2>10. Contacto y ley aplicable</h2>
        <p>
          {COMPANY.tradeName} (<Pending>{COMPANY.legalName}</Pending>, RUT <Pending>{COMPANY.rut}</Pending>),{' '}
          <Pending>{COMPANY.address}</Pending>, <Pending>{COMPANY.email}</Pending>. Estos términos se rigen por las leyes
          de Chile.
        </p>
      </section>
    </article>
  )
}

export default TermsPage
