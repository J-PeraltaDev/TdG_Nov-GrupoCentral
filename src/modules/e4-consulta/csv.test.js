// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { armarCsv, nombreDelArchivo } from './csv.js'

const ENCABEZADO =
  'Código;Registrada en finca;Finca;Razón social;Área;Prioridad;Estado;Tipo de falla;' +
  'Fecha de ejecución;Reportada por;Horas hasta la resolución'

const novedad = (cambios = {}) => ({
  codigo: 149,
  // 8:15 a. m. del 24 de septiembre en Colombia.
  fecha_registro: '2026-09-24T13:15:00+00:00',
  finca: 'La Mónica',
  razon_social: 'Agropecuaria La Mónica S.A.S.',
  area: 'Sistemas',
  prioridad: 'alto',
  estado: 'resuelta',
  tipo_falla: 'Biométrico',
  fecha_ejecucion: '2026-09-25',
  reportante: 'Marisol Rentería',
  // 52 h 18 min después.
  resuelta_en: '2026-09-26T17:33:00+00:00',
  ...cambios,
})

/** Las filas del archivo, sin el BOM ni el último salto de línea. */
const filas = (csv) => csv.slice(1).split('\r\n').slice(0, -1)

describe('CSV del historial (RF-20 / CU-20; decisiones 16 a 18)', () => {
  it('RF-20 / CU-20 2: UTF-8 con BOM, punto y coma, el encabezado de SDD 5.3.8 y una fila por novedad', () => {
    const csv = armarCsv([novedad()])

    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.endsWith('\r\n')).toBe(true)
    expect(filas(csv)).toEqual([
      ENCABEZADO,
      'NOV-0149;2026-09-24 08:15;La Mónica;Agropecuaria La Mónica S.A.S.;Sistemas;Alto;Resuelta;' +
        'Biométrico;2026-09-25;Marisol Rentería;52,3',
    ])
  })

  it('RF-20: una novedad sin resolver deja vacíos el tipo, la fecha de ejecución y las horas', () => {
    const [, fila] = filas(
      armarCsv([
        novedad({
          codigo: 12345,
          estado: 'en_atencion',
          prioridad: 'critico',
          tipo_falla: null,
          fecha_ejecucion: null,
          resuelta_en: null,
        }),
      ]),
    )

    expect(fila).toBe(
      'NOV-12345;2026-09-24 08:15;La Mónica;Agropecuaria La Mónica S.A.S.;Sistemas;Crítico;' +
        'En atención;;;Marisol Rentería;',
    )
  })

  it('RF-20: un campo con punto y coma, comillas o un salto de línea va entre comillas', () => {
    const [, fila] = filas(
      armarCsv([novedad({ finca: 'Finca "La 5"; sur', tipo_falla: 'Bomba\nde riego' })]),
    )

    expect(fila).toContain(';"Finca ""La 5""; sur";')
    expect(fila).toContain('"Bomba\nde riego"')
  })

  it.each([
    ['=HIPERVINCULO("x")', `"'=HIPERVINCULO(""x"")"`],
    ['+57 300', "'+57 300"],
    ['-Bombas', "'-Bombas"],
    ['@SUMA(A1)', "'@SUMA(A1)"],
    ['\tCámaras', "'\tCámaras"],
    ['\rCámaras', `"'\rCámaras"`],
  ])('decisión 18: «%s» no se ejecuta como fórmula', (texto, enElArchivo) => {
    const [, fila] = filas(armarCsv([novedad({ reportante: texto, tipo_falla: texto })]))

    expect(fila).toContain(`;${enElArchivo};2026-09-25;${enElArchivo};52,3`)
  })

  it('decisión 18: las horas que calcula la aplicación no se tocan, aunque sean negativas', () => {
    // Un registro sin conexión con el reloj del teléfono adelantado.
    const [, fila] = filas(armarCsv([novedad({ resuelta_en: '2026-09-24T11:45:00+00:00' })]))

    expect(fila.endsWith(';-1,5')).toBe(true)
  })

  it('RF-20: sin novedades, solo el encabezado', () => {
    expect(filas(armarCsv([]))).toEqual([ENCABEZADO])
  })

  it('RF-20: el nombre lleva el día de Colombia', () => {
    // 11 p. m. del 17 de octubre en Colombia; en UTC ya es 18.
    expect(nombreDelArchivo(new Date('2026-10-18T04:00:00Z'))).toBe(
      'historial-novedades-2026-10-17.csv',
    )
  })
})
