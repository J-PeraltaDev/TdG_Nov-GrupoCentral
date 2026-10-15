import {
  cambiarNovedadesDescargadas,
  guardarMeta,
  leerMeta,
  leerNovedadDescargada,
  leerNovedadesDescargadas,
} from './bd.js'

/*
 * Novedades descargadas, para consultarlas sin conexión (RF-24 / CU-24, SDD Tabla 32; decisión
 * 13 del plan del Sprint 4). Cada consulta con conexión guarda lo que trae, combinado por `id`
 * con lo que ya había. Sin conexión, cada lista se arma aquí con el mismo filtro, orden, conteo y
 * páginas que el servidor. Lo que la persona no abrió con conexión no está.
 */

const PRIORIDADES = ['critico', 'alto', 'normal', 'bajo']
const instante = (fecha) => Date.parse(fecha)

/** Los órdenes de las listas: los mismos del servidor (`repositorios/novedades.js`). */
export const ORDEN = {
  /** Mis novedades: de la más reciente a la más antigua. */
  recientes: (a, b) =>
    instante(b.fecha_registro) - instante(a.fecha_registro) || b.codigo - a.codigo,
  /** Bandeja y escaladas: por prioridad y, en cada una, de la más antigua a la más reciente. */
  porPrioridad: (a, b) =>
    PRIORIDADES.indexOf(a.prioridad) - PRIORIDADES.indexOf(b.prioridad) ||
    instante(a.fecha_registro) - instante(b.fecha_registro) ||
    a.codigo - b.codigo,
}

/** Sin conexión, esa lista o esa novedad nunca se descargó (CU-24 3a). */
export class SinDescarga extends Error {
  name = 'SinDescarga'
}

/**
 * @typedef {object} Lista
 * @property {string} clave Identifica la lista: su fecha de descarga va en `meta`.
 * @property {(novedad: object) => boolean} filtro
 * @property {(a: object, b: object) => number} orden
 */

/**
 * Lo nuevo sobre lo que ya había. Si cambió el estado, la línea de tiempo guardada ya no
 * corresponde: se descarta hasta que se vuelva a abrir la novedad con conexión.
 */
function combinar(anterior, nueva, fecha) {
  const registro = { ...anterior, ...nueva, descargada_en: fecha }
  if (anterior?.estado && anterior.estado !== nueva.estado) delete registro.linea_de_tiempo
  return registro
}

/**
 * Guarda una página que llegó del servidor. Las descargadas que cumplen el filtro y que, por su
 * lugar en el orden, tendrían que haber llegado en esta página pero no llegaron, ya no están en
 * la lista (cambiaron de estado o de alcance): se borran.
 *
 * @param {Lista} lista
 * @param {number} desde Posición de la primera de la página.
 * @param {{ novedades: object[], total: number }} pagina
 */
export function guardarPagina({ clave, filtro, orden }, desde, { novedades, total }) {
  const fecha = new Date().toISOString()
  const llegaron = new Set(novedades.map(({ id }) => id))
  const [primera, ultima] = [novedades[0], novedades.at(-1)]
  const hastaElFinal = desde + novedades.length >= total
  const cubierta = (novedad) =>
    (desde === 0 || (primera !== undefined && orden(primera, novedad) <= 0)) &&
    (hastaElFinal || (ultima !== undefined && orden(novedad, ultima) <= 0))

  return cambiarNovedadesDescargadas((actuales) => {
    const porId = new Map(actuales.map((novedad) => [novedad.id, novedad]))
    return {
      guardar: novedades.map((novedad) => combinar(porId.get(novedad.id), novedad, fecha)),
      borrar: actuales
        .filter((novedad) => !llegaron.has(novedad.id) && filtro(novedad) && cubierta(novedad))
        .map(({ id }) => id),
      // La fecha de la lista es la de su primera página: la que se ve al abrirla.
      descarga: desde === 0 ? { clave, fecha } : undefined,
    }
  })
}

/**
 * Una página armada con lo descargado, como la daría el servidor, y la fecha de la descarga de
 * esa lista. Si la lista nunca se descargó, lanza `SinDescarga`.
 *
 * @param {Lista} lista
 * @param {number} desde
 * @param {number} cantidad
 * @returns {Promise<{ novedades: object[], total: number, descargadaEn: string }>}
 */
export async function leerPagina({ clave, filtro, orden }, desde, cantidad) {
  const descargadaEn = await leerMeta(`descarga:${clave}`)
  if (!descargadaEn) throw new SinDescarga()
  const lista = (await leerNovedadesDescargadas()).filter(filtro).sort(orden)
  return { novedades: lista.slice(desde, desde + cantidad), total: lista.length, descargadaEn }
}

/**
 * Cuántas descargadas cumplen el filtro.
 *
 * @param {(novedad: object) => boolean} filtro
 */
export async function contarDescargadas(filtro) {
  return (await leerNovedadesDescargadas()).filter(filtro).length
}

/**
 * Guarda un conteo del servidor (pestañas y contadores): sin conexión se muestra el de la última
 * descarga, aunque esa lista no se haya abierto (Figma 04-B y 11-B).
 *
 * @param {string} clave
 * @param {number} cantidad
 */
export function guardarConteo(clave, cantidad) {
  return guardarMeta(`descarga:conteo:${clave}`, cantidad)
}

/**
 * El conteo descargado o, si nunca se descargó, cuántas descargadas cumplen el filtro.
 *
 * @param {string} clave
 * @param {(novedad: object) => boolean} filtro
 */
export async function leerConteo(clave, filtro) {
  return (await leerMeta(`descarga:conteo:${clave}`)) ?? contarDescargadas(filtro)
}

/**
 * Guarda lo que se descargó de una sola novedad: la novedad misma (el detalle) o algo que se le
 * suma, como su línea de tiempo o su escalamiento. El detalle pide la novedad y su línea de
 * tiempo a la vez: si la línea llega primero, espera sola, sin estado, y ninguna lista la toma.
 *
 * @param {string} id
 * @param {object} datos
 * @param {{ completa?: boolean }} [opciones] `completa`: `datos` es la novedad misma.
 */
export function guardarNovedad(id, datos, { completa = false } = {}) {
  const fecha = new Date().toISOString()
  return cambiarNovedadesDescargadas((actuales) => {
    const anterior = actuales.find((novedad) => novedad.id === id)
    return {
      guardar: [completa ? combinar(anterior, datos, fecha) : { ...anterior, id, ...datos }],
    }
  })
}

/**
 * Una novedad descargada, o `SinDescarga`.
 *
 * @param {string} id
 */
export async function leerNovedad(id) {
  const novedad = await leerNovedadDescargada(id)
  if (!novedad?.estado) throw new SinDescarga()
  return novedad
}
