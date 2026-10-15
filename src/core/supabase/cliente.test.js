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

  it('RF-23: cada solicitud le cuenta al monitor si llegó al servidor', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:54321')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_de_prueba')
    const monitor = { informarFalloDeRed: vi.fn(), informarRespuesta: vi.fn() }
    vi.doMock('../conexion/monitor.js', () => monitor)
    const red = vi.fn()
    vi.stubGlobal('fetch', red)
    const { supabase } = await import('./cliente.js')

    // Sin el reintento de la API de datos (1 s, 2 s y 4 s): aquí solo importa el aviso.
    red.mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')))
    await supabase.from('area').select('id').retry(false)
    expect(monitor.informarFalloDeRed).toHaveBeenCalled()
    expect(monitor.informarRespuesta).not.toHaveBeenCalled()

    // Cancelada por quien llama: no dice nada de la red.
    vi.clearAllMocks()
    red.mockImplementation(() => Promise.reject(new DOMException('', 'AbortError')))
    await supabase.from('area').select('id').retry(false)
    expect(monitor.informarFalloDeRed).not.toHaveBeenCalled()

    red.mockImplementation(() => Promise.resolve(new Response('[]', { status: 200 })))
    await supabase.from('area').select('id').retry(false)
    expect(monitor.informarRespuesta).toHaveBeenCalled()

    vi.unstubAllGlobals()
    vi.doUnmock('../conexion/monitor.js')
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
