// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { codigoLocal, formatearCodigo } from './codigo.js'

describe('Código visible de la novedad (RF-06)', () => {
  it.each([
    [1, 'NOV-0001'],
    [153, 'NOV-0153'],
    [9999, 'NOV-9999'],
    [12345, 'NOV-12345'],
    ['42', 'NOV-0042'],
  ])('%s → %s', (codigo, esperado) => {
    expect(formatearCodigo(codigo)).toBe(esperado)
  })
})

describe('Identificador local de una pendiente (RF-21, Figma 07 y 08)', () => {
  it('RF-21: LOC- y los cuatro primeros caracteres del identificador local, en mayúsculas', () => {
    expect(codigoLocal('7f3a2c10-0000-4000-8000-000000000001')).toBe('LOC-7F3A')
  })
})
