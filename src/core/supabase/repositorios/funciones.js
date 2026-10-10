import { supabase } from '../cliente.js'

/*
 * Llamada a una Edge Function (IAdmin e IRecuperación; SDD 5.3.4, Tabla 23). Las funciones
 * responden sus errores con el cuerpo `{ codigo, campos }`; aquí se convierten en un error
 * cuyo mensaje es ese código, igual que los de las funciones de la base de datos, para que
 * `core/errores` los traduzca sin distinguir de dónde vienen.
 */

/**
 * @typedef {Error & { status?: number, campos: string[] }} ErrorDeFuncion
 *   `message` es el código (Tabla 22, o `CORREO_EXISTENTE`, `NO_ENCONTRADO`…); `campos`, los
 *   datos de la solicitud que están mal.
 */

/**
 * @param {string} nombre Nombre de la función (`gestionar-usuario`, `restablecer-contrasena`).
 * @param {object} cuerpo
 * @returns {Promise<any>} El cuerpo de la respuesta. Si falla, lanza un `ErrorDeFuncion` o,
 *   si la petición no llegó, el error de red de supabase-js.
 */
export async function invocarFuncion(nombre, cuerpo) {
  const { data, error } = await supabase.functions.invoke(nombre, { body: cuerpo })
  if (!error) return data

  // La petición no llegó a la función: es un error de red, y `core/errores` ya lo reconoce.
  const respuesta = /** @type {any} */ (error).context
  if (!(respuesta instanceof Response)) throw error

  // Respondió la función, con su código, o la plataforma (un 401 sin token válido, cuyo
  // cuerpo no trae `codigo`: se reconoce por el estado).
  const detalle = await respuesta.json().catch(() => null)
  const fallo = /** @type {ErrorDeFuncion} */ (
    new Error(typeof detalle?.codigo === 'string' ? detalle.codigo : 'DESCONOCIDO')
  )
  fallo.name = 'ErrorDeFuncion'
  fallo.status = respuesta.status
  fallo.campos = Array.isArray(detalle?.campos) ? detalle.campos : []
  throw fallo
}
