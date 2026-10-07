import { ZONA_HORARIA } from '../config/parametros.js'

/*
 * Fechas de la interfaz (SDD 6.1.11), siempre en la zona horaria de Colombia.
 * Formato de Figma: «24 sep 2026, 7:40 a. m. · Sem 39».
 *
 * Intl en es-CO devuelve «24 de sept de 2026, 7:40 a. m.» (con «de», «sept» y espacios
 * especiales), así que el texto se arma con las partes numéricas y una tabla propia de meses.
 */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const PARTES = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

/**
 * Año, mes, día, hora y minuto de una fecha en la hora de Colombia.
 *
 * @param {Date | string | number} fecha
 */
function enColombia(fecha) {
  const partes = Object.fromEntries(
    PARTES.formatToParts(new Date(fecha)).map(({ type, value }) => [type, Number(value)]),
  )
  return {
    anio: partes.year,
    mes: partes.month,
    dia: partes.day,
    hora: partes.hour,
    minuto: partes.minute,
  }
}

/**
 * «24 sep 2026, 7:40 a. m.»
 *
 * @param {Date | string | number} fecha
 */
export function formatearFechaHora(fecha) {
  const { anio, mes, dia, hora, minuto } = enColombia(fecha)
  const hora12 = hora % 12 === 0 ? 12 : hora % 12
  const periodo = hora < 12 ? 'a. m.' : 'p. m.'
  return `${dia} ${MESES[mes - 1]} ${anio}, ${hora12}:${String(minuto).padStart(2, '0')} ${periodo}`
}

/**
 * Semana del año según ISO 8601 (la semana empieza el lunes y la semana 1 es la que contiene
 * el primer jueves del año), calculada con la fecha de Colombia.
 *
 * @param {Date | string | number} fecha
 */
export function semanaDelAnio(fecha) {
  const { anio, mes, dia } = enColombia(fecha)
  const jueves = new Date(Date.UTC(anio, mes - 1, dia))
  // Se mueve al jueves de la misma semana: su año es el año ISO.
  jueves.setUTCDate(jueves.getUTCDate() + 4 - (jueves.getUTCDay() || 7))
  const primeroDeEnero = Date.UTC(jueves.getUTCFullYear(), 0, 1)
  return Math.ceil(((jueves.getTime() - primeroDeEnero) / 86_400_000 + 1) / 7)
}

/**
 * «24 sep 2026, 7:40 a. m. · Sem 39»
 *
 * @param {Date | string | number} fecha
 */
export function formatearFechaConSemana(fecha) {
  return `${formatearFechaHora(fecha)} · Sem ${semanaDelAnio(fecha)}`
}

/**
 * Tiempo transcurrido, en corto: «ahora», «hace 5 min», «hace 3 h», «hace 2 d».
 *
 * @param {Date | string | number} fecha
 * @param {Date | string | number} [ahora]
 */
export function tiempoTranscurrido(fecha, ahora = Date.now()) {
  const minutos = Math.floor((new Date(ahora).getTime() - new Date(fecha).getTime()) / 60_000)
  if (minutos < 1) return 'ahora'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return `hace ${Math.floor(horas / 24)} d`
}
