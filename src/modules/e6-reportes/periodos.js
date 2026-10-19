import { esDia, hoyEnColombia, MESES } from '../../core/utils/fechas.js'
import { textoDelRango } from '../e4-consulta/filtrosDelHistorial.js'

/*
 * Períodos del panel (plan del Sprint 5, decisión 23): las opciones de Figma y uno
 * personalizado. «Últimos N meses» son meses de calendario hasta hoy, en la hora de Colombia:
 * el 24 sep, «Últimos 3 meses» va del 1 jul al 24 sep. El período va en la dirección
 * (`?periodo=3m`, o `desde` y `hasta`), como los filtros del historial.
 */

/** Las opciones del selector, en el orden de Figma. */
export const PERIODOS = [
  { clave: 'mes', nombre: 'Mes actual', meses: 1 },
  { clave: '3m', nombre: 'Últimos 3 meses', meses: 3 },
  { clave: '6m', nombre: 'Últimos 6 meses', meses: 6 },
  { clave: '12m', nombre: 'Últimos 12 meses', meses: 12 },
]

/**
 * @typedef {object} Periodo
 * @property {string} clave Una de `PERIODOS` o `personalizado`.
 * @property {string} desde Día de Colombia (`AAAA-MM-DD`), inclusivo.
 * @property {string} hasta Día de Colombia (`AAAA-MM-DD`), inclusivo.
 * @property {string} etiqueta Escritorio: «Últimos 3 meses (jul–sep 2026)».
 * @property {string} corta Teléfono (Figma 27): «Últimos 3 meses».
 */

const mes = (dia) => MESES[Number(dia.slice(5, 7)) - 1]

/**
 * El período de la dirección; si no trae uno válido, el de la pestaña.
 *
 * @param {URLSearchParams} parametros
 * @param {string} porOmision Clave de `PERIODOS`.
 * @param {Date | string | number} [ahora]
 * @returns {Periodo}
 */
export function leerPeriodo(parametros, porOmision, ahora = Date.now()) {
  const desde = parametros.get('desde')
  const hasta = parametros.get('hasta')
  if (esDia(desde) && esDia(hasta) && desde <= hasta) {
    const etiqueta = textoDelRango({ desde, hasta })
    return { clave: 'personalizado', desde, hasta, etiqueta, corta: etiqueta }
  }

  const { clave, nombre, meses } =
    PERIODOS.find((periodo) => periodo.clave === parametros.get('periodo')) ??
    PERIODOS.find((periodo) => periodo.clave === porOmision)
  const hoy = hoyEnColombia(ahora)
  const [anio, mesDeHoy] = hoy.split('-').map(Number)
  const inicio = new Date(Date.UTC(anio, mesDeHoy - meses, 1)).toISOString().slice(0, 10)
  const final = `${mes(hoy)} ${hoy.slice(0, 4)}`
  let rango = final
  if (meses > 1) {
    rango = inicio.startsWith(hoy.slice(0, 4))
      ? `${mes(inicio)}–${final}`
      : `${mes(inicio)} ${inicio.slice(0, 4)}–${final}`
  }
  return { clave, desde: inicio, hasta: hoy, etiqueta: `${nombre} (${rango})`, corta: nombre }
}

/**
 * Los parámetros de la dirección con otro período; los demás (la pestaña) no cambian.
 *
 * @param {URLSearchParams} parametros
 * @param {Pick<Periodo, 'clave'> & Partial<Periodo>} periodo
 */
export function escribirPeriodo(parametros, { clave, desde, hasta }) {
  const nuevos = new URLSearchParams(parametros)
  for (const nombre of ['periodo', 'desde', 'hasta']) nuevos.delete(nombre)
  if (clave === 'personalizado') {
    nuevos.set('desde', desde)
    nuevos.set('hasta', hasta)
  } else {
    nuevos.set('periodo', clave)
  }
  return nuevos
}

/**
 * El primer día de cada mes del período: el eje del gráfico mensual (Figma 24).
 *
 * @param {Pick<Periodo, 'desde' | 'hasta'>} periodo
 * @returns {string[]}
 */
export function mesesDelPeriodo({ desde, hasta }) {
  const meses = []
  let [anio, numero] = desde.split('-').map(Number)
  const ultimo = hasta.slice(0, 7)
  for (;;) {
    const actual = `${anio}-${String(numero).padStart(2, '0')}`
    meses.push(`${actual}-01`)
    if (actual >= ultimo) return meses
    numero = numero === 12 ? 1 : numero + 1
    if (numero === 1) anio += 1
  }
}
