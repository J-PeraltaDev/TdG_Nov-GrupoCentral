import { MESES } from '../../core/utils/fechas.js'

/*
 * Cifras del panel (plan del Sprint 5, decisión 5): promedios en días con un decimal y coma
 * («4,3 días»). Las duraciones («1 d 23 h») salen de `formatearDuracion`.
 */

const DIAS = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * «4,3 días» a partir de horas.
 *
 * @param {number} horas
 */
export const formatearDias = (horas) => `${DIAS.format(horas / 24)} días`

const NOMBRES_DE_LOS_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/**
 * «Julio» a partir de `2026-07-01`: el eje del gráfico mensual (Figma 24). Corto, «Jul»; con
 * el año, «Julio 2025».
 *
 * @param {string} mes `AAAA-MM-DD`.
 * @param {{ corto?: boolean, conAnio?: boolean }} [opciones]
 */
export function nombreDelMes(mes, { corto = false, conAnio = false } = {}) {
  const numero = Number(mes.slice(5, 7)) - 1
  const nombre = corto
    ? MESES[numero][0].toUpperCase() + MESES[numero].slice(1)
    : NOMBRES_DE_LOS_MESES[numero]
  return conAnio ? `${nombre} ${mes.slice(0, 4)}` : nombre
}

/**
 * «18,4 %»: una parte de un total, con un decimal y el espacio de Figma, que no se parte.
 *
 * @param {number} parte
 * @param {number} total Mayor que cero.
 */
export const formatearPorcentaje = (parte, total) => `${DIAS.format((parte / total) * 100)}\u00a0%`
