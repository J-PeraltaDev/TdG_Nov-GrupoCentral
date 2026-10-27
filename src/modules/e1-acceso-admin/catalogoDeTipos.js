import { cuantasNovedades } from '../../core/utils/texto.js'

/*
 * Lo que la pantalla 31 calcula del catálogo y su auditoría (RF-32; decisiones 49 y 52).
 */

/** @typedef {import('../../core/supabase/repositorios/tiposFalla.js').TipoDelCatalogo} TipoDelCatalogo */
/** @typedef {import('../../core/supabase/repositorios/tiposFalla.js').CambioDelCatalogo} CambioDelCatalogo */

/** Los nombres de `accion_auditoria`, como la columna «Acción» de 31. */
export const NOMBRE_DE_ACCION = {
  renombrar: 'Renombrar',
  fusionar: 'Fusionar',
  desactivar: 'Desactivar',
  reactivar: 'Reactivar',
}

/**
 * Como `private.normalizar_tipo_falla`: minúsculas, sin tildes y con espacios simples. A
 * diferencia de `sinTildes`, quita también la virgulilla de la ñ, como `unaccent`.
 *
 * @param {string | null | undefined} nombre
 */
export const normalizarNombre = (nombre) =>
  (nombre ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * La lista de 31: sin los fusionados («retira el origen de la lista», RF-32), que se reconocen
 * por su auditoría; los activos primero, de más a menos novedades, y después por nombre.
 *
 * @param {TipoDelCatalogo[]} tipos
 * @param {CambioDelCatalogo[]} cambios
 */
export function ordenarCatalogo(tipos, cambios) {
  const fusionados = new Set(
    cambios.filter(({ accion }) => accion === 'fusionar').map(({ tipo_falla_id }) => tipo_falla_id),
  )
  return tipos
    .filter(({ id }) => !fusionados.has(id))
    .toSorted(
      (a, b) =>
        Number(b.activo) - Number(a.activo) ||
        b.novedades - a.novedades ||
        a.nombre.localeCompare(b.nombre, 'es'),
    )
}

/**
 * El otro tipo que ya tiene ese nombre, como lo compara el servidor, o `null`. Busca en todo
 * el catálogo, también los inactivos y los fusionados: sus nombres siguen ocupados.
 *
 * @param {string} nombre
 * @param {string} tipoId El que se renombra: el mismo tipo con otras tildes sí vale.
 * @param {TipoDelCatalogo[]} tipos
 */
export function nombreRepetido(nombre, tipoId, tipos) {
  const buscado = normalizarNombre(nombre)
  if (buscado === '') return null
  return (
    tipos.find(({ id, nombre: otro }) => id !== tipoId && normalizarNombre(otro) === buscado) ??
    null
  )
}

/**
 * El nombre que tenía un tipo justo después de una fecha: el anterior del primer renombre
 * posterior o, si no hubo, el actual.
 *
 * @param {string} tipoId
 * @param {string} fecha
 * @param {TipoDelCatalogo[]} tipos
 * @param {CambioDelCatalogo[]} cambios
 */
function nombreDespuesDe(tipoId, fecha, tipos, cambios) {
  const desde = Date.parse(fecha)
  const [siguiente] = cambios
    .filter(
      (cambio) =>
        cambio.accion === 'renombrar' &&
        cambio.tipo_falla_id === tipoId &&
        Date.parse(cambio.fecha) > desde,
    )
    .toSorted((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha))
  return siguiente?.valor_anterior ?? tipos.find(({ id }) => id === tipoId)?.nombre ?? ''
}

/**
 * La columna «Cambio» de 31: ««internet» → «Conectividad a internet»» en un renombre, el
 * origen y el destino en una fusión y el tipo en una desactivación o una reactivación.
 *
 * @param {CambioDelCatalogo} cambio
 * @param {TipoDelCatalogo[]} tipos
 * @param {CambioDelCatalogo[]} cambios
 */
export function textoDelCambio(cambio, tipos, cambios) {
  const { accion, tipo_falla_id, tipo_destino_id, valor_anterior, fecha } = cambio
  if (accion === 'desactivar' || accion === 'reactivar') return `«${valor_anterior}»`
  const nuevo = nombreDespuesDe(
    accion === 'renombrar' ? tipo_falla_id : (tipo_destino_id ?? ''),
    fecha,
    tipos,
    cambios,
  )
  return `«${valor_anterior}» → «${nuevo}»`
}

/**
 * «Biométrico (11 novedades)», como las opciones de 31-C.
 *
 * @param {TipoDelCatalogo} tipo
 */
export const opcionDeTipo = (tipo) => `${tipo.nombre} (${cuantasNovedades(tipo.novedades)})`

/**
 * Lo que pasará al fusionar (31-C): «Las 2 novedades de «Falla biometrico» pasarán a
 * «Biométrico», que quedará con 13. «Falla biometrico» saldrá de la lista.»
 *
 * @param {TipoDelCatalogo} origen
 * @param {TipoDelCatalogo} destino
 */
export function avisoDeFusion(origen, destino) {
  const sale = `«${origen.nombre}» saldrá de la lista.`
  if (origen.novedades === 0) return `«${origen.nombre}» no tiene novedades. ${sale}`
  const pasan =
    origen.novedades === 1
      ? `La novedad de «${origen.nombre}» pasará`
      : `Las ${origen.novedades} novedades de «${origen.nombre}» pasarán`
  return `${pasan} a «${destino.nombre}», que quedará con ${origen.novedades + destino.novedades}. ${sale}`
}

/**
 * La confirmación de desactivar (sin dibujo en Figma; decisión 52), con su singular.
 *
 * @param {TipoDelCatalogo} tipo
 */
export function avisoDeDesactivar(tipo) {
  const sale = `«${tipo.nombre}» saldrá de las sugerencias.`
  if (tipo.novedades === 0) return sale
  return tipo.novedades === 1
    ? `${sale} Su novedad lo conserva.`
    : `${sale} Sus ${tipo.novedades} novedades lo conservan.`
}
