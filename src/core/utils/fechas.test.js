// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  formatearFechaConSemana,
  formatearFechaHora,
  semanaDelAnio,
  tiempoTranscurrido,
} from './fechas.js'

describe('Fechas de la interfaz (SDD 6.1.11)', () => {
  it('RF-06: usa el formato de Figma, en la hora de Colombia', () => {
    // 12:40 UTC son las 7:40 a. m. en Colombia (UTC−5).
    expect(formatearFechaHora('2026-09-24T12:40:00Z')).toBe('24 sep 2026, 7:40 a. m.')
  })

  it('RF-06: agrega la semana del año', () => {
    expect(formatearFechaConSemana('2026-09-24T12:40:00Z')).toBe('24 sep 2026, 7:40 a. m. · Sem 39')
  })

  it.each([
    ['2026-01-05T17:00:00Z', '5 ene 2026, 12:00 p. m.'],
    ['2026-03-15T05:05:00Z', '15 mar 2026, 12:05 a. m.'],
    ['2026-12-31T23:59:00Z', '31 dic 2026, 6:59 p. m.'],
    ['2026-07-20T18:30:00Z', '20 jul 2026, 1:30 p. m.'],
  ])('%s → «%s»', (fecha, esperado) => {
    expect(formatearFechaHora(fecha)).toBe(esperado)
  })

  it('RNF-09: el día es el de Colombia aunque en UTC ya sea el siguiente', () => {
    // 03:00 UTC del 25 son las 10:00 p. m. del 24 en Colombia.
    expect(formatearFechaHora('2026-09-25T03:00:00Z')).toBe('24 sep 2026, 10:00 p. m.')
  })

  it.each([
    ['2026-09-24T12:40:00Z', 39],
    ['2026-12-31T15:00:00Z', 53],
    ['2027-01-01T15:00:00Z', 53],
    ['2027-01-04T15:00:00Z', 1],
    ['2026-01-01T15:00:00Z', 1],
    ['2025-12-29T15:00:00Z', 1],
  ])('semana ISO de %s → %i', (fecha, semana) => {
    expect(semanaDelAnio(fecha)).toBe(semana)
  })

  it('la semana se calcula con la fecha de Colombia', () => {
    // Lunes 5 de enero a las 02:00 UTC todavía es domingo 4 en Colombia: semana 1, no 2.
    expect(semanaDelAnio('2026-01-05T02:00:00Z')).toBe(1)
    expect(semanaDelAnio('2026-01-05T06:00:00Z')).toBe(2)
  })

  it.each([
    [30 * 1000, 'ahora'],
    [5 * 60 * 1000, 'hace 5 min'],
    [59 * 60 * 1000, 'hace 59 min'],
    [3 * 60 * 60 * 1000, 'hace 3 h'],
    [23 * 60 * 60 * 1000, 'hace 23 h'],
    [2 * 24 * 60 * 60 * 1000, 'hace 2 d'],
  ])('RF-18: tiempo transcurrido de %i ms → «%s»', (milisegundos, esperado) => {
    const ahora = new Date('2026-10-13T15:00:00Z')
    expect(tiempoTranscurrido(new Date(ahora.getTime() - milisegundos), ahora)).toBe(esperado)
  })
})
