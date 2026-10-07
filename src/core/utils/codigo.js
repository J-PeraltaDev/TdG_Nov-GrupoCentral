/**
 * Código visible de la novedad (RF-06): `NOV-` más el consecutivo con al menos 4 dígitos.
 *
 * @param {number | string} codigo
 */
export function formatearCodigo(codigo) {
  return `NOV-${String(codigo).padStart(4, '0')}`
}
