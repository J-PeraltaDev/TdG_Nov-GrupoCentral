// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { armarMatriz, combinaciones, pasoDeColor } from './matriz.js'

const celda = (finca, tipo, cantidad) => ({
  finca_id: `f-${finca}`,
  finca,
  tipo_falla_id: `t-${tipo}`,
  tipo_falla: tipo,
  cantidad,
})

// Figma 26, sin las cinco fincas de «Otras».
const CELDAS = [
  celda('La Mónica', 'Biométrico', 5),
  celda('La Mónica', 'Conectividad a internet', 1),
  celda('Juanca', 'Conectividad a internet', 2),
  celda('Juanca', 'Biométrico', 1),
  celda('Pavarandó', 'Conectividad a internet', 4),
  celda('Tumaradó', 'Torniquete', 3),
]

describe('Matriz finca por tipo de falla (RF-29; plan del Sprint 5, decisión 22)', () => {
  it('RF-29 / CU-29 3: columnas y filas por total, de mayor a menor; en un empate, por nombre', () => {
    const matriz = armarMatriz(CELDAS)

    expect(matriz.columnas.map((columna) => [columna.nombre, columna.total])).toEqual([
      ['Conectividad a internet', 7],
      ['Biométrico', 6],
      ['Torniquete', 3],
    ])
    expect(matriz.filas.map((fila) => [fila.nombre, fila.total])).toEqual([
      ['La Mónica', 6],
      ['Pavarandó', 4],
      ['Juanca', 3],
      ['Tumaradó', 3],
    ])
    expect(matriz.total).toBe(16)
    expect(matriz.otras).toBeNull()
  })

  it('RF-29: cada fila trae su cantidad por tipo, en cero donde no hay', () => {
    const { filas, columnas } = armarMatriz(CELDAS)
    const monica = filas.find((fila) => fila.nombre === 'La Mónica')

    expect(columnas.map((columna) => monica.cantidades[columna.id])).toEqual([1, 5, 0])
  })

  it('RF-29 (decisión 22): siete fincas a la vista y las demás en «Otras N fincas», con sus sumas', () => {
    const muchas = Array.from({ length: 10 }, (_, i) =>
      celda(`Finca ${String(i + 1).padStart(2, '0')}`, i < 5 ? 'Bombas' : 'Cámaras', 10 - i),
    )

    const { filas, otras, columnas } = armarMatriz(muchas)

    expect(filas.map((fila) => fila.nombre)).toEqual([
      'Finca 01',
      'Finca 02',
      'Finca 03',
      'Finca 04',
      'Finca 05',
      'Finca 06',
      'Finca 07',
    ])
    expect(otras.fincas.map((fila) => fila.nombre)).toEqual(['Finca 08', 'Finca 09', 'Finca 10'])
    expect(otras.total).toBe(3 + 2 + 1)
    expect(columnas.map((columna) => otras.cantidades[columna.id])).toEqual([0, 6])
  })

  it('RF-29: sin celdas, una matriz vacía', () => {
    expect(armarMatriz([])).toEqual({ columnas: [], filas: [], otras: null, total: 0, mayor: 0 })
  })

  it('RF-29 (decisión 25): cinco pasos de color, de la celda más pequeña a la mayor', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => pasoDeColor(n, 5))).toEqual([0, 1, 2, 3, 4, 5])
    expect(pasoDeColor(1, 20)).toBe(1)
    expect(pasoDeColor(10, 20)).toBe(3)
    // Las sumas de «Otras» pueden pasar a la mayor: se quedan en el último paso.
    expect(pasoDeColor(30, 20)).toBe(5)
  })

  it('RF-29: las combinaciones más repetidas, de mayor a menor y por nombre en un empate', () => {
    expect(
      combinaciones(CELDAS, 3).map((c) => `${c.finca} · ${c.tipo_falla}: ${c.cantidad}`),
    ).toEqual([
      'La Mónica · Biométrico: 5',
      'Pavarandó · Conectividad a internet: 4',
      'Tumaradó · Torniquete: 3',
    ])
  })
})
