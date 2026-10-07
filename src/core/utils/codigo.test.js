// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { formatearCodigo } from './codigo.js'

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
