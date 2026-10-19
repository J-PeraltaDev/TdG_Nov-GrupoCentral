// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../cliente.js'
import { borrarSuscripcion, guardarSuscripcion } from './suscripciones.js'

vi.mock('../cliente.js', () => ({ supabase: { from: vi.fn() } }))

/** Anota los métodos encadenados y responde con `respuesta`. */
function simular(respuesta) {
  const pasos = []
  const consulta = new Proxy(
    {},
    {
      get(_, metodo) {
        if (metodo === 'then') return (resolver) => resolver(respuesta)
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

describe('Suscripciones push (RF-31)', () => {
  beforeEach(() => vi.mocked(supabase.from).mockReset())

  it('RF-31: guarda la suscripción del navegador a nombre del usuario, por su punto de entrega', async () => {
    const pasos = simular({ error: null })

    await guardarSuscripcion('usuario-1', {
      endpoint: 'https://fcm.googleapis.com/fcm/send/x',
      keys: { p256dh: 'p256dh', auth: 'auth' },
    })

    expect(supabase.from).toHaveBeenCalledWith('suscripcion_push')
    expect(pasos).toEqual([
      [
        'upsert',
        {
          usuario_id: 'usuario-1',
          endpoint: 'https://fcm.googleapis.com/fcm/send/x',
          p256dh: 'p256dh',
          auth: 'auth',
        },
        { onConflict: 'endpoint' },
      ],
    ])
  })

  it('RF-31: lanza el error de la base (la RLS, la red)', async () => {
    const error = { code: '42501', message: 'new row violates row-level security policy' }
    simular({ error })

    await expect(
      guardarSuscripcion('usuario-1', { endpoint: 'e', keys: { p256dh: 'p', auth: 'a' } }),
    ).rejects.toBe(error)
  })

  it('RF-31: borra por el punto de entrega', async () => {
    const pasos = simular({ error: null })

    await borrarSuscripcion('https://fcm.googleapis.com/fcm/send/x')

    expect(pasos).toEqual([['delete'], ['eq', 'endpoint', 'https://fcm.googleapis.com/fcm/send/x']])
  })
})
