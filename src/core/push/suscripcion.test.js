import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { borrarSuscripcion, guardarSuscripcion } from '../supabase/repositorios/suscripciones.js'
import { activarPush, desactivarPush, estadoDelPush, sePuedeActivar } from './suscripcion.js'

vi.mock('../supabase/repositorios/suscripciones.js', () => ({
  guardarSuscripcion: vi.fn(),
  borrarSuscripcion: vi.fn(),
}))

// La clave pública del ejemplo del RFC 8291: un punto P-256 válido, sin nada secreto.
const CLAVE =
  'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8'

const suscripcionDelNavegador = (endpoint) => ({
  endpoint,
  unsubscribe: vi.fn(async () => true),
  toJSON: () => ({ endpoint, keys: { p256dh: 'p256dh', auth: 'auth' } }),
})

/** Un navegador con push: el permiso, la suscripción actual y las que entrega `subscribe`. */
function simularNavegador({ permiso = 'default', respuesta = 'granted', actual = null } = {}) {
  let vigente = actual
  const nuevas = [suscripcionDelNavegador('https://fcm.googleapis.com/fcm/send/nueva-1')]
  nuevas.push(suscripcionDelNavegador('https://fcm.googleapis.com/fcm/send/nueva-2'))
  const pushManager = {
    getSubscription: vi.fn(async () => vigente),
    subscribe: vi.fn(async () => (vigente = nuevas.shift())),
  }
  const Notificacion = { permission: permiso, requestPermission: vi.fn(async () => respuesta) }
  vi.stubGlobal('Notification', Notificacion)
  vi.stubGlobal('PushManager', function PushManager() {})
  vi.stubGlobal('navigator', {
    ...navigator,
    serviceWorker: {
      ready: Promise.resolve({ pushManager }),
      getRegistration: async () => ({ pushManager }),
    },
  })
  return { pushManager, Notificacion }
}

beforeEach(() => {
  vi.stubEnv('VITE_VAPID_PUBLIC_KEY', CLAVE)
  vi.mocked(guardarSuscripcion).mockReset().mockResolvedValue(undefined)
  vi.mocked(borrarSuscripcion).mockReset().mockResolvedValue(undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Notificaciones push en el dispositivo (RF-31; decisiones 44 y 45)', () => {
  it('RF-31: sin soporte del navegador o sin la clave pública, no se ofrecen', async () => {
    vi.stubGlobal('navigator', { ...navigator, serviceWorker: undefined })
    expect(sePuedeActivar()).toBe(false)
    expect(await estadoDelPush()).toBe('no-disponible')

    simularNavegador()
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', '')
    expect(sePuedeActivar()).toBe(false)
  })

  it('RF-31: el estado sale del permiso y de la suscripción del navegador', async () => {
    simularNavegador({ permiso: 'denied' })
    expect(await estadoDelPush()).toBe('bloqueadas')

    simularNavegador({ permiso: 'default' })
    expect(await estadoDelPush()).toBe('desactivadas')

    simularNavegador({
      permiso: 'granted',
      actual: suscripcionDelNavegador('https://fcm.googleapis.com/fcm/send/actual'),
    })
    expect(await estadoDelPush()).toBe('activadas')
  })

  it('RF-31 / CU-31: activar pide el permiso, suscribe con la clave pública y guarda la fila', async () => {
    const { pushManager, Notificacion } = simularNavegador()

    expect(await activarPush('usuario-1')).toBe('activadas')

    expect(Notificacion.requestPermission).toHaveBeenCalledOnce()
    const [{ userVisibleOnly, applicationServerKey }] = pushManager.subscribe.mock.calls[0]
    expect(userVisibleOnly).toBe(true)
    expect(applicationServerKey).toHaveLength(65)
    expect(guardarSuscripcion).toHaveBeenCalledExactlyOnceWith('usuario-1', {
      endpoint: 'https://fcm.googleapis.com/fcm/send/nueva-1',
      keys: { p256dh: 'p256dh', auth: 'auth' },
    })
  })

  it('RF-31: si la persona niega el permiso, no suscribe ni guarda nada', async () => {
    const { pushManager } = simularNavegador({ respuesta: 'denied' })

    expect(await activarPush('usuario-1')).toBe('bloqueadas')
    expect(pushManager.subscribe).not.toHaveBeenCalled()
    expect(guardarSuscripcion).not.toHaveBeenCalled()
  })

  it('decisión 45: si el punto de entrega es de otra persona del dispositivo, se cancela y se crea otro', async () => {
    const ajena = suscripcionDelNavegador('https://fcm.googleapis.com/fcm/send/de-otra-persona')
    simularNavegador({ permiso: 'granted', actual: ajena })
    vi.mocked(guardarSuscripcion)
      .mockRejectedValueOnce({
        code: '42501',
        message: 'new row violates row-level security policy',
      })
      .mockResolvedValueOnce(undefined)

    expect(await activarPush('usuario-1')).toBe('activadas')

    expect(ajena.unsubscribe).toHaveBeenCalledOnce()
    expect(vi.mocked(guardarSuscripcion).mock.calls.map(([, { endpoint }]) => endpoint)).toEqual([
      'https://fcm.googleapis.com/fcm/send/de-otra-persona',
      'https://fcm.googleapis.com/fcm/send/nueva-1',
    ])
  })

  it('RF-31: si guardar falla por la red, no toca la suscripción del navegador y lanza el error', async () => {
    const actual = suscripcionDelNavegador('https://fcm.googleapis.com/fcm/send/actual')
    simularNavegador({ permiso: 'granted', actual })
    vi.mocked(guardarSuscripcion).mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(activarPush('usuario-1')).rejects.toThrow('Failed to fetch')
    expect(actual.unsubscribe).not.toHaveBeenCalled()
  })

  it('decisión 45: desactivar cancela en el navegador aunque no haya red; la fila queda para el 410', async () => {
    const actual = suscripcionDelNavegador('https://fcm.googleapis.com/fcm/send/actual')
    simularNavegador({ permiso: 'granted', actual })
    vi.mocked(borrarSuscripcion).mockRejectedValue(new TypeError('Failed to fetch'))

    expect(await desactivarPush()).toBe('desactivadas')

    expect(actual.unsubscribe).toHaveBeenCalledOnce()
    expect(borrarSuscripcion).toHaveBeenCalledExactlyOnceWith(
      'https://fcm.googleapis.com/fcm/send/actual',
    )
  })

  it('RF-31: sin service worker (npm run dev) no espera para siempre', async () => {
    simularNavegador({ permiso: 'granted' })
    navigator.serviceWorker.getRegistration = async () => undefined
    navigator.serviceWorker.ready = new Promise(() => {})

    expect(await estadoDelPush()).toBe('no-disponible')
    expect(await desactivarPush()).toBe('desactivadas')
    expect(borrarSuscripcion).not.toHaveBeenCalled()
  })

  it('RF-31: desactivar sin suscripción no hace nada', async () => {
    simularNavegador({ permiso: 'granted' })

    expect(await desactivarPush()).toBe('desactivadas')
    expect(borrarSuscripcion).not.toHaveBeenCalled()
  })
})
