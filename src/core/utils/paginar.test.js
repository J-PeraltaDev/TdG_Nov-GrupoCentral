import { describe, expect, it } from 'vitest'
import { paginar } from './paginar.js'

const LISTA = Array.from({ length: 45 }, (_, i) => i + 1)

describe('Páginas de una lista (pantallas 28, 30 y 32)', () => {
  it('entrega la página pedida y dónde empieza', () => {
    expect(paginar(LISTA, 0, 20)).toMatchObject({ pagina: 0, ultima: 2, desde: 0 })
    expect(paginar(LISTA, 0, 20).visibles).toHaveLength(20)
    expect(paginar(LISTA, 1, 20).visibles[0]).toBe(21)
    expect(paginar(LISTA, 2, 20)).toEqual({
      pagina: 2,
      ultima: 2,
      desde: 40,
      visibles: [41, 42, 43, 44, 45],
    })
  })

  it('si la página ya no existe, entrega la última', () => {
    expect(paginar(LISTA.slice(0, 5), 2, 20)).toEqual({
      pagina: 0,
      ultima: 0,
      desde: 0,
      visibles: [1, 2, 3, 4, 5],
    })
    expect(paginar(LISTA, 9, 20).pagina).toBe(2)
    expect(paginar(LISTA, -1, 20).pagina).toBe(0)
  })

  it('una lista vacía tiene una sola página, sin nada', () => {
    expect(paginar([], 0, 20)).toEqual({ pagina: 0, ultima: 0, desde: 0, visibles: [] })
  })

  it('una lista que llena justo la página no abre otra', () => {
    expect(paginar(LISTA.slice(0, 20), 0, 20).ultima).toBe(0)
    expect(paginar(LISTA.slice(0, 21), 0, 20).ultima).toBe(1)
  })
})
