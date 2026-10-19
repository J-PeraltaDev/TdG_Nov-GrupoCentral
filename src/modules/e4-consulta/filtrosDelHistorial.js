import { esUuid } from '../../../supabase/functions/_shared/validaciones.js'
import { NOMBRE_DE_ESTADO } from '../../core/utils/estados.js'
import { hoyEnColombia, MESES } from '../../core/utils/fechas.js'

/*
 * Filtros del historial (RF-19; plan del Sprint 5, decisión 10). Viven en la dirección, como los
 * de la bandeja: `finca`, `area`, `estado` (lista separada por comas o `abiertas`), `desde`,
 * `hasta`, `tipo` y `pagina`. Así el panel enlaza con filtros puestos y el detalle vuelve al
 * mismo resultado. Lo que llega mal formado se ignora.
 */

/** @typedef {import('../../core/supabase/database.types').Database['public']['Enums']['estado_novedad']} EstadoNovedad */

/**
 * @typedef {object} FiltroDelHistorial
 * @property {string | null} finca
 * @property {string | null} area
 * @property {EstadoNovedad[]} estados Vacío: todos.
 * @property {string | null} desde Día de Colombia (`AAAA-MM-DD`), inclusivo.
 * @property {string | null} hasta Día de Colombia (`AAAA-MM-DD`), inclusivo.
 * @property {string | null} tipo
 */

/** @typedef {{ id: string, nombre: string, activo: boolean }} Opcion */
/** @typedef {{ fincas: Opcion[], areas: Opcion[], tipos: Opcion[] }} OpcionesDelHistorial */

/** @type {FiltroDelHistorial} */
export const SIN_FILTROS = Object.freeze({
  finca: null,
  area: null,
  estados: [],
  desde: null,
  hasta: null,
  tipo: null,
})

/** Los estados en el orden de la Tabla 28, que es el de los controles y los chips. */
const ESTADOS = /** @type {EstadoNovedad[]} */ (Object.keys(NOMBRE_DE_ESTADO))

/** Los seis estados que no son finales (SDD, Tabla 34): el grupo «abiertas», que usa el panel. */
export const ABIERTAS = ESTADOS.filter((estado) => estado !== 'rechazada' && estado !== 'cerrada')

const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/

/** Un día que existe en el calendario, como lo da `<input type="date">`. */
function esDia(texto) {
  const partes = FECHA.exec(texto ?? '')
  if (!partes) return false
  const [anio, mes, dia] = partes.slice(1).map(Number)
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  return fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
}

const sonLasAbiertas = (estados) => estados.join() === ABIERTAS.join()

/**
 * Los filtros y la página (desde 0) que trae la dirección.
 *
 * @param {URLSearchParams} parametros
 * @returns {FiltroDelHistorial & { pagina: number }}
 */
export function leerFiltros(parametros) {
  const uuid = (clave) => (esUuid(parametros.get(clave)) ? parametros.get(clave) : null)
  const dia = (clave) => (esDia(parametros.get(clave)) ? parametros.get(clave) : null)
  const estado = parametros.get('estado') ?? ''
  const pedidos = estado.split(',')
  const pagina = Number(parametros.get('pagina'))
  return {
    finca: uuid('finca'),
    area: uuid('area'),
    estados: estado === 'abiertas' ? ABIERTAS : ESTADOS.filter((e) => pedidos.includes(e)),
    desde: dia('desde'),
    hasta: dia('hasta'),
    tipo: uuid('tipo'),
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina - 1 : 0,
  }
}

/**
 * La parte de la dirección después de «?», sin lo que no filtra.
 *
 * @param {FiltroDelHistorial & { pagina?: number }} filtro
 */
export function escribirFiltros({ finca, area, estados, desde, hasta, tipo, pagina = 0 }) {
  const parametros = Object.entries({
    finca,
    area,
    estado: sonLasAbiertas(estados) ? 'abiertas' : estados.join(','),
    desde,
    hasta,
    tipo,
    pagina: pagina > 0 ? String(pagina + 1) : null,
  }).filter(([, valor]) => valor)
  // Las comas de `estado` se leen mejor sin codificar; los demás valores no las llevan.
  return new URLSearchParams(parametros).toString().replaceAll('%2C', ',')
}

/**
 * 21-B: la fecha inicial es posterior a la final. El mismo día en las dos es un rango válido.
 *
 * @param {Pick<FiltroDelHistorial, 'desde' | 'hasta'>} filtro
 */
export function rangoInvertido({ desde, hasta }) {
  return Boolean(desde && hasta && desde > hasta)
}

/**
 * «01 abr», con el año si se pide. Se lee del texto, sin pasar por `Date`.
 *
 * @param {string} dia `AAAA-MM-DD`.
 * @param {boolean} conAnio
 */
function fechaDelRango(dia, conAnio) {
  const [anio, mes, numero] = dia.split('-')
  return `${numero} ${MESES[Number(mes) - 1]}${conAnio ? ` ${anio}` : ''}`
}

/**
 * El texto del control del rango (Figma 21: «01 abr 2026 – 24 sep 2026»).
 *
 * @param {Pick<FiltroDelHistorial, 'desde' | 'hasta'>} filtro
 */
export function textoDelRango({ desde, hasta }) {
  if (desde && hasta) return `${fechaDelRango(desde, true)} – ${fechaDelRango(hasta, true)}`
  if (desde) return `Desde ${fechaDelRango(desde, true)}`
  if (hasta) return `Hasta ${fechaDelRango(hasta, true)}`
  return 'Todas las fechas'
}

/**
 * El texto del control de los estados (Figma 21: «Resuelta, Cerrada»).
 *
 * @param {EstadoNovedad[]} estados
 */
export function textoDeEstados(estados) {
  if (estados.length === 0) return 'Todos'
  if (sonLasAbiertas(estados)) return 'Abiertas'
  return estados.map((estado) => NOMBRE_DE_ESTADO[estado]).join(', ')
}

/**
 * Los textos del chip del rango: el del escritorio («Desde 01 abr hasta 24 sep 2026», con el
 * año una sola vez si es el mismo) y el corto del teléfono («01 abr – 24 sep», con el año solo
 * si no es el actual).
 */
function chipDelRango({ desde, hasta }, anioActual) {
  const corta = (dia) => fechaDelRango(dia, !dia.startsWith(anioActual))
  if (desde && hasta) {
    const mismoAnio = desde.slice(0, 4) === hasta.slice(0, 4)
    return {
      texto: `Desde ${fechaDelRango(desde, !mismoAnio)} hasta ${fechaDelRango(hasta, true)}`,
      corto: `${corta(desde)} – ${corta(hasta)}`,
    }
  }
  if (desde) return { texto: `Desde ${fechaDelRango(desde, true)}`, corto: `Desde ${corta(desde)}` }
  return { texto: `Hasta ${fechaDelRango(hasta, true)}`, corto: `Hasta ${corta(hasta)}` }
}

/**
 * Un chip por filtro puesto, en el orden de los controles (Figma 21 y 21-D). Reflejan la
 * dirección, no el formulario.
 *
 * @param {FiltroDelHistorial} filtro
 * @param {OpcionesDelHistorial} opciones
 * @param {Date | string | number} [ahora]
 * @returns {{ clave: 'finca' | 'area' | 'estado' | 'rango' | 'tipo', texto: string, corto: string }[]}
 */
export function chipsDelFiltro(filtro, opciones, ahora = Date.now()) {
  // Mientras llegan las opciones, el nombre no se sabe todavía.
  const nombre = (lista, id) => lista.find((opcion) => opcion.id === id)?.nombre ?? '…'
  const chips = []
  if (filtro.finca) {
    const finca = nombre(opciones.fincas, filtro.finca)
    chips.push({ clave: 'finca', texto: `Finca: ${finca}`, corto: finca })
  }
  if (filtro.area) {
    const area = nombre(opciones.areas, filtro.area)
    chips.push({ clave: 'area', texto: `Área: ${area}`, corto: area })
  }
  if (filtro.estados.length > 0) {
    const estados = textoDeEstados(filtro.estados)
    chips.push({ clave: 'estado', texto: `Estado: ${estados}`, corto: estados })
  }
  if (filtro.desde || filtro.hasta) {
    chips.push({ clave: 'rango', ...chipDelRango(filtro, hoyEnColombia(ahora).slice(0, 4)) })
  }
  if (filtro.tipo) {
    const tipo = nombre(opciones.tipos, filtro.tipo)
    chips.push({ clave: 'tipo', texto: `Tipo de falla: ${tipo}`, corto: tipo })
  }
  return chips
}

/**
 * Los filtros sin el de ese chip, desde la primera página.
 *
 * @param {FiltroDelHistorial} filtro
 * @param {'finca' | 'area' | 'estado' | 'rango' | 'tipo'} clave
 */
export function quitarFiltro(filtro, clave) {
  const sin = {
    finca: { finca: null },
    area: { area: null },
    estado: { estados: [] },
    rango: { desde: null, hasta: null },
    tipo: { tipo: null },
  }[clave]
  return { ...filtro, ...sin, pagina: 0 }
}
