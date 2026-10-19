// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../cliente.js'
import {
  buscarPorCodigo,
  FILAS_POR_BLOQUE,
  listarHistorial,
  listarOpcionesDelHistorial,
  listarParaExportar,
} from './historial.js'

// Se simula el módulo del cliente, no la red: aquí importa qué consulta se arma.
vi.mock('../cliente.js', () => ({ supabase: { from: vi.fn() } }))

/**
 * Simula el constructor de consultas de supabase-js: anota cada método que se le encadena y,
 * al esperarlo, entrega la respuesta de su tabla.
 */
function simularConsultas(respuestas) {
  const pasos = {}
  vi.mocked(supabase.from).mockImplementation((tabla) => {
    pasos[tabla] = []
    const consulta = new Proxy(
      {},
      {
        get(_, metodo) {
          if (metodo === 'then') {
            return (resolver, rechazar) =>
              Promise.resolve(respuestas[tabla]).then(resolver, rechazar)
          }
          return (...argumentos) => {
            pasos[tabla].push([metodo, ...argumentos])
            return consulta
          }
        },
      },
    )
    return consulta
  })
  return pasos
}

const SIN_FILTROS = {
  finca: null,
  area: null,
  estados: [],
  desde: null,
  hasta: null,
  tipo: null,
}
const ORDEN = [
  ['order', 'fecha_registro', { ascending: false }],
  ['order', 'id', { ascending: false }],
]

describe('Consultas del historial (RF-19)', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('RF-19 / CU-19 4: sin filtros, la primera página de 20, de la más reciente a la más antigua', async () => {
    const novedades = [{ id: 'n-1' }]
    const pasos = simularConsultas({ v_novedad: { data: novedades, error: null, count: 45 } })

    await expect(listarHistorial(SIN_FILTROS)).resolves.toEqual({ novedades, total: 45 })

    expect(pasos.v_novedad).toEqual([
      ['select', expect.any(String), { count: 'exact' }],
      ...ORDEN,
      ['range', 0, 19],
    ])
  })

  it('RF-19 / CU-19 3: cada filtro llega a la consulta; las fechas son días de Colombia', async () => {
    const pasos = simularConsultas({ v_novedad: { data: [], error: null, count: 0 } })

    await listarHistorial(
      {
        finca: 'f-1',
        area: 'a-1',
        estados: ['resuelta', 'cerrada'],
        desde: '2026-04-01',
        hasta: '2026-09-24',
        tipo: 't-1',
      },
      2,
    )

    expect(pasos.v_novedad).toEqual([
      ['select', expect.any(String), { count: 'exact' }],
      ['eq', 'finca_id', 'f-1'],
      ['eq', 'area_id', 'a-1'],
      ['in', 'estado', ['resuelta', 'cerrada']],
      ['gte', 'fecha_registro', '2026-04-01T00:00:00-05:00'],
      // Hasta el final del día: antes de la medianoche del siguiente.
      ['lt', 'fecha_registro', '2026-09-25T00:00:00-05:00'],
      ['eq', 'tipo_falla_id', 't-1'],
      ...ORDEN,
      ['range', 40, 59],
    ])
  })

  it('RF-19: «hasta» el último día del mes o del año pasa al día siguiente', async () => {
    const pasos = simularConsultas({ v_novedad: { data: [], error: null, count: 0 } })

    await listarHistorial({ ...SIN_FILTROS, hasta: '2026-12-31' })

    expect(pasos.v_novedad).toContainEqual(['lt', 'fecha_registro', '2027-01-01T00:00:00-05:00'])
  })

  it('RNF-06: pide solo las columnas que muestran 21, 21-D y el CSV', async () => {
    const pasos = simularConsultas({ v_novedad: { data: [], error: null, count: 0 } })

    await listarHistorial(SIN_FILTROS)

    expect(pasos.v_novedad[0][1].split(', ')).toEqual([
      'id',
      'codigo',
      'prioridad',
      'estado',
      'fecha_registro',
      'resuelta_en',
      'finca',
      'area',
      'tipo_falla',
      'reportante',
    ])
  })

  it('RF-19: una página que ya no existe responde vacía', async () => {
    simularConsultas({
      v_novedad: {
        data: null,
        error: { code: 'PGRST103', message: 'Requested range not satisfiable' },
      },
    })

    await expect(listarHistorial(SIN_FILTROS, 9)).resolves.toEqual({ novedades: [], total: 0 })
  })

  it('RF-19: cualquier otro error se lanza', async () => {
    const error = { code: '42501', message: 'SIN_PERMISO' }
    simularConsultas({ v_novedad: { data: null, error } })

    await expect(listarHistorial(SIN_FILTROS)).rejects.toBe(error)
  })
})

describe('Buscador por código (RF-19; plan del Sprint 5, decisión 15)', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('RF-19: devuelve el id de la novedad con ese código, si se puede ver', async () => {
    const pasos = simularConsultas({ v_novedad: { data: { id: 'n-153' }, error: null } })

    await expect(buscarPorCodigo(153)).resolves.toBe('n-153')
    expect(pasos.v_novedad).toEqual([['select', 'id'], ['eq', 'codigo', 153], ['maybeSingle']])
  })

  it('RF-19 / RNF-11: no existe o está fuera del alcance: null, sin distinguir', async () => {
    simularConsultas({ v_novedad: { data: null, error: null } })

    await expect(buscarPorCodigo(9999)).resolves.toBeNull()
  })
})

describe('Opciones de los filtros (RF-19; plan del Sprint 5, decisión 9)', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('RF-19: fincas y áreas activas e inactivas; tipos activos y los inactivos con novedades', async () => {
    const pasos = simularConsultas({
      finca: { data: [{ id: 'f-1', nombre: 'La Mónica', activo: true }], error: null },
      area: { data: [{ id: 'a-1', nombre: 'Sistemas', activo: true }], error: null },
      tipo_falla: {
        data: [
          { id: 't-1', nombre: 'Biométrico', activo: true, novedad: [{ count: 4 }] },
          { id: 't-2', nombre: 'Lector', activo: false, novedad: [{ count: 2 }] },
          // Fusionado: sus novedades ya están en el destino.
          { id: 't-3', nombre: 'Biometrico viejo', activo: false, novedad: [{ count: 0 }] },
        ],
        error: null,
      },
    })

    await expect(listarOpcionesDelHistorial()).resolves.toEqual({
      fincas: [{ id: 'f-1', nombre: 'La Mónica', activo: true }],
      areas: [{ id: 'a-1', nombre: 'Sistemas', activo: true }],
      tipos: [
        { id: 't-1', nombre: 'Biométrico', activo: true },
        { id: 't-2', nombre: 'Lector', activo: false },
      ],
    })
    // Las inactivas, al final.
    for (const tabla of ['finca', 'area']) {
      expect(pasos[tabla]).toEqual([
        ['select', 'id, nombre, activo'],
        ['order', 'activo', { ascending: false }],
        ['order', 'nombre'],
      ])
    }
    expect(pasos.tipo_falla[0]).toEqual(['select', 'id, nombre, activo, novedad(count)'])
  })
})

describe('Todo el resultado para el CSV (RF-20; decisión 17)', () => {
  /** Cada solicitud entrega la siguiente respuesta de la lista y anota su rango. */
  function simularBloques(respuestas) {
    const rangos = []
    const pasos = []
    vi.mocked(supabase.from).mockImplementation(() => {
      const respuesta = respuestas.shift()
      const consulta = new Proxy(
        {},
        {
          get(_, metodo) {
            if (metodo === 'then') {
              return (resolver, rechazar) => Promise.resolve(respuesta).then(resolver, rechazar)
            }
            return (...argumentos) => {
              if (metodo === 'range') rangos.push(argumentos)
              else pasos.push([metodo, ...argumentos])
              return consulta
            }
          },
        },
      )
      return consulta
    })
    return { rangos, pasos }
  }

  const bloque = (desde, cuantas) =>
    Array.from({ length: cuantas }, (_, i) => ({ codigo: desde + i }))

  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('RF-20 / CU-20 2: pide bloques de 1000 hasta que llega uno incompleto, en el orden del historial', async () => {
    const { rangos, pasos } = simularBloques([
      { data: bloque(0, FILAS_POR_BLOQUE), error: null },
      { data: bloque(1000, FILAS_POR_BLOQUE), error: null },
      { data: bloque(2000, 3), error: null },
    ])

    const novedades = await listarParaExportar({ ...SIN_FILTROS, estados: ['cerrada'] })

    expect(novedades).toHaveLength(2003)
    expect(novedades.map(({ codigo }) => codigo)).toEqual(
      bloque(0, 2003).map(({ codigo }) => codigo),
    )
    expect(rangos).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ])
    // Los mismos filtros y el mismo orden que la página, en cada bloque.
    expect(pasos.slice(0, 4)).toEqual([
      ['select', expect.stringContaining('razon_social')],
      ['in', 'estado', ['cerrada']],
      ...ORDEN,
    ])
  })

  it('RF-20: con exactamente 1000, pide uno más, que llega vacío', async () => {
    const { rangos } = simularBloques([
      { data: bloque(0, FILAS_POR_BLOQUE), error: null },
      { data: [], error: null },
    ])

    await expect(listarParaExportar(SIN_FILTROS)).resolves.toHaveLength(FILAS_POR_BLOQUE)
    expect(rangos).toHaveLength(2)
  })

  it('RF-20: si un bloque falla a mitad, lanza el error y no entrega nada', async () => {
    const error = { message: 'Failed to fetch' }
    simularBloques([
      { data: bloque(0, FILAS_POR_BLOQUE), error: null },
      { data: null, error },
    ])

    await expect(listarParaExportar(SIN_FILTROS)).rejects.toBe(error)
  })
})
