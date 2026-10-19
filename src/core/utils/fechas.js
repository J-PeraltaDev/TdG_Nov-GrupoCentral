import { ZONA_HORARIA } from '../config/parametros.js'

/*
 * Fechas de la interfaz (SDD 6.1.11), siempre en la zona horaria de Colombia.
 * Formato de Figma: «24 sep 2026, 7:40 a. m. · Sem 39».
 *
 * Intl en es-CO devuelve «24 de sept de 2026, 7:40 a. m.» (con «de», «sept» y espacios
 * especiales), así que el texto se arma con las partes numéricas y una tabla propia de meses.
 */

export const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

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

/** «7:40 a. m.» a partir de la hora de 0 a 23. */
function horaDeDoce(hora, minuto) {
  const hora12 = hora % 12 === 0 ? 12 : hora % 12
  return `${hora12}:${String(minuto).padStart(2, '0')} ${hora < 12 ? 'a. m.' : 'p. m.'}`
}

/**
 * «24 sep 2026, 7:40 a. m.»
 *
 * @param {Date | string | number} fecha
 */
export function formatearFechaHora(fecha) {
  const { anio, mes, dia, hora, minuto } = enColombia(fecha)
  return `${dia} ${MESES[mes - 1]} ${anio}, ${horaDeDoce(hora, minuto)}`
}

/**
 * Fecha corta, sin año: «24 sep, 7:20 a. m.» (bandeja del escritorio y línea de tiempo).
 *
 * @param {Date | string | number} fecha
 */
export function formatearFechaCorta(fecha) {
  const { mes, dia, hora, minuto } = enColombia(fecha)
  return `${dia} ${MESES[mes - 1]}, ${horaDeDoce(hora, minuto)}`
}

/**
 * «24 sep, 8:15 a. m.» si es de este año y «30 dic 2025, 8:15 a. m.» si no («Registrada en
 * finca» del historial, decisión 12 del plan del Sprint 5).
 *
 * @param {Date | string | number} fecha
 * @param {Date | string | number} [ahora]
 */
export function formatearFechaDeLista(fecha, ahora = Date.now()) {
  return enColombia(fecha).anio === enColombia(ahora).anio
    ? formatearFechaCorta(fecha)
    : formatearFechaHora(fecha)
}

/**
 * El día, en corto: «22 sep», o «12 ago 2025» si fue otro año.
 *
 * @param {Date | string | number} fecha
 * @param {Date | string | number} [ahora]
 */
export function formatearDia(fecha, ahora = Date.now()) {
  const { anio, mes, dia } = enColombia(fecha)
  const corta = `${dia} ${MESES[mes - 1]}`
  return anio === enColombia(ahora).anio ? corta : `${corta} ${anio}`
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
 * «21 sep 2026, 6:48 a. m. (Sem 39)»: la semana entre paréntesis, como la escriben el detalle
 * (pantalla 22) y la constancia (pantalla 06).
 *
 * @param {Date | string | number} fecha
 */
export function formatearFechaYSemana(fecha) {
  return `${formatearFechaHora(fecha)} (Sem ${semanaDelAnio(fecha)})`
}

/**
 * «23 sep 2026» a partir de una fecha sin hora (`2026-09-23`), como `fecha_ejecucion`. Se
 * lee del texto, sin pasar por `Date`: la medianoche UTC es el día anterior en Colombia.
 *
 * @param {string} fecha `AAAA-MM-DD`.
 */
export function formatearFechaSinHora(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return `${dia} ${MESES[mes - 1]} ${anio}`
}

/**
 * «7:15 a. m.»
 *
 * @param {Date | string | number} fecha
 */
export function formatearHora(fecha) {
  const { hora, minuto } = enColombia(fecha)
  return horaDeDoce(hora, minuto)
}

/**
 * Indica si dos momentos caen en el mismo día de Colombia.
 *
 * @param {Date | string | number} fecha
 * @param {Date | string | number} [otra] Por defecto, ahora.
 */
export function esMismoDiaEnColombia(fecha, otra = Date.now()) {
  const a = enColombia(fecha)
  const b = enColombia(otra)
  return a.anio === b.anio && a.mes === b.mes && a.dia === b.dia
}

/**
 * Cuándo ingresó alguien por última vez, como lo escribe Figma en la pantalla 28: «hoy 7:18
 * a. m.», «ayer», «22 sep» o, si fue otro año, «12 ago 2025». Sin fecha, «Nunca».
 *
 * @param {Date | string | number | null | undefined} fecha
 * @param {Date | string | number} [ahora]
 */
export function formatearUltimoIngreso(fecha, ahora = Date.now()) {
  if (fecha === null || fecha === undefined) return 'Nunca'
  if (esMismoDiaEnColombia(fecha, ahora)) return `hoy ${formatearHora(fecha)}`
  // Colombia no cambia de hora: ayer es siempre 24 horas antes.
  if (esMismoDiaEnColombia(fecha, new Date(ahora).getTime() - 24 * 3_600_000)) return 'ayer'
  return formatearDia(fecha, ahora)
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

/**
 * En qué grupo de la pantalla 10 va un aviso y qué hora o fecha muestra (Figma 10; plan del
 * Sprint 5, decisión 32): hoy y ayer, la hora («7:40 a. m.»); en lo que va de la semana, que
 * empieza el lunes, el día («mar 22 sep»); antes, la fecha («15 sep», o «12 ago 2025» si fue
 * otro año).
 *
 * @param {Date | string | number} fecha
 * @param {Date | string | number} [ahora]
 * @returns {{ grupo: 'Hoy' | 'Ayer' | 'Esta semana' | 'Anteriores', cuando: string }}
 */
export function cuandoLlegoElAviso(fecha, ahora = Date.now()) {
  if (esMismoDiaEnColombia(fecha, ahora)) return { grupo: 'Hoy', cuando: formatearHora(fecha) }
  if (esMismoDiaEnColombia(fecha, new Date(ahora).getTime() - 24 * 3_600_000)) {
    return { grupo: 'Ayer', cuando: formatearHora(fecha) }
  }
  const aviso = enColombia(fecha)
  const hoy = enColombia(ahora)
  const diaDelAviso = new Date(Date.UTC(aviso.anio, aviso.mes - 1, aviso.dia))
  const diaDeHoy = new Date(Date.UTC(hoy.anio, hoy.mes - 1, hoy.dia))
  const diasAtras = (diaDeHoy.getTime() - diaDelAviso.getTime()) / 86_400_000
  // De lunes (1) a domingo (7): los días que van corridos de la semana.
  if (diasAtras < (diaDeHoy.getUTCDay() || 7)) {
    return {
      grupo: 'Esta semana',
      cuando: `${DIAS[diaDelAviso.getUTCDay()]} ${aviso.dia} ${MESES[aviso.mes - 1]}`,
    }
  }
  return { grupo: 'Anteriores', cuando: formatearDia(fecha, ahora) }
}

/**
 * Cuándo se descargó lo que se ve sin conexión, como lo escriben 04-B y 11-B: «hoy 7:42 a. m.»
 * o, si fue otro día, «el 24 sep 2026, 7:42 a. m.».
 *
 * @param {Date | string | number} fecha
 * @param {Date | string | number} [ahora]
 */
export function formatearDescarga(fecha, ahora = Date.now()) {
  return esMismoDiaEnColombia(fecha, ahora)
    ? `hoy ${formatearHora(fecha)}`
    : `el ${formatearFechaHora(fecha)}`
}

/**
 * El día de hoy en Colombia, como `AAAA-MM-DD`: el formato de un campo de fecha y de
 * `fecha_ejecucion`. No es el día del dispositivo ni el de UTC: a las 11 p. m. en Colombia ya es
 * mañana en UTC.
 *
 * @param {Date | string | number} [ahora]
 */
export function hoyEnColombia(ahora = Date.now()) {
  const { anio, mes, dia } = enColombia(ahora)
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/**
 * El comienzo del mes en curso en Colombia, como instante (`2026-10-01T00:00:00-05:00`), para
 * filtrar «este mes» en el servidor. Colombia no cambia de hora: siempre es UTC−5.
 *
 * @param {Date | string | number} [ahora]
 */
export function inicioDelMesEnColombia(ahora = Date.now()) {
  return `${hoyEnColombia(ahora).slice(0, 7)}-01T00:00:00-05:00`
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

/**
 * Duración entre dos momentos, con sus dos unidades mayores y sin redondear hacia arriba:
 * «35 min», «5 h 20 min», «1 d 3 h». Es lo que lleva abierta una novedad (bandeja del
 * escritorio) o lo que tardó en resolverse (detalle).
 *
 * @param {Date | string | number} desde
 * @param {Date | string | number} [hasta] Por defecto, ahora.
 */
export function formatearDuracion(desde, hasta = Date.now()) {
  const minutos = Math.floor((new Date(hasta).getTime() - new Date(desde).getTime()) / 60_000)
  if (minutos < 1) return 'menos de 1 min'
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return minutos % 60 === 0 ? `${horas} h` : `${horas} h ${minutos % 60} min`
  const dias = Math.floor(horas / 24)
  return horas % 24 === 0 ? `${dias} d` : `${dias} d ${horas % 24} h`
}
