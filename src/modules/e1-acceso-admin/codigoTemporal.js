/** El código temporal tiene seis dígitos (SDD 6.1.10). */
export const DIGITOS_DEL_CODIGO = 6

/**
 * Solo los dígitos de lo escrito o pegado, hasta seis. La pantalla 32 muestra el código en dos
 * grupos («482 719»): pegado así, queda completo.
 *
 * @param {unknown} texto
 */
export function soloDigitos(texto) {
  return String(texto ?? '')
    .replace(/\D/g, '')
    .slice(0, DIGITOS_DEL_CODIGO)
}

/**
 * El código en dos grupos, como lo escribe Figma en la pantalla 32: «482 719».
 *
 * @param {string} codigo
 */
export function enGrupos(codigo) {
  return `${codigo.slice(0, 3)} ${codigo.slice(3)}`
}
