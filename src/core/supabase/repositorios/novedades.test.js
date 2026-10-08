// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../cliente.js'
import {
  escalarNovedad,
  reasignarNovedad,
  rechazarNovedad,
  registrarSolucion,
  tomarNovedad,
} from './novedades.js'

// Se simula el módulo del cliente, no la red: aquí solo importa qué función se llama y con
// qué parámetros (SDD, Tabla 21).
vi.mock('../cliente.js', () => ({ supabase: { rpc: vi.fn() } }))

const NOVEDAD = { id: 'novedad-1', codigo: 153, estado: 'en_atencion' }

describe('Transiciones de atención (SDD, Tabla 21)', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset().mockResolvedValue({ data: NOVEDAD, error: null })
  })

  it.each([
    [
      'RF-10 / CU-10',
      () => tomarNovedad('novedad-1'),
      'tomar_novedad',
      { p_novedad_id: 'novedad-1' },
    ],
    [
      'RF-11 / CU-11',
      () => rechazarNovedad('novedad-1', 'Duplicada'),
      'rechazar_novedad',
      { p_novedad_id: 'novedad-1', p_motivo: 'Duplicada' },
    ],
    [
      'RF-17 / CU-17',
      () => reasignarNovedad('novedad-1', 'area-sistemas', 'Es un daño de red'),
      'reasignar_novedad',
      {
        p_novedad_id: 'novedad-1',
        p_area_destino_id: 'area-sistemas',
        p_motivo: 'Es un daño de red',
      },
    ],
    [
      'RF-12 / CU-12',
      () => escalarNovedad('novedad-1', 'Hay que comprar un repuesto'),
      'escalar_novedad',
      { p_novedad_id: 'novedad-1', p_justificacion: 'Hay que comprar un repuesto' },
    ],
  ])(
    '%s: llama a su función con los parámetros de la Tabla 21',
    async (_, llamar, funcion, parametros) => {
      await expect(llamar()).resolves.toBe(NOVEDAD)

      expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith(funcion, parametros)
    },
  )

  it('RF-14 / CU-14 5: con un tipo de falla existente envía su id y no un nombre', async () => {
    await registrarSolucion('novedad-1', {
      solucion: 'Se cambió el fusible',
      fecha_ejecucion: '2026-09-24',
      tipo_falla_id: 'tipo-1',
    })

    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('registrar_solucion', {
      p_novedad_id: 'novedad-1',
      p_solucion: 'Se cambió el fusible',
      p_fecha_ejecucion: '2026-09-24',
      p_tipo_falla_id: 'tipo-1',
    })
  })

  it('RF-14 / CU-14 5: con un tipo de falla nuevo envía su nombre y no un id', async () => {
    await registrarSolucion('novedad-1', {
      solucion: 'Se cambió el fusible',
      fecha_ejecucion: '2026-09-24',
      tipo_falla_nombre: 'Fusibles',
    })

    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('registrar_solucion', {
      p_novedad_id: 'novedad-1',
      p_solucion: 'Se cambió el fusible',
      p_fecha_ejecucion: '2026-09-24',
      p_tipo_falla_nombre: 'Fusibles',
    })
  })

  it.each([
    ['tomarNovedad', () => tomarNovedad('novedad-1')],
    ['rechazarNovedad', () => rechazarNovedad('novedad-1', 'Duplicada')],
    ['reasignarNovedad', () => reasignarNovedad('novedad-1', 'area-sistemas', 'Motivo')],
    ['escalarNovedad', () => escalarNovedad('novedad-1', 'Justificación')],
    [
      'registrarSolucion',
      () =>
        registrarSolucion('novedad-1', {
          solucion: 'x',
          fecha_ejecucion: '2026-09-24',
          tipo_falla_id: 'tipo-1',
        }),
    ],
  ])('RF-16: %s lanza el error de Supabase tal cual, con su código', async (_, llamar) => {
    const error = { code: 'P0001', message: 'TRANSICION_INVALIDA', details: null, hint: null }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error })

    await expect(llamar()).rejects.toBe(error)
  })
})
