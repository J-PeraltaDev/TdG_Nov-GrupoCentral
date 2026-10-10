import { cabecerasCors } from './cors.js'

/*
 * Lo que todas las Edge Functions hacen igual con una petición (SDD 5.3.4, Tabla 23): responder
 * la consulta previa del navegador, admitir solo POST con un objeto JSON, llamar al manejador y
 * convertir su resultado en la respuesta HTTP.
 *
 * Los errores llevan siempre el mismo cuerpo, `{ codigo, campos }`: `codigo` es un código
 * estable, como los de la Tabla 22, y `campos` dice qué datos de la solicitud están mal.
 *
 * Módulo puro: usa `Request` y `Response`, que existen igual en Deno y en Node (docs/adr/0012).
 */

/**
 * @typedef {object} Resultado
 * @property {number} estado Estado HTTP.
 * @property {object} cuerpo
 */

/**
 * Resultado de error para un manejador.
 *
 * @param {number} estado
 * @param {string} codigo
 * @param {string[]} [campos]
 * @returns {Resultado}
 */
export function fallo(estado, codigo, campos) {
  return { estado, cuerpo: campos?.length ? { codigo, campos } : { codigo } }
}

/**
 * Token de la cabecera `Authorization: Bearer …`, o `null`.
 *
 * @param {Request} peticion
 */
export function tokenDe(peticion) {
  const coincidencia = /^Bearer\s+(\S+)$/i.exec(peticion.headers.get('authorization') ?? '')
  return coincidencia ? coincidencia[1] : null
}

function responder(estado, cuerpo, cors) {
  return new Response(cuerpo === null ? null : JSON.stringify(cuerpo), {
    status: estado,
    headers: {
      ...cors,
      ...(cuerpo === null ? {} : { 'Content-Type': 'application/json; charset=utf-8' }),
      // Las respuestas pueden traer datos de una persona: no se guardan en ninguna caché.
      'Cache-Control': 'no-store',
    },
  })
}

/**
 * Atiende una petición con el manejador de la función.
 *
 * @param {Request} peticion
 * @param {(cuerpo: Record<string, unknown>, peticion: Request) => Promise<Resultado>} manejar
 * @returns {Promise<Response>}
 */
export async function atender(peticion, manejar) {
  const cors = cabecerasCors(peticion.headers.get('origin'))

  if (peticion.method === 'OPTIONS') return responder(204, null, cors)
  if (peticion.method !== 'POST') return responder(405, { codigo: 'METODO_NO_PERMITIDO' }, cors)

  let cuerpo
  try {
    cuerpo = await peticion.json()
  } catch {
    cuerpo = null
  }
  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return responder(400, fallo(400, 'DATO_OBLIGATORIO', ['cuerpo']).cuerpo, cors)
  }

  try {
    const resultado = await manejar(cuerpo, peticion)
    return responder(resultado.estado, resultado.cuerpo, cors)
  } catch (error) {
    // Solo el tipo del error: ni su mensaje ni el cuerpo de la petición, que puede traer una
    // contraseña o un código temporal (RF-02), van al registro.
    console.error('Fallo inesperado en la función:', error instanceof Error ? error.name : 'Error')
    return responder(500, { codigo: 'ERROR' }, cors)
  }
}
