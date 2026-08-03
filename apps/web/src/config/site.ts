/**
 * ⚠️ DATOS PROVISORIOS — REEMPLAZAR ANTES DE PUBLICAR
 *
 * El número de WhatsApp es un marcador de posición deliberadamente inválido
 * (todo ceros). No se usó un número al azar a propósito: un móvil chileno
 * aleatorio puede pertenecer a una persona real, que recibiría las consultas
 * de los clientes.
 *
 * Formato esperado: código de país + número, sin "+" ni espacios.
 * Ejemplo para Chile: '56912345678'.
 */
export const WHATSAPP_NUMBER = '56900000000'

export const WHATSAPP_DEFAULT_MESSAGE =
  'Hola Confecciones Juany, quiero cotizar unos productos.'

export const buildWhatsAppUrl = (message: string = WHATSAPP_DEFAULT_MESSAGE) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
