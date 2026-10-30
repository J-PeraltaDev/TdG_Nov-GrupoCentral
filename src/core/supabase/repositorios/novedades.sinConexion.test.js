// @vitest-environment node
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { traducirError } from '../../errores/traducir.js'
import { cerrarBd, leerNovedadDescargada } from '../../offline/bd.js'
import { supabase } from '../cliente.js'
import {
  contarBandeja,
  listarBandeja,
  listarEscaladas,
  listarEscalamientos,
  listarLineaDeTiempo,
  listarNovedades,
  obtenerNovedad,
} from './novedades.js'

// Se simulan el cliente y el monitor, no la red; lo descargado va a un IndexedDB en memoria.
const conexion = vi.hoisted(() => ({ enLinea: true }))
vi.mock('../cliente.js', () => ({ supabase: { from: vi.fn() } }))
vi.mock('../../conexion/monitor.js', () => ({ estaEnLinea: () => conexion.enLinea }))

/** El constructor de consultas de supabase-js: cualquier cadena de métodos entrega `respuesta`. */
function responder(respuesta) {
  const consulta = new Proxy(
    {},
    {
      get: (_, metodo) =>
        metodo === 'then'
          ? (resolver, rechazar) => Promise.resolve(respuesta).then(resolver, rechazar)
          : () => consulta,
    },
  )
  vi.mocked(supabase.from).mockReturnValue(consulta)
}

const ABIERTAS = ['registrada', 'asignada', 'en_atencion', 'escalada', 'aprobada']
const BANDEJA = { areaId: 'area-m', estados: ['asignada', 'aprobada'] }

const novedad = (codigo, cambios = {}) => ({
  id: `n-${codigo}`,
  codigo,
  descripcion: `Novedad ${codigo}`,
  prioridad: 'normal',
  estado: 'asignada',
  area_id: 'area-m',
  area: 'Mantenimiento',
  finca_id: 'finca-1',
  finca: 'Finca de prueba 01',
  fecha_registro: '2026-09-24T12:40:00+00:00',
  ...cambios,
})

describe('Lecturas con respaldo en el dispositivo (RF-24 / CU-24)', () => {
  beforeEach(async () => {
    await cerrarBd()
    globalThis.indexedDB = new IDBFactory()
    vi.mocked(supabase.from).mockReset()
    conexion.enLinea = true
  })

  it('RF-24 / CU-24 2 a 4: con conexión guarda lo que trae; sin ella lo devuelve con su fecha, sin pedirlo', async () => {
    const lista = [novedad(153), novedad(149, { estado: 'en_atencion' })]
    responder({ data: lista, error: null, count: 2 })
    await expect(listarNovedades({ estados: ABIERTAS })).resolves.toEqual({
      novedades: lista,
      total: 2,
    })

    conexion.enLinea = false
    vi.mocked(supabase.from).mockClear()
    const descargada = await listarNovedades({ estados: ABIERTAS })

    expect(supabase.from).not.toHaveBeenCalled()
    expect(descargada.total).toBe(2)
    expect(descargada.novedades.map(({ codigo }) => codigo)).toEqual([153, 149])
    expect(descargada.descargadaEn).toEqual(expect.any(String))
  })

  it('RF-24: si la red falla en el camino, también responde con lo descargado', async () => {
    responder({ data: [novedad(153)], error: null, count: 1 })
    await listarBandeja(BANDEJA)

    responder({ data: null, error: new TypeError('Failed to fetch'), count: null })
    const descargada = await listarBandeja(BANDEJA)
    const conteo = await contarBandeja(BANDEJA)

    expect(descargada.novedades).toHaveLength(1)
    expect(conteo).toBe(1)
  })

  it('RF-24 (cambio 48): sin conexión, las finalizadas descargadas siguen de la más reciente a la más antigua', async () => {
    const finalizadas = { areaId: 'area-m', estados: ['rechazada', 'cerrada'], recientes: true }
    const reciente = novedad(160, {
      estado: 'cerrada',
      prioridad: 'bajo',
      fecha_registro: '2026-09-25T12:40:00+00:00',
    })
    responder({
      data: [reciente, novedad(150, { estado: 'rechazada', prioridad: 'critico' })],
      error: null,
      count: 2,
    })
    await listarBandeja(finalizadas)

    conexion.enLinea = false
    const descargada = await listarBandeja(finalizadas)

    // Por prioridad, la crítica iría primero.
    expect(descargada.novedades.map(({ codigo }) => codigo)).toEqual([160, 150])
  })

  it('RF-24 (04-B y 11-B): sin conexión, cada conteo es el de la última descarga, aunque esa pestaña no se haya abierto', async () => {
    const enAtencion = { ...BANDEJA, estados: ['en_atencion'] }
    responder({ data: null, error: null, count: 2 })
    await contarBandeja(enAtencion)

    conexion.enLinea = false

    await expect(contarBandeja(enAtencion)).resolves.toBe(2)
  })

  it('un error que no es de red se lanza tal cual: no se esconde con lo descargado', async () => {
    responder({ data: [novedad(153)], error: null, count: 1 })
    await listarBandeja(BANDEJA)

    const sinPermiso = { code: '42501', message: 'permission denied' }
    responder({ data: null, error: sinPermiso, count: null })

    await expect(listarBandeja(BANDEJA)).rejects.toBe(sinPermiso)
  })

  it('CU-24 3a: sin conexión y sin nada descargado, «La primera consulta necesita conexión»', async () => {
    conexion.enLinea = false

    const error = await listarEscaladas().catch((e) => e)

    expect(traducirError(error)).toEqual({
      tipo: 'red',
      codigo: 'SIN_DESCARGA',
      mensaje:
        'La primera consulta necesita conexión. Abre esta pantalla con internet para descargar tus novedades.',
    })
  })

  it('CU-18 3a: el detalle descargado vuelve con su fecha y su línea de tiempo', async () => {
    const transiciones = [{ id: 2, estado_nuevo: 'asignada' }]
    responder({ data: novedad(153, { reportante: 'Luz Marina' }), error: null })
    await obtenerNovedad('n-153')
    responder({ data: transiciones, error: null })
    await listarLineaDeTiempo('n-153')

    conexion.enLinea = false

    expect(await obtenerNovedad('n-153')).toMatchObject({
      codigo: 153,
      reportante: 'Luz Marina',
      descargada_en: expect.any(String),
    })
    expect(await listarLineaDeTiempo('n-153')).toEqual(transiciones)
  })

  it('una novedad que llegó solo en una lista no tiene línea de tiempo; una que no llegó, no está', async () => {
    responder({ data: [novedad(153)], error: null, count: 1 })
    await listarBandeja(BANDEJA)
    conexion.enLinea = false

    await expect(listarLineaDeTiempo('n-153')).resolves.toBeNull()
    await expect(obtenerNovedad('n-999')).rejects.toMatchObject({ name: 'SinDescarga' })
  })

  it('los escalamientos de las escaladas descargadas se guardan para leerlos sin conexión', async () => {
    responder({ data: [novedad(153, { estado: 'escalada' })], error: null, count: 1 })
    await listarEscaladas()
    const escalamiento = { id: 9, novedad_id: 'n-153', observacion: 'Hay que cambiar el puente.' }
    responder({ data: [escalamiento], error: null })
    await listarEscalamientos(['n-153'])

    conexion.enLinea = false

    await expect(listarEscalamientos(['n-153'])).resolves.toEqual([escalamiento])
  })

  it('si el servidor ya no deja ver la novedad, se borra lo que se había descargado de ella', async () => {
    responder({ data: novedad(153), error: null })
    await obtenerNovedad('n-153')

    responder({ data: null, error: null })
    await expect(obtenerNovedad('n-153')).resolves.toBeNull()

    expect(await leerNovedadDescargada('n-153')).toBeUndefined()
  })
})
