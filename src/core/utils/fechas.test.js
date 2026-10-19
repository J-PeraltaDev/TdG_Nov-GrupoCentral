// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import {
  cuandoLlegoElAviso,
  esMismoDiaEnColombia,
  formatearDescarga,
  formatearDia,
  formatearDuracion,
  formatearFechaConSemana,
  formatearFechaCorta,
  formatearFechaDeLista,
  formatearFechaHora,
  formatearFechaSinHora,
  formatearFechaYSemana,
  formatearHora,
  formatearUltimoIngreso,
  formatearParaHojaDeCalculo,
  hoyEnColombia,
  inicioDelMesEnColombia,
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

  it.each([
    ['2026-09-21T11:48:00Z', '21 sep, 6:48 a. m.'],
    ['2026-09-22T15:20:00Z', '22 sep, 10:20 a. m.'],
    ['2026-09-24T21:45:00Z', '24 sep, 4:45 p. m.'],
    // 03:00 UTC del 25 son las 10:00 p. m. del 24 en Colombia.
    ['2026-09-25T03:00:00Z', '24 sep, 10:00 p. m.'],
  ])('RF-09: fecha corta, sin año, de %s → «%s»', (fecha, esperado) => {
    expect(formatearFechaCorta(fecha)).toBe(esperado)
  })

  it.each([
    [20 * 1000, 'menos de 1 min'],
    [35 * 60 * 1000, '35 min'],
    [59 * 60 * 1000 + 59 * 1000, '59 min'],
    [5 * 60 * 60 * 1000, '5 h'],
    [(5 * 60 + 20) * 60 * 1000, '5 h 20 min'],
    [24 * 60 * 60 * 1000, '1 d'],
    [(27 * 60 + 40) * 60 * 1000, '1 d 3 h'],
    [(45 * 60 + 59) * 60 * 1000, '1 d 21 h'],
    [(58 * 60 + 5) * 60 * 1000, '2 d 10 h'],
  ])('RF-09: duración de %i ms → «%s» (dos unidades, sin redondear)', (milisegundos, esperado) => {
    const hasta = new Date('2026-09-24T12:45:00Z')
    expect(formatearDuracion(new Date(hasta.getTime() - milisegundos), hasta)).toBe(esperado)
  })

  it('RF-09: sin segundo momento, la duración se mide hasta ahora', () => {
    vi.useFakeTimers({ now: new Date('2026-09-24T12:45:00Z') })
    try {
      expect(formatearDuracion('2026-09-24T12:10:00Z')).toBe('35 min')
    } finally {
      vi.useRealTimers()
    }
  })

  it('RF-09: una fecha posterior a ahora no da una duración negativa', () => {
    expect(formatearDuracion('2026-09-24T13:00:00Z', '2026-09-24T12:45:00Z')).toBe('menos de 1 min')
  })

  it('RF-18: el detalle escribe la semana entre paréntesis, como la pantalla 22', () => {
    expect(formatearFechaYSemana('2026-09-21T11:48:00Z')).toBe('21 sep 2026, 6:48 a. m. (Sem 39)')
  })

  it.each([
    ['2026-09-23', '23 sep 2026'],
    ['2026-01-01', '1 ene 2026'],
    ['2026-12-31', '31 dic 2026'],
  ])('RF-14: una fecha sin hora (%s) se escribe «%s», sin correrse de día', (fecha, esperado) => {
    // Si pasara por `new Date()`, la medianoche UTC sería el día anterior en Colombia.
    expect(formatearFechaSinHora(fecha)).toBe(esperado)
  })

  it.each([
    ['2026-09-24T12:15:00Z', '7:15 a. m.'],
    ['2026-09-24T17:00:00Z', '12:00 p. m.'],
    ['2026-09-25T04:30:00Z', '11:30 p. m.'],
  ])('RF-18: la hora sola de %s → «%s»', (fecha, esperado) => {
    expect(formatearHora(fecha)).toBe(esperado)
  })

  it('RF-18: dos momentos son del mismo día según la fecha de Colombia, no la de UTC', () => {
    // 11:30 p. m. del 24 en Colombia ya es el 25 en UTC.
    expect(esMismoDiaEnColombia('2026-09-25T04:30:00Z', '2026-09-24T13:00:00Z')).toBe(true)
    expect(esMismoDiaEnColombia('2026-09-25T05:30:00Z', '2026-09-24T13:00:00Z')).toBe(false)
    expect(esMismoDiaEnColombia('2026-09-24T13:00:00Z', '2025-09-24T13:00:00Z')).toBe(false)
  })

  it('RF-14: «hoy» es el día de Colombia, también cuando en UTC ya es mañana', () => {
    // 11:00 p. m. del 24 de septiembre en Colombia son las 4:00 a. m. del 25 en UTC.
    expect(hoyEnColombia('2026-09-25T04:00:00Z')).toBe('2026-09-24')
    // La medianoche de Colombia son las 5:00 a. m. en UTC.
    expect(hoyEnColombia('2026-09-25T04:59:59Z')).toBe('2026-09-24')
    expect(hoyEnColombia('2026-09-25T05:00:00Z')).toBe('2026-09-25')
  })

  it('RF-14: «hoy» va como AAAA-MM-DD, con ceros, que es lo que espera un campo de fecha', () => {
    expect(hoyEnColombia('2026-01-05T15:00:00Z')).toBe('2026-01-05')
    // El último día del año en Colombia, cuando en UTC ya empezó el siguiente.
    expect(hoyEnColombia('2027-01-01T03:00:00Z')).toBe('2026-12-31')
  })

  it('RF-13: el mes empieza a la medianoche del día 1 en Colombia, no en UTC', () => {
    expect(inicioDelMesEnColombia('2026-10-09T15:00:00Z')).toBe('2026-10-01T00:00:00-05:00')
    // 10:00 p. m. del 30 de septiembre en Colombia: en UTC ya es octubre.
    expect(inicioDelMesEnColombia('2026-10-01T03:00:00Z')).toBe('2026-09-01T00:00:00-05:00')
    // El instante exacto en que empieza el mes.
    expect(new Date(inicioDelMesEnColombia('2026-10-09T15:00:00Z')).toISOString()).toBe(
      '2026-10-01T05:00:00.000Z',
    )
  })

  it('RF-03: el último ingreso se escribe como en Figma (pantalla 28)', () => {
    // 8:05 a. m. del 24 de septiembre de 2026 en Colombia.
    const ahora = '2026-09-24T13:05:00Z'

    expect(formatearUltimoIngreso('2026-09-24T12:18:00Z', ahora)).toBe('hoy 7:18 a. m.')
    expect(formatearUltimoIngreso('2026-09-23T20:00:00Z', ahora)).toBe('ayer')
    expect(formatearUltimoIngreso('2026-09-22T15:00:00Z', ahora)).toBe('22 sep')
    expect(formatearUltimoIngreso('2026-08-12T15:00:00Z', ahora)).toBe('12 ago')
    expect(formatearUltimoIngreso('2025-08-12T15:00:00Z', ahora)).toBe('12 ago 2025')
  })

  it('RF-24: cuándo se descargó lo que se ve sin conexión, como en 04-B y 11-B', () => {
    const ahora = '2026-09-24T13:05:00Z'

    expect(formatearDescarga('2026-09-24T12:42:00Z', ahora)).toBe('hoy 7:42 a. m.')
    expect(formatearDescarga('2026-09-23T12:42:00Z', ahora)).toBe('el 23 sep 2026, 7:42 a. m.')
  })

  it('RF-03: «hoy» y «ayer» son los días de Colombia, no los de UTC', () => {
    // 11:30 p. m. del 23 en Colombia: en UTC ya es 24, pero para quien mira a las 8:05 a. m.
    // del 24 fue ayer.
    expect(formatearUltimoIngreso('2026-09-24T04:30:00Z', '2026-09-24T13:05:00Z')).toBe('ayer')
    // 12:10 a. m. del 24 en Colombia, visto a las 11:50 p. m. del mismo día.
    expect(formatearUltimoIngreso('2026-09-24T05:10:00Z', '2026-09-25T04:50:00Z')).toBe(
      'hoy 12:10 a. m.',
    )
  })

  it('RF-03: quien nunca ha ingresado lo dice', () => {
    expect(formatearUltimoIngreso(null)).toBe('Nunca')
    expect(formatearUltimoIngreso(undefined)).toBe('Nunca')
  })

  it('RF-14: sin argumento, «hoy» es el momento actual', () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-25T04:10:00Z') })
    try {
      expect(hoyEnColombia()).toBe('2026-09-24')
    } finally {
      vi.useRealTimers()
    }
  })
  it('RF-30 / Figma 10: agrupa los avisos en hoy, ayer, esta semana y anteriores, en la hora de Colombia', () => {
    // Jueves 24 sep 2026, 9:30 a. m. en Colombia.
    const ahora = '2026-09-24T14:30:00Z'
    expect(cuandoLlegoElAviso('2026-09-24T12:40:00Z', ahora)).toEqual({
      grupo: 'Hoy',
      cuando: '7:40 a. m.',
    })
    // 11:30 p. m. del 23 en Colombia es el 24 en UTC: va en «Ayer».
    expect(cuandoLlegoElAviso('2026-09-24T04:30:00Z', ahora)).toEqual({
      grupo: 'Ayer',
      cuando: '11:30 p. m.',
    })
    expect(cuandoLlegoElAviso('2026-09-22T15:00:00Z', ahora)).toEqual({
      grupo: 'Esta semana',
      cuando: 'mar 22 sep',
    })
    expect(cuandoLlegoElAviso('2026-09-21T05:00:00Z', ahora)).toEqual({
      grupo: 'Esta semana',
      cuando: 'lun 21 sep',
    })
    // El domingo anterior ya es otra semana.
    expect(cuandoLlegoElAviso('2026-09-20T15:00:00Z', ahora)).toEqual({
      grupo: 'Anteriores',
      cuando: '20 sep',
    })
    expect(cuandoLlegoElAviso('2025-12-30T15:00:00Z', ahora)).toEqual({
      grupo: 'Anteriores',
      cuando: '30 dic 2025',
    })
  })

  it('RF-30: un lunes, el domingo es «Ayer» y lo anterior ya es otra semana', () => {
    const lunes = '2026-09-28T14:00:00Z'
    expect(cuandoLlegoElAviso('2026-09-27T15:00:00Z', lunes).grupo).toBe('Ayer')
    expect(cuandoLlegoElAviso('2026-09-26T15:00:00Z', lunes)).toEqual({
      grupo: 'Anteriores',
      cuando: '26 sep',
    })
    // Un domingo, toda la semana desde el lunes.
    expect(cuandoLlegoElAviso('2026-09-21T15:00:00Z', '2026-09-27T14:00:00Z').grupo).toBe(
      'Esta semana',
    )
  })
})

describe('Fechas del historial (RF-19; plan del Sprint 5, decisión 12)', () => {
  const ahora = '2026-09-24T14:30:00Z'

  it('RF-19: «Registrada en finca» sin el año si es el actual, y con él si no', () => {
    expect(formatearFechaDeLista('2026-09-24T13:15:00Z', ahora)).toBe('24 sep, 8:15 a. m.')
    expect(formatearFechaDeLista('2025-12-30T13:15:00Z', ahora)).toBe('30 dic 2025, 8:15 a. m.')
    // El 1 de enero a las 3 a. m. UTC todavía es 31 de diciembre en Colombia.
    expect(formatearFechaDeLista('2026-01-01T03:00:00Z', ahora)).toBe('31 dic 2025, 10:00 p. m.')
  })

  it('RF-19: el día de las tarjetas de 21-D, con el año solo si es otro', () => {
    expect(formatearDia('2026-09-24T13:15:00Z', ahora)).toBe('24 sep')
    expect(formatearDia('2025-08-12T15:00:00Z', ahora)).toBe('12 ago 2025')
  })

  it('RF-20: la fecha del CSV, en la hora de Colombia y con 24 horas', () => {
    expect(formatearParaHojaDeCalculo('2026-09-24T13:15:00Z')).toBe('2026-09-24 08:15')
    // 11:05 p. m. del 24 en Colombia; en UTC ya es el 25.
    expect(formatearParaHojaDeCalculo('2026-09-25T04:05:00Z')).toBe('2026-09-24 23:05')
    expect(formatearParaHojaDeCalculo('2026-09-24T05:00:00Z')).toBe('2026-09-24 00:00')
  })
})
