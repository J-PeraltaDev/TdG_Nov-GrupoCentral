// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { formatearDias, formatearPorcentaje, nombreDelMes } from './cifras.js'

describe('Cifras del panel (plan del Sprint 5, decisión 5)', () => {
  it.each([
    [103.2, '4,3 días'],
    [38.4, '1,6 días'],
    [24, '1,0 días'],
    [2.4, '0,1 días'],
    [0, '0,0 días'],
  ])('RF-27: %s horas son «%s»', (horas, texto) => {
    expect(formatearDias(horas)).toBe(texto)
  })

  it('RF-27: el mes del eje con su nombre completo, como Figma 24', () => {
    expect(nombreDelMes('2026-07-01')).toBe('Julio')
    expect(nombreDelMes('2026-09-01')).toBe('Septiembre')
  })

  it('RF-27: en corto para el teléfono y con el año si el período cruza de año', () => {
    expect(nombreDelMes('2026-09-01', { corto: true })).toBe('Sep')
    expect(nombreDelMes('2025-12-01', { conAnio: true })).toBe('Diciembre 2025')
    expect(nombreDelMes('2026-01-01', { corto: true, conAnio: true })).toBe('Ene 2026')
  })

  it.each([
    [7, 38, '18,4\u00a0%'],
    [5, 19, '26,3\u00a0%'],
    [0, 19, '0,0\u00a0%'],
    [3, 3, '100,0\u00a0%'],
  ])('RF-28: %s de %s son «%s», con un espacio que no se parte', (parte, total, texto) => {
    expect(formatearPorcentaje(parte, total)).toBe(texto)
  })
})
