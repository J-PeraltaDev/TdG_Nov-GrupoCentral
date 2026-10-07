// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Cliente único de Supabase (C-03)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('crea una sola instancia con la URL y la clave publicable', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:54321')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_de_prueba')

    const { supabase } = await import('./cliente.js')
    const otraVez = await import('./cliente.js')

    expect(supabase.auth).toBeDefined()
    expect(otraVez.supabase).toBe(supabase)
  })

  it.each([
    ['la URL', { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' }],
    [
      'la clave',
      { VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
    ],
  ])('falla con un mensaje claro si falta %s', async (_, variables) => {
    for (const [nombre, valor] of Object.entries(variables)) vi.stubEnv(nombre, valor)

    await expect(import('./cliente.js')).rejects.toThrow(
      /Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY/,
    )
  })
})
