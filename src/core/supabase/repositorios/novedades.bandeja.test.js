// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../cliente.js'
import { contarBandeja, listarBandeja, listarTransicionesDeBandeja } from './novedades.js'

// Se simula el módulo del cliente, no la red: aquí importa qué consulta se arma.
vi.mock('../cliente.js', () => ({ supabase: { from: vi.fn() } }))

/**
 * Simula el constructor de consultas de supabase-js: anota cada método que se le encadena y,
 * al esperarlo, entrega la respuesta.
 */
function simularConsulta(respuesta) {
  const pasos = []
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
  vi.mocked(supabase.from).mockReturnValue(consulta)
  return pasos
}

const FILTRO = { areaId: 'area-m', estados: ['asignada', 'aprobada'] }
const ORDEN_DE_LA_BANDEJA = [
  ['order', 'prioridad', { ascending: true }],
  ['order', 'fecha_registro', { ascending: true }],
  ['order', 'codigo', { ascending: true }],
]

describe('Consultas de la bandeja del área (RF-09)', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('RF-09 / CU-09 2: pide las novedades del área en esos estados, por prioridad y antigüedad', async () => {
    const novedades = [{ id: 'n-1' }, { id: 'n-2' }]
    const pasos = simularConsulta({ data: novedades, error: null, count: 7 })

    await expect(listarBandeja(FILTRO)).resolves.toEqual({ novedades, total: 7 })

    expect(supabase.from).toHaveBeenCalledExactlyOnceWith('v_novedad')
    expect(pasos).toEqual([
      ['select', expect.not.stringContaining('*'), { count: 'exact' }],
      ['eq', 'area_id', 'area-m'],
      ['in', 'estado', ['asignada', 'aprobada']],
      ...ORDEN_DE_LA_BANDEJA,
      ['range', 0, 19],
    ])
  })

  it('RNF-06: pide solo las columnas que la bandeja muestra', async () => {
    const pasos = simularConsulta({ data: [], error: null, count: 0 })

    await listarBandeja(FILTRO)

    expect(pasos[0][1].split(', ')).toEqual([
      'id',
      'codigo',
      'descripcion',
      'prioridad',
      'estado',
      'area_id',
      'area',
      'finca_id',
      'finca',
      'fecha_registro',
    ])
  })

  it('RF-09: con una finca elegida filtra también por ella', async () => {
    const pasos = simularConsulta({ data: [], error: null, count: 0 })

    await listarBandeja({ ...FILTRO, fincaId: 'finca-2' })

    expect(pasos.slice(1, 4)).toEqual([
      ['eq', 'area_id', 'area-m'],
      ['in', 'estado', ['asignada', 'aprobada']],
      ['eq', 'finca_id', 'finca-2'],
    ])
  })

  it('RNF-06: cada página trae 20 novedades', async () => {
    const pasos = simularConsulta({ data: [], error: null, count: 45 })

    await listarBandeja({ ...FILTRO, pagina: 2 })

    expect(pasos.at(-1)).toEqual(['range', 40, 59])
  })

  it('RF-09: cuenta las novedades de una pestaña sin traer sus filas', async () => {
    const pasos = simularConsulta({ data: null, error: null, count: 3 })

    await expect(contarBandeja({ ...FILTRO, fincaId: 'finca-2' })).resolves.toBe(3)

    expect(pasos).toEqual([
      ['select', 'id', { count: 'exact', head: true }],
      ['eq', 'area_id', 'area-m'],
      ['in', 'estado', ['asignada', 'aprobada']],
      ['eq', 'finca_id', 'finca-2'],
    ])
  })

  it('RF-09: trae en orden las transiciones que explican cada novedad de la página', async () => {
    const transiciones = [{ id: 1, novedad_id: 'n-1', estado_nuevo: 'asignada' }]
    const pasos = simularConsulta({ data: transiciones, error: null })

    await expect(listarTransicionesDeBandeja(['n-1', 'n-2'])).resolves.toBe(transiciones)

    expect(supabase.from).toHaveBeenCalledExactlyOnceWith('historial_transicion')
    expect(pasos.slice(1)).toEqual([
      ['in', 'novedad_id', ['n-1', 'n-2']],
      ['in', 'estado_nuevo', ['asignada', 'escalada', 'aprobada']],
      ['order', 'id', { ascending: true }],
    ])
    // Los nombres salen de usuario_publico; el correo nunca se pide (ADR 0010).
    expect(pasos[0][1]).toContain('usuario_publico')
    expect(pasos[0][1]).not.toContain('correo')
  })

  it('RF-09: sin novedades en la página no consulta el historial', async () => {
    await expect(listarTransicionesDeBandeja([])).resolves.toEqual([])

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it.each([
    ['listarBandeja', () => listarBandeja(FILTRO)],
    ['contarBandeja', () => contarBandeja(FILTRO)],
    ['listarTransicionesDeBandeja', () => listarTransicionesDeBandeja(['n-1'])],
  ])('%s lanza el error de Supabase tal cual', async (_, llamar) => {
    const error = { code: '42501', message: 'permission denied' }
    simularConsulta({ data: null, error, count: null })

    await expect(llamar()).rejects.toBe(error)
  })
})
