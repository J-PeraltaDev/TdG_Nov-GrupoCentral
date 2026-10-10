/*
 * Validaciones de forma que comparten las Edge Functions. Módulo puro (docs/adr/0012).
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Forma mínima de un correo: algo, una arroba, un dominio con punto, sin espacios.
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CORREO_MAX_CARACTERES = 254

/** @param {unknown} valor */
export function esUuid(valor) {
  return typeof valor === 'string' && UUID.test(valor)
}

/**
 * El correo en minúsculas y sin espacios en los extremos, o `null` si no tiene forma de correo.
 * Auth guarda los correos en minúsculas: así `usuario.correo` coincide siempre con el suyo.
 *
 * @param {unknown} valor
 * @returns {string | null}
 */
export function normalizarCorreo(valor) {
  if (typeof valor !== 'string') return null
  const correo = valor.trim().toLowerCase()
  return correo.length <= CORREO_MAX_CARACTERES && CORREO.test(correo) ? correo : null
}

/** `null` y `undefined` son lo mismo: el dato no llegó. */
export function falta(valor) {
  return valor === null || valor === undefined
}
