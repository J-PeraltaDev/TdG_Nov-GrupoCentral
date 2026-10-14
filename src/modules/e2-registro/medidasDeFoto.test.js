// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { FOTO_PESO_MAXIMO_BYTES } from '../../core/config/parametros.js'
import { cabeEnElLimite, esImagen, formatearPeso, medidasDeDestino } from './medidasDeFoto.js'

describe('Reducción de una foto (RF-08 / CU-08 4; decisión 22 del plan)', () => {
  it('RF-08 / CU-08 4: el lado mayor queda en 1600 px, con la misma proporción', () => {
    expect(medidasDeDestino(4000, 3000)).toEqual({ ancho: 1600, alto: 1200 })
    expect(medidasDeDestino(3024, 4032)).toEqual({ ancho: 1200, alto: 1600 })
    expect(medidasDeDestino(2000, 2000)).toEqual({ ancho: 1600, alto: 1600 })
  })

  it('una foto pequeña no se agranda', () => {
    expect(medidasDeDestino(800, 600)).toEqual({ ancho: 800, alto: 600 })
  })

  it('CU-08 4a: solo pasan las imágenes; un PDF, un texto o nada, no', () => {
    expect(esImagen({ type: 'image/jpeg' })).toBe(true)
    expect(esImagen({ type: 'image/heic' })).toBe(true)
    expect(esImagen({ type: 'application/pdf' })).toBe(false)
    expect(esImagen({ type: 'text/plain' })).toBe(false)
    expect(esImagen({ type: '' })).toBe(false)
    expect(esImagen(null)).toBe(false)
  })

  it('CU-08 4a: el límite del bucket es exacto: 1 MB cabe, un byte más no', () => {
    expect(cabeEnElLimite(FOTO_PESO_MAXIMO_BYTES)).toBe(true)
    expect(cabeEnElLimite(FOTO_PESO_MAXIMO_BYTES + 1)).toBe(false)
    expect(cabeEnElLimite(0)).toBe(false)
  })

  it('el peso se escribe como en Figma: «Reducida a 180 KB»', () => {
    expect(formatearPeso(184_320)).toBe('180 KB')
    expect(formatearPeso(300)).toBe('1 KB')
  })
})
