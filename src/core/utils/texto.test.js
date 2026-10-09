import { describe, expect, it } from 'vitest'
import { sinTildes } from './texto.js'

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
