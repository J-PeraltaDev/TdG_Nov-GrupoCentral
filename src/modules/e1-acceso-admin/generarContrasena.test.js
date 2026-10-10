import { afterEach, describe, expect, it, vi } from 'vitest'
import { esContrasenaValida } from '../../core/utils/contrasena.js'
import { generarContrasena } from './generarContrasena.js'

afterEach(() => {
  vi.restoreAllMocks()
})

/** Hace que `crypto.getRandomValues` entregue estos valores, en orden. */
function conAzar(...valores) {
  const pendientes = [...valores]
  return vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((arreglo) => {
    arreglo[0] = pendientes.shift()
    return arreglo
  })
}

describe('Contraseña inicial de un usuario nuevo (RF-03 / CU-03 4, pantalla 29)', () => {
  it('es una palabra y cuatro cifras, como el ejemplo de Figma («Banano-4821»)', () => {
    for (let intento = 0; intento < 50; intento += 1) {
      expect(generarContrasena()).toMatch(/^[A-Z][a-z]{2,}-\d{4}$/)
    }
  })

  it('cumple la regla de las contraseñas: mínimo 8 caracteres, una letra y un número', () => {
    for (let intento = 0; intento < 50; intento += 1) {
      expect(esContrasenaValida(generarContrasena())).toBe(true)
    }
  })

  it('sale del generador criptográfico del navegador, no de Math.random', () => {
    const azar = vi.spyOn(globalThis.crypto, 'getRandomValues')
    const debil = vi.spyOn(Math, 'random')

    generarContrasena()

    expect(azar).toHaveBeenCalled()
    expect(debil).not.toHaveBeenCalled()
  })

  it('con el mismo azar da la misma contraseña, y las cifras conservan sus ceros', () => {
    conAzar(0, 42)
    const primera = generarContrasena()
    conAzar(0, 42)

    expect(generarContrasena()).toBe(primera)
    expect(primera).toMatch(/-0042$/)
  })

  it('descarta el azar que sesgaría las cifras y pide otro', () => {
    // 4 294 967 295 cae fuera del último múltiplo de 10 000 que cabe en 32 bits.
    const azar = conAzar(3, 4_294_967_295, 4821)

    expect(generarContrasena()).toMatch(/-4821$/)
    expect(azar).toHaveBeenCalledTimes(3)
  })

  it('no repite siempre la misma', () => {
    const generadas = new Set(Array.from({ length: 30 }, () => generarContrasena()))

    expect(generadas.size).toBeGreaterThan(20)
  })
})
