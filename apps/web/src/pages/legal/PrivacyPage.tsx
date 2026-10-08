import { Link } from 'react-router-dom'
import LegalDraftBanner from '../../components/legal/LegalDraftBanner'
import Pending from '../../components/legal/Pending'
import { COMPANY, TERMS_PATH } from '../../data/legal'
import './legal-page.css'

// Lo que se describe aquí sale del código: apps/server/prisma/schema.prisma (qué se guarda),
// routes/quotes.ts, contact.ts y uploads.ts (qué se recibe), mailer.ts (qué correos salen),
// CartContext y ThemeContext (almacenamiento local) y admin-auth.ts (cookie del panel).
const PrivacyPage = () => (
  <article className="legal-page">
    <header className="legal-page__header">
      <h1>Aviso de privacidad</h1>
      <p>Cómo tratamos los datos que nos entregas al pedir una cotización o escribirnos.</p>
    </header>

    <LegalDraftBanner />

    <section>
      <h2>1. Quién es responsable de tus datos</h2>
      <p>
        El responsable del tratamiento es {COMPANY.tradeName} (<Pending>{COMPANY.legalName}</Pending>, RUT{' '}
        <Pending>{COMPANY.rut}</Pending>), con domicilio en <Pending>{COMPANY.address}</Pending>. Para cualquier
        consulta sobre tus datos escríbenos a <Pending>{COMPANY.email}</Pending>.
      </p>
    </section>

    <section>
      <h2>2. Qué datos recogemos</h2>
      <h3>Cuando pides una cotización (carrito)</h3>
      <ul>
        <li>Nombre y apellido y correo electrónico (obligatorios).</li>
        <li>Teléfono y detalles adicionales (opcionales).</li>
        <li>
          Los productos, las cantidades y la personalización que elegiste: colores, textos para bordar o imprimir y los
          archivos que subas.
        </li>
        <li>La fecha en que aceptaste este aviso y los términos, y la versión que aceptaste.</li>
      </ul>
      <h3>Cuando nos escribes (formulario de contacto)</h3>
      <ul>
        <li>Nombre, correo electrónico y mensaje (obligatorios).</li>
        <li>Teléfono y empresa (opcionales).</li>
        <li>La fecha y la versión de este aviso que aceptaste.</li>
      </ul>
      <h3>Logos y archivos que subes</h3>
      <p>
        Al personalizar un producto puedes subir un logo o una imagen (JPG, PNG, WEBP, GIF o PDF, de hasta 5 MB). El
        archivo se guarda en nuestro servidor con un nombre aleatorio. No aparece publicado en el sitio, pero cualquier
        persona que tenga el enlace exacto del archivo puede abrirlo.
      </p>
      <h3>Tu cotización</h3>
      <p>
        Guardamos la solicitud, los precios que te cotizamos, cada PDF de cotización formal que emitimos (no se
        sobrescriben: cada revisión queda guardada), las notas internas del taller sobre tu pedido y tu respuesta
        (aceptar o rechazar) en el portal de cotizaciones.
      </p>
      <h3>Datos de nombres de estudiantes u otras personas</h3>
      <p>
        Si en la personalización incluyes nombres de otras personas (por ejemplo, de estudiantes para bordar en una
        estola), declaras que cuentas con su autorización o, si son menores de edad, con la de sus padres o
        apoderados. Esos datos se usan sólo para fabricar tu pedido.
      </p>
    </section>

    <section>
      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Preparar, enviar y hacer seguimiento de tu cotización, y fabricar y entregar tu pedido si la aceptas.</li>
        <li>Responder tus mensajes y consultas.</li>
        <li>
          Enviarte correos sobre tu solicitud: la confirmación con el enlace a tu cotización y la cotización formal en
          PDF.
        </li>
      </ul>
      <p>
        No usamos tus datos para publicidad, no los vendemos y no hacemos perfiles ni decisiones automatizadas con
        ellos.
      </p>
    </section>

    <section>
      <h2>4. Base legal</h2>
      <p>
        Tratamos tus datos conforme a la Ley N° 19.628 sobre protección de la vida privada y, desde el 1 de diciembre
        de 2026, a la Ley N° 21.719, que regula la protección y el tratamiento de los datos personales. La base del
        tratamiento es tu consentimiento, que das al marcar la casilla de aceptación, y la necesidad de los datos para
        preparar la cotización y, en su caso, cumplir el pedido que nos pides.
      </p>
    </section>

    <section>
      <h2>5. Cuánto tiempo los guardamos</h2>
      <ul>
        <li>
          Solicitudes, cotizaciones y sus PDF: <Pending>[POR DEFINIR CON LA CLIENTA: plazo]</Pending>. Si la cotización
          termina en una venta, los documentos tributarios se conservan por el plazo que exige la ley.
        </li>
        <li>
          Mensajes de contacto: <Pending>[POR DEFINIR CON LA CLIENTA: plazo]</Pending>.
        </li>
        <li>
          Logos y archivos subidos: <Pending>[POR DEFINIR CON LA CLIENTA: plazo]</Pending>.
        </li>
      </ul>
      <p>Cumplido el plazo, o antes si lo pides y la ley lo permite, eliminamos los datos.</p>
    </section>

    <section>
      <h2>6. Quién accede a tus datos</h2>
      <ul>
        <li>Las personas de {COMPANY.tradeName} que atienden las cotizaciones, a través de un panel con contraseña.</li>
        <li>
          Nuestro proveedor de correo electrónico (hoy Gmail, de Google), que transmite los correos de tu solicitud y
          la copia que nos llega a nosotros.
        </li>
        <li>
          El proveedor del servidor donde funciona el sitio: <Pending>[POR DEFINIR: hosting]</Pending>.
        </li>
        <li>
          Google Fonts: el sitio descarga sus tipografías desde servidores de Google, que reciben tu dirección IP y los
          datos de tu navegador.
        </li>
      </ul>
      <p>
        Algunos de estos proveedores pueden guardar datos fuera de Chile. No entregamos tus datos a otros terceros,
        salvo que la ley o una autoridad competente lo exija.
      </p>
      <p>
        El enlace a tu cotización que te enviamos por correo incluye un código privado: quien tenga ese enlace puede ver
        la cotización. No lo reenvíes a personas que no deban verla.
      </p>
    </section>

    <section>
      <h2>7. Cookies y almacenamiento en tu navegador</h2>
      <p>El sitio no usa cookies de publicidad ni de analítica. Lo que se guarda es:</p>
      <ul>
        <li>
          <strong>Carrito</strong> (almacenamiento local del navegador, clave <code>confeccionesjuany:cart</code>): los
          productos, cantidades y personalización que agregaste, incluidos los enlaces a los archivos que subiste. No
          guarda tu nombre ni tu correo. Queda en tu dispositivo hasta que envías la solicitud o borras los datos del
          navegador.
        </li>
        <li>
          <strong>Modo del sitio</strong> (almacenamiento local, clave <code>confeccionesjuany:theme-mode</code>): si
          elegiste Graduación o Corporativo.
        </li>
        <li>
          <strong>Sesión del panel de administración</strong> (cookie <code>admin_session</code>): sólo se crea cuando
          alguien del taller inicia sesión en el panel y dura hasta 7 días. Los clientes no la reciben.
        </li>
      </ul>
      <p>
        Para limitar abusos, el servidor recuerda tu dirección IP durante 15 minutos como máximo y sólo en memoria. El
        registro de solicitudes del servidor no guarda tu dirección IP.
      </p>
    </section>

    <section>
      <h2>8. Tus derechos</h2>
      <p>Puedes pedirnos en cualquier momento:</p>
      <ul>
        <li>
          <strong>Acceso</strong>: saber qué datos tuyos tenemos y para qué los usamos.
        </li>
        <li>
          <strong>Rectificación</strong>: corregir datos inexactos o incompletos.
        </li>
        <li>
          <strong>Supresión</strong>: que eliminemos tus datos cuando ya no sean necesarios o retires tu consentimiento.
        </li>
        <li>
          <strong>Oposición</strong>: que dejemos de tratarlos para un fin determinado.
        </li>
        <li>
          <strong>Portabilidad</strong>: recibir tus datos en un formato estructurado y de uso común.
        </li>
        <li>
          <strong>Bloqueo</strong>: que suspendamos temporalmente su tratamiento mientras se resuelve una solicitud.
        </li>
      </ul>
      <p>
        Escríbenos a <Pending>{COMPANY.email}</Pending> desde el correo con que hiciste la solicitud, o indicando cómo
        acreditar tu identidad. Responderemos dentro del plazo que fija la ley. Si no quedas conforme, puedes reclamar
        ante la Agencia de Protección de Datos Personales o ante los tribunales.
      </p>
    </section>

    <section>
      <h2>9. Seguridad</h2>
      <p>
        El panel de administración exige contraseña, que no se guarda en texto legible (sólo su hash). Los enlaces de las cotizaciones llevan un
        código privado difícil de adivinar y los archivos subidos tienen nombres aleatorios. Ningún sistema es
        completamente seguro: si detectamos un incidente que afecte tus datos, te avisaremos según lo que exige la ley.
      </p>
    </section>

    <section>
      <h2>10. Cambios a este aviso</h2>
      <p>
        Si cambiamos este aviso, publicaremos la nueva versión en esta página. Cada solicitud guarda la versión que
        aceptaste. Revisa también los <Link to={TERMS_PATH}>términos de la cotización</Link>.
      </p>
    </section>
  </article>
)

export default PrivacyPage
