import { describe, expect, it } from 'vitest'
import { cuantasNovedades, sinTildes } from './texto.js'

describe('Comparación de textos', () => {
  it('RF-04 / CU-04 6a: no distingue mayúsculas, tildes ni espacios en los extremos', () => {
    expect(sinTildes('  El Jardín ')).toBe('el jardin')
    expect(sinTildes('MARACANÁ')).toBe(sinTildes('maracana'))
    expect(sinTildes('Pingüino')).toBe('pinguino')
  })

  it('conserva la ñ: «año» no es «ano»', () => {
    expect(sinTildes('Año')).toBe('año')
    expect(sinTildes('Peñón')).toBe('peñon')
  })

  it('sin texto devuelve una cadena vacía', () => {
    expect(sinTildes(null)).toBe('')
    expect(sinTildes(undefined)).toBe('')
    expect(sinTildes('   ')).toBe('')
  })
})

describe('Cuántas novedades', () => {
  it.each([
    [1, '1 novedad'],
    [0, '0 novedades'],
    [9, '9 novedades'],
    [1082, '1.082 novedades'],
  ])('RF-19 / RF-29: %s → «%s»', (cantidad, texto) => {
    expect(cuantasNovedades(cantidad)).toBe(texto)
  })
})
