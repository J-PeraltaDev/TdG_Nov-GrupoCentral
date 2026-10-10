/*
 * Regla de la contraseña (pantalla 03 de Figma): «Mínimo 8 caracteres» y «Al menos una letra y
 * un número». Auth solo exige el mínimo; el resto lo exige la aplicación, en el navegador y en
 * las Edge Functions (RF-02 y RF-03).
 *
 * Hay dos copias de este archivo, idénticas desde la primera constante: esta y
 * `supabase/functions/_shared/contrasena.js`. Las funciones no pueden importar código de `src/`.
 * Una prueba (`supabase/functions/_shared/contrasena.test.js`) falla si alguna cambia sin la otra.
 */

export const CONTRASENA_MIN_CARACTERES = 8
/** Auth cifra con bcrypt, que no usa más de 72 caracteres. */
export const CONTRASENA_MAX_CARACTERES = 72

/**
 * Cuáles de las dos reglas visibles cumple lo escrito.
 *
 * @param {unknown} contrasena
 * @returns {{ longitud: boolean, letraYNumero: boolean }}
 */
export function reglasDeContrasena(contrasena) {
  const texto = typeof contrasena === 'string' ? contrasena : ''
  return {
    longitud: texto.length >= CONTRASENA_MIN_CARACTERES,
    letraYNumero: /\p{L}/u.test(texto) && /\d/.test(texto),
  }
}

/** @param {unknown} contrasena */
export function esContrasenaValida(contrasena) {
  if (typeof contrasena !== 'string' || contrasena.length > CONTRASENA_MAX_CARACTERES) return false
  const { longitud, letraYNumero } = reglasDeContrasena(contrasena)
  return longitud && letraYNumero
}
