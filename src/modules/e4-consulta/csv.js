import { formatearCodigo } from '../../core/utils/codigo.js'
import { NOMBRE_DE_ESTADO, NOMBRE_DE_PRIORIDAD } from '../../core/utils/estados.js'
import { formatearParaHojaDeCalculo, hoyEnColombia } from '../../core/utils/fechas.js'

/*
 * El archivo CSV del historial (RF-20 / CU-20; SDD 5.3.8; plan del Sprint 5, decisiones 16 a
 * 18). Puro: recibe las novedades y devuelve el texto del archivo.
 *
 * Punto y coma con BOM: Excel con la configuración regional de Colombia lo abre directo, con las
 * tildes y las columnas separadas (cambio 32).
 */

const SEPARADOR = ';'
const FIN_DE_LINEA = '\r\n'

/** Las columnas de SDD 5.3.8, en su orden (decisión 17). */
const ENCABEZADO = [
  'Código',
  'Registrada en finca',
  'Finca',
  'Razón social',
  'Área',
  'Prioridad',
  'Estado',
  'Tipo de falla',
  'Fecha de ejecución',
  'Reportada por',
  'Horas hasta la resolución',
]

/** Lo que una hoja de cálculo leería como fórmula (OWASP, «CSV Injection»). */
const PARECE_FORMULA = /^[=+\-@\t\r]/

/**
 * Un texto que escribió una persona (nombres de fincas, de personas, de tipos de falla): si
 * empieza como una fórmula, sale con un apóstrofo adelante (decisión 18).
 *
 * @param {string | null | undefined} texto
 */
const deUnaPersona = (texto) => (texto && PARECE_FORMULA.test(texto) ? `'${texto}` : (texto ?? ''))

/**
 * El campo con comillas si trae el separador, comillas o un salto de línea.
 *
 * @param {string} campo
 */
const conComillas = (campo) => (/[;"\r\n]/.test(campo) ? `"${campo.replaceAll('"', '""')}"` : campo)

/**
 * «52,3»: las horas desde el registro hasta la última resolución, con un decimal y coma; vacío
 * si no se ha resuelto.
 *
 * @param {{ fecha_registro: string, resuelta_en: string | null }} novedad
 */
const horasHastaResolver = ({ fecha_registro, resuelta_en }) =>
  resuelta_en
    ? ((Date.parse(resuelta_en) - Date.parse(fecha_registro)) / 3_600_000)
        .toFixed(1)
        .replace('.', ',')
    : ''

/**
 * @param {object[]} novedades Filas de `v_novedad`, en el orden del historial.
 * @returns {string} El archivo completo, con BOM.
 */
export function armarCsv(novedades) {
  const filas = novedades.map((novedad) => [
    formatearCodigo(novedad.codigo),
    formatearParaHojaDeCalculo(novedad.fecha_registro),
    deUnaPersona(novedad.finca),
    deUnaPersona(novedad.razon_social),
    deUnaPersona(novedad.area),
    NOMBRE_DE_PRIORIDAD[novedad.prioridad],
    NOMBRE_DE_ESTADO[novedad.estado],
    deUnaPersona(novedad.tipo_falla),
    novedad.fecha_ejecucion ?? '',
    deUnaPersona(novedad.reportante),
    horasHastaResolver(novedad),
  ])
  return `﻿${[ENCABEZADO, ...filas]
    .map((fila) => fila.map(conComillas).join(SEPARADOR) + FIN_DE_LINEA)
    .join('')}`
}

/**
 * `historial-novedades-2026-10-17.csv`, con el día de Colombia.
 *
 * @param {Date | string | number} [ahora]
 */
export const nombreDelArchivo = (ahora = Date.now()) =>
  `historial-novedades-${hoyEnColombia(ahora)}.csv`
