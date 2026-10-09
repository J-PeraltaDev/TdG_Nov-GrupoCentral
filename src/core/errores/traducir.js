/*
 * Traductor de errores (C-02, SDD Tabla 22): convierte lo que devuelve Supabase en un tipo
 * y un mensaje en español. Las funciones del servidor señalan los errores de negocio con una
 * excepción cuyo mensaje es un código estable; la API lo entrega como HTTP 400.
 */

/** @typedef {'negocio' | 'red' | 'sesion' | 'desconocido'} TipoDeError */

/**
 * @typedef {object} ErrorTraducido
 * @property {TipoDeError} tipo
 * @property {string} codigo Código de la Tabla 22, o RED, SESION_VENCIDA o DESCONOCIDO.
 * @property {string} mensaje Texto para mostrar a la persona.
 */

/** Mensajes de los códigos de la Tabla 22. */
const MENSAJES = {
  SIN_PERMISO: 'No tienes permiso para esta acción.',
  TRANSICION_INVALIDA: 'La novedad cambió de estado.',
  DATO_OBLIGATORIO: 'Falta un dato obligatorio. Revisa los campos e intenta de nuevo.',
  FECHA_INVALIDA: 'La fecha de ejecución no puede ser posterior a hoy.',
  AREA_INVALIDA: 'Elige otra área.',
  FINCA_NO_ASIGNADA: 'Tu usuario no tiene una finca asignada.',
  TIPO_FALLA_INVALIDO: 'Ese tipo de falla no está disponible. Elige otro.',
  // CU-02 9b: un código mal escrito se puede corregir; no hay que pedir otro de una vez.
  CODIGO_INVALIDO: 'El código no es válido. Revísalo; si sigue sin servir, pide uno nuevo.',
  CODIGO_VENCIDO: 'El código venció. Pídele uno nuevo al administrador.',
  // Sprint 3: códigos que no están en la Tabla 22 (docs/cambios-sdd.md).
  CORREO_EXISTENTE: 'Este correo ya está registrado.',
  NO_ENCONTRADO: 'No encontramos ese usuario.',
  SOLICITUD_INVALIDA: 'Esta solicitud ya no está disponible.',
  // CU-04 6a: lo arma el repositorio de fincas a partir de la restricción de unicidad. Va sin
  // punto, como lo escribe Figma (pantalla 30-B) bajo el campo.
  FINCA_EXISTENTE: 'Ya existe una finca con ese nombre en esta razón social',
}

const MENSAJE_DE_RED = 'No hay conexión. Revisa tu internet e intenta de nuevo.'
const MENSAJE_DE_SESION = 'Tu sesión venció. Ingresa de nuevo.'
const MENSAJE_DESCONOCIDO = 'Algo salió mal. Intenta de nuevo.'

const FALLO_DE_RED = /failed to fetch|networkerror|network request failed|load failed|fetch failed/i

/**
 * Indica si el error es un fallo de red: la solicitud no llegó o no volvió del servidor.
 *
 * @param {unknown} error
 */
export function esErrorDeRed(error) {
  if (!error || typeof error !== 'object') return false
  const { name, message, status } = /** @type {any} */ (error)
  return (
    name === 'AuthRetryableFetchError' ||
    // La petición no llegó a la Edge Function.
    name === 'FunctionsFetchError' ||
    (name === 'TypeError' && FALLO_DE_RED.test(String(message))) ||
    FALLO_DE_RED.test(String(message)) ||
    status === 0
  )
}

/**
 * Indica si el error es de sesión ausente o vencida (HTTP 401).
 *
 * @param {unknown} error
 */
export function esErrorDeSesion(error) {
  if (!error || typeof error !== 'object') return false
  const { name, code, status } = /** @type {any} */ (error)
  return status === 401 || code === 'PGRST301' || name === 'AuthSessionMissingError'
}

/**
 * @param {unknown} error Error de supabase-js (PostgREST o Auth) o una excepción cualquiera.
 * @returns {ErrorTraducido}
 */
export function traducirError(error) {
  if (esErrorDeRed(error)) return { tipo: 'red', codigo: 'RED', mensaje: MENSAJE_DE_RED }
  if (esErrorDeSesion(error)) {
    return { tipo: 'sesion', codigo: 'SESION_VENCIDA', mensaje: MENSAJE_DE_SESION }
  }

  const codigo = String(/** @type {any} */ (error)?.message ?? '').trim()
  if (Object.hasOwn(MENSAJES, codigo)) {
    return { tipo: 'negocio', codigo, mensaje: MENSAJES[codigo] }
  }

  return { tipo: 'desconocido', codigo: 'DESCONOCIDO', mensaje: MENSAJE_DESCONOCIDO }
}
