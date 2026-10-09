// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../cliente.js'
import { sugerirTiposFalla } from './tiposFalla.js'

// Se simula el módulo del cliente, no la red.
vi.mock('../cliente.js', () => ({ supabase: { rpc: vi.fn() } }))

describe('sugerirTiposFalla (RF-14, SDD Tabla 21)', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset()
  })

  it('RF-14 / CU-14 4: pide las sugerencias del texto escrito y las devuelve', async () => {
    const sugerencias = [
      { id: 'tipo-1', nombre: 'Biométrico', cantidad_novedades: 11, coincidencia_exacta: true },
    ]
    vi.mocked(supabase.rpc).mockResolvedValue({ data: sugerencias, error: null })

    await expect(sugerirTiposFalla('biometrico')).resolves.toBe(sugerencias)

    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('sugerir_tipos_falla', {
      p_texto: 'biometrico',
    })
  })

  it('RF-14: lanza el error de Supabase tal cual', async () => {
    const error = { code: 'P0001', message: 'SIN_PERMISO', details: null, hint: null }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error })

    await expect(sugerirTiposFalla('bio')).rejects.toBe(error)
  })
})
