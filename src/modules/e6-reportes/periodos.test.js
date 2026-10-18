// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { escribirPeriodo, leerPeriodo, mesesDelPeriodo, PERIODOS } from './periodos.js'

// 24 sep 2026, 9:30 a. m. en Colombia.
const AHORA = '2026-09-24T14:30:00Z'
const leer = (texto, porOmision = '3m', ahora = AHORA) =>
  leerPeriodo(new URLSearchParams(texto), porOmision, ahora)

describe('Períodos del panel (RF-27 a RF-29; plan del Sprint 5, decisión 23)', () => {
  it('RF-27: las opciones de Figma, en su orden', () => {
    expect(PERIODOS.map((periodo) => periodo.nombre)).toEqual([
      'Mes actual',
      'Últimos 3 meses',
      'Últimos 6 meses',
      'Últimos 12 meses',
    ])
  })

  it('RF-27: «Últimos 3 meses» el 24 sep son del 1 jul al 24 sep', () => {
    expect(leer('periodo=3m')).toEqual({
      clave: '3m',
      desde: '2026-07-01',
      hasta: '2026-09-24',
      etiqueta: 'Últimos 3 meses (jul–sep 2026)',
      corta: 'Últimos 3 meses',
    })
  })

  it('RF-27: «Mes actual» es desde el día 1', () => {
    expect(leer('periodo=mes')).toMatchObject({
      desde: '2026-09-01',
      hasta: '2026-09-24',
      etiqueta: 'Mes actual (sep 2026)',
      corta: 'Mes actual',
    })
  })

  it('RF-27: con cambio de año, el año en los dos extremos', () => {
    expect(leer('periodo=6m', '3m', '2026-02-10T15:00:00Z')).toMatchObject({
      desde: '2025-09-01',
      hasta: '2026-02-10',
      etiqueta: 'Últimos 6 meses (sep 2025–feb 2026)',
    })
    expect(leer('periodo=12m')).toMatchObject({
      desde: '2025-10-01',
      etiqueta: 'Últimos 12 meses (oct 2025–sep 2026)',
    })
  })

  it('RF-27: el día es el de Colombia, no el de UTC', () => {
    // 1 oct 2026 a las 3 a. m. UTC todavía es 30 sep en Colombia.
    expect(leer('periodo=mes', '3m', '2026-10-01T03:00:00Z')).toMatchObject({
      desde: '2026-09-01',
      hasta: '2026-09-30',
    })
  })

  it('RF-27: personalizado, con las dos fechas en la dirección', () => {
    expect(leer('desde=2026-04-01&hasta=2026-09-24')).toEqual({
      clave: 'personalizado',
      desde: '2026-04-01',
      hasta: '2026-09-24',
      etiqueta: '01 abr 2026 – 24 sep 2026',
      corta: '01 abr 2026 – 24 sep 2026',
    })
  })

  it('RF-27: sin período, el de la pestaña; uno desconocido, invertido o a medias se ignora', () => {
    expect(leer('').clave).toBe('3m')
    expect(leer('', '6m').clave).toBe('6m')
    expect(leer('periodo=7m').clave).toBe('3m')
    expect(leer('desde=2026-09-30&hasta=2026-09-01').clave).toBe('3m')
    expect(leer('desde=2026-09-30').clave).toBe('3m')
    expect(leer('desde=2026-02-30&hasta=2026-03-01').clave).toBe('3m')
  })

  it('RF-27: el período va a la dirección sin tocar los demás parámetros', () => {
    const base = new URLSearchParams('indicador=tiempos&periodo=3m')
    expect(escribirPeriodo(base, { clave: '6m' }).toString()).toBe('indicador=tiempos&periodo=6m')
    expect(
      escribirPeriodo(base, {
        clave: 'personalizado',
        desde: '2026-04-01',
        hasta: '2026-09-24',
      }).toString(),
    ).toBe('indicador=tiempos&desde=2026-04-01&hasta=2026-09-24')
    expect(base.toString()).toBe('indicador=tiempos&periodo=3m')
  })

  it('RF-27: los meses del período, para el eje del gráfico', () => {
    expect(mesesDelPeriodo({ desde: '2026-07-01', hasta: '2026-09-24' })).toEqual([
      '2026-07-01',
      '2026-08-01',
      '2026-09-01',
    ])
    expect(mesesDelPeriodo({ desde: '2025-12-15', hasta: '2026-01-02' })).toEqual([
      '2025-12-01',
      '2026-01-01',
    ])
    expect(mesesDelPeriodo({ desde: '2026-09-01', hasta: '2026-09-24' })).toEqual(['2026-09-01'])
  })
})
