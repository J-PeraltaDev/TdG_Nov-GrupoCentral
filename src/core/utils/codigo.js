/**
 * Código visible de la novedad (RF-06): `NOV-` más el consecutivo con al menos 4 dígitos.
 *
 * @param {number | string} codigo
 */
export function formatearCodigo(codigo) {
  return `NOV-${String(codigo).padStart(4, '0')}`
}

/**
 * Identificador local de una novedad pendiente de sincronizar (Figma 07 y 08: «LOC-7F3A»): sale
 * del `id_local` que se generó en el dispositivo. El código definitivo lo da el servidor al
 * sincronizar.
 *
 * @param {string} idLocal
 */
export function codigoLocal(idLocal) {
  return `LOC-${idLocal.slice(0, 4).toUpperCase()}`
}
