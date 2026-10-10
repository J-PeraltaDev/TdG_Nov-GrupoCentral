// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { inicioDelMesEnColombia } from '../../utils/fechas.js'
import { supabase } from '../cliente.js'
import { contarDecisionesDelMes, listarEscaladas, listarEscalamientos } from './novedades.js'

// Se simula el módulo del cliente, no la red: aquí importa qué consulta se arma.
vi.mock('../cliente.js', () => ({ supabase: { from: vi.fn() } }))

/**
 * Simula el constructor de consultas de supabase-js: anota cada método que se le encadena y,
 * al esperarlo, entrega la respuesta. Cada llamada a `from` tiene su propia lista de pasos.
 */
function simularConsultas(respuesta) {
  const consultas = []
  vi.mocked(supabase.from).mockImplementation((tabla) => {
    const pasos = [['from', tabla]]
    consultas.push(pasos)
    const consulta = new Proxy(
      {},
      {
        get(_, metodo) {
          if (metodo === 'then') {
            return (resolver, rechazar) => Promise.resolve(respuesta).then(resolver, rechazar)
          }
          return (...argumentos) => {
            pasos.push([metodo, ...argumentos])
            return consulta
          }
        },
      },
    )
    return consulta
  })
  return consultas
}

describe('Consultas de las novedades escaladas (RF-13 / CU-13)', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('RF-13 / CU-13 2: lista las escaladas por prioridad y antigüedad, por páginas de 20', async () => {
    const [pasos] = await (async () => {
      const consultas = simularConsultas({ data: [{ id: 'n-1' }], error: null, count: 3 })
      await expect(listarEscaladas({ pagina: 1 })).resolves.toEqual({
        novedades: [{ id: 'n-1' }],
        total: 3,
      })
      return consultas
    })()

    expect(pasos[0]).toEqual(['from', 'v_novedad'])
    expect(pasos[1][2]).toEqual({ count: 'exact' })
    expect(pasos).toContainEqual(['eq', 'estado', 'escalada'])
    expect(pasos.filter(([metodo]) => metodo === 'order')).toEqual([
      ['order', 'prioridad', { ascending: true }],
      ['order', 'fecha_registro', { ascending: true }],
      ['order', 'codigo', { ascending: true }],
    ])
    expect(pasos).toContainEqual(['range', 20, 39])
  })

  it('RNF-06: pide columnas explícitas de la vista', async () => {
    const consultas = simularConsultas({ data: [], error: null, count: 0 })
    await listarEscaladas()

    const columnas = consultas[0][1][1]
    expect(columnas).not.toBe('*')
    for (const columna of ['id', 'codigo', 'descripcion', 'prioridad', 'estado', 'area', 'finca']) {
      expect(columnas).toContain(columna)
    }
  })

  it('RF-13 / CU-13 2: trae la justificación y quién escaló, sin pedir el correo', async () => {
    const filas = [{ id: 7, novedad_id: 'n-1', observacion: 'Hay que comprar el repuesto.' }]
    const consultas = simularConsultas({ data: filas, error: null })

    await expect(listarEscalamientos(['n-1', 'n-2'])).resolves.toBe(filas)

    const pasos = consultas[0]
    expect(pasos[0]).toEqual(['from', 'historial_transicion'])
    expect(pasos[1][1]).toContain('usuario_publico')
    expect(pasos[1][1]).not.toContain('correo')
    expect(pasos).toContainEqual(['in', 'novedad_id', ['n-1', 'n-2']])
    expect(pasos).toContainEqual(['eq', 'estado_nuevo', 'escalada'])
    expect(pasos).toContainEqual(['order', 'id', { ascending: true }])
  })

  it('sin novedades no consulta el historial', async () => {
    await expect(listarEscalamientos([])).resolves.toEqual([])
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('RF-13: cuenta las decisiones del director en el mes, aprobadas y rechazadas', async () => {
    const consultas = simularConsultas({ count: 2, error: null })
    const desde = '2026-10-01T00:00:00-05:00'

    await expect(contarDecisionesDelMes('u-5', desde)).resolves.toEqual({
      aprobadas: 2,
      rechazadas: 2,
    })

    expect(consultas).toHaveLength(2)
    for (const [i, estado] of ['aprobada', 'rechazada'].entries()) {
      expect(consultas[i][0]).toEqual(['from', 'historial_transicion'])
      expect(consultas[i][1]).toEqual(['select', 'id', { count: 'exact', head: true }])
      expect(consultas[i]).toContainEqual(['eq', 'usuario_id', 'u-5'])
      expect(consultas[i]).toContainEqual(['eq', 'estado_anterior', 'escalada'])
      expect(consultas[i]).toContainEqual(['eq', 'estado_nuevo', estado])
      expect(consultas[i]).toContainEqual(['gte', 'fecha_hora', desde])
    }
  })

  it('lanza el error de Supabase tal cual', async () => {
    const error = { code: '42501', message: 'permission denied' }
    simularConsultas({ data: null, error, count: null })

    await expect(listarEscaladas()).rejects.toBe(error)
    await expect(listarEscalamientos(['n-1'])).rejects.toBe(error)
    await expect(contarDecisionesDelMes('u-5', 'x')).rejects.toBe(error)
  })
})

describe('Inicio del mes en la hora de Colombia (pantalla 19)', () => {
  it('RF-13: es la medianoche del día 1 en Colombia, no en UTC', () => {
    expect(inicioDelMesEnColombia('2026-10-09T18:00:00Z')).toBe('2026-10-01T00:00:00-05:00')
    // El 1 de noviembre a las 3:00 UTC todavía es 31 de octubre en Colombia.
    expect(inicioDelMesEnColombia('2026-11-01T03:00:00Z')).toBe('2026-10-01T00:00:00-05:00')
    expect(inicioDelMesEnColombia('2026-11-01T05:00:00Z')).toBe('2026-11-01T00:00:00-05:00')
  })
})
