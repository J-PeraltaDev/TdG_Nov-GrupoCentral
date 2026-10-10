/*
 * CORS de las Edge Functions (SDD 5.3.4). Las llama el navegador desde la aplicación, que vive
 * en otro origen: el servidor de desarrollo, la vista previa local, producción en Cloudflare
 * Pages y las vistas previas de los pull requests.
 *
 * Nunca se responde con el comodín `*`: se devuelve el origen solo si es uno de la aplicación.
 * No es lo que protege a las funciones (eso lo hacen el token del administrador y el código
 * temporal), pero evita que otra página las use desde el navegador de alguien.
 *
 * Módulo puro, sin nada de Deno: lo prueba Vitest (docs/adr/0012).
 */

const ORIGENES = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://tdg-nov-grupocentral.pages.dev',
]

// Vista previa de un pull request: https://<nombre>.tdg-nov-grupocentral.pages.dev
const VISTA_PREVIA = /^https:\/\/[a-z0-9-]+\.tdg-nov-grupocentral\.pages\.dev$/

// Las que envía supabase-js al invocar una función (lista de su documentación).
const CABECERAS_PERMITIDAS =
  'authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage'

/** @param {unknown} origen Valor de la cabecera `Origin`. */
export function esOrigenPermitido(origen) {
  return typeof origen === 'string' && (ORIGENES.includes(origen) || VISTA_PREVIA.test(origen))
}

/**
 * Cabeceras CORS de la respuesta. A un origen ajeno no se le devuelve ningún permiso: el
 * navegador bloquea la lectura.
 *
 * @param {unknown} origen
 * @returns {Record<string, string>}
 */
export function cabecerasCors(origen) {
  // La respuesta cambia según el origen: una caché no debe servirle a uno la de otro.
  const cabeceras = { Vary: 'Origin' }
  if (!esOrigenPermitido(origen)) return cabeceras
  return {
    ...cabeceras,
    'Access-Control-Allow-Origin': /** @type {string} */ (origen),
    'Access-Control-Allow-Headers': CABECERAS_PERMITIDAS,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}
