// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../cliente.js'
import {
  obtenerEscalamiento,
  obtenerNovedadesAbiertas,
  obtenerRecurrencia,
  obtenerTiemposDeAtencion,
} from './reportes.js'

// Se simula el módulo del cliente, no la red: aquí importa qué función se llama.
vi.mock('../cliente.js', () => ({ supabase: { rpc: vi.fn() } }))

describe('Indicadores del panel (RF-26 y RF-27, SDD 6.1.9)', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset()
  })

  it('RF-26: una sola llamada para las abiertas', async () => {
    const datos = { datos_al: '2026-09-24T14:30:00Z', areas: [], fincas: [], estados: [] }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: datos, error: null })

    await expect(obtenerNovedadesAbiertas()).resolves.toBe(datos)
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('rpt_novedades_abiertas')
  })

  it('RF-27: los tiempos, con el período en días de Colombia', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: { areas: [] }, error: null })

    await obtenerTiemposDeAtencion({ desde: '2026-07-01', hasta: '2026-09-24' })

    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('rpt_tiempos_atencion', {
      p_desde: '2026-07-01',
      p_hasta: '2026-09-24',
    })
  })

  it('RF-26 / CU-26 1a: el error del servidor se lanza', async () => {
    const error = { code: 'P0001', message: 'SIN_PERMISO' }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error })

    await expect(obtenerNovedadesAbiertas()).rejects.toBe(error)
  })

  it.each([
    ['rpt_escalamiento', obtenerEscalamiento],
    ['rpt_recurrencia', obtenerRecurrencia],
  ])('RF-28 / RF-29: %s, con el período', async (funcion, obtener) => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: { total: 0 }, error: null })

    await expect(obtener({ desde: '2026-04-01', hasta: '2026-09-24' })).resolves.toEqual({
      total: 0,
    })
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith(funcion, {
      p_desde: '2026-04-01',
      p_hasta: '2026-09-24',
    })
  })
})
