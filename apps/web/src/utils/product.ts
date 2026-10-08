/**
 * `minOrder` se guarda como texto libre ("MOQ 20 unidades"), así que la
 * cantidad mínima se extrae del primer número. Si no hay ninguno, es 1.
 */
export const parseMinOrder = (minOrder: string): number => {
  const match = minOrder.match(/\d+/)
  return match ? Number(match[0]) : 1
}
