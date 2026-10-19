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

// «NOV», un guion o espacios opcionales y el número; hasta 15 dígitos, que `Number` lee exactos.
const CODIGO_ESCRITO = /^\s*(?:nov)?[\s-]*(\d{1,15})\s*$/i

/**
 * El consecutivo que alguien escribió en el buscador (plan del Sprint 5, decisión 15): acepta
 * «NOV-0153», «nov 153», «NOV0153», «0153» y «153». Cualquier otra cosa, `null`.
 *
 * @param {string} texto
 * @returns {number | null}
 */
export function leerCodigo(texto) {
  const numero = CODIGO_ESCRITO.exec(texto)?.[1]
  return numero ? Number(numero) : null
}
