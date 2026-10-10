/** La misma forma mínima que revisan las Edge Functions: algo, una arroba y un dominio con
 * punto, sin espacios. */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Auth no admite correos de más de 254 caracteres. */
const CORREO_MAX_CARACTERES = 254

/**
 * Indica si el texto, sin los espacios de los extremos, tiene forma de correo.
 *
 * @param {unknown} texto
 */
export function esCorreoValido(texto) {
  if (typeof texto !== 'string') return false
  const correo = texto.trim()
  return correo.length <= CORREO_MAX_CARACTERES && CORREO.test(correo)
}
