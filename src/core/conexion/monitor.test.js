import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as monitor from './monitor.js'

/*
 * El monitor es uno solo para toda la aplicación (estado de módulo): después de cada prueba se
 * deja como recién abierto, con una respuesta del servidor.
 */

function navegadorEnLinea(enLinea) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(enLinea)
}

function pestanaVisible(visible) {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(visible ? 'visible' : 'hidden')
}

describe('Monitor de conexión (RF-23 / CU-23 1, SDD 6.1.5)', () => {
  let respuestas

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://proyecto.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_de_prueba')
    navegadorEnLinea(true)
    pestanaVisible(true)
    respuestas = []
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, { signal }) => {
        const siguiente = respuestas.shift() ?? 'falla'
        if (siguiente === 'ok') return Promise.resolve(new Response('{}', { status: 200 }))
        if (siguiente === 'lenta') {
          return new Promise((_resolver, rechazar) =>
            signal.addEventListener('abort', () => rechazar(new DOMException('', 'AbortError'))),
          )
        }
        return Promise.reject(new TypeError('Failed to fetch'))
      }),
    )
  })

  afterEach(() => {
    monitor.informarRespuesta()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('RF-23 / CU-23 1: parte de lo que dice el navegador', async () => {
    navegadorEnLinea(false)
    expect(monitor.estaEnLinea()).toBe(false)
  })

  it('RF-23 / CU-23 1: un fallo de red de una solicitud lo pasa a sin conexión aunque el navegador diga que hay', async () => {
    const oyente = vi.fn()
    monitor.suscribir(oyente)

    monitor.informarFalloDeRed()

    expect(monitor.estaEnLinea()).toBe(false)
    expect(oyente).toHaveBeenCalledTimes(1)
  })

  it('RF-23: una respuesta del servidor lo devuelve a en línea', async () => {
    monitor.informarFalloDeRed()

    monitor.informarRespuesta()

    expect(monitor.estaEnLinea()).toBe(true)
  })

  it('RF-23: sin conexión verifica cada 15 s y vuelve cuando el servidor responde', async () => {
    respuestas.push('falla', 'ok')
    monitor.informarFalloDeRed()

    await vi.advanceTimersByTimeAsync(15_000)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(monitor.estaEnLinea()).toBe(false)

    await vi.advanceTimersByTimeAsync(15_000)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(monitor.estaEnLinea()).toBe(true)

    // Ya en línea, no verifica más.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('RF-23: verifica contra Auth con la clave publicable, sin caché', async () => {
    monitor.informarFalloDeRed()

    await vi.advanceTimersByTimeAsync(15_000)

    const [url, opciones] = fetch.mock.calls[0]
    expect(url).toMatch(/\/auth\/v1\/health$/)
    expect(opciones.headers.apikey).toBeTruthy()
    expect(opciones.cache).toBe('no-store')
  })

  it('RF-23: una respuesta que tarda más de 5 s cuenta como sin conexión (señal débil)', async () => {
    respuestas.push('lenta')
    monitor.informarFalloDeRed()

    await vi.advanceTimersByTimeAsync(15_000 + 5_000)

    expect(monitor.estaEnLinea()).toBe(false)
  })

  it('RF-23: con la pestaña oculta no verifica; al volver a ella, sí', async () => {
    pestanaVisible(false)
    monitor.informarFalloDeRed()

    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetch).not.toHaveBeenCalled()

    pestanaVisible(true)
    respuestas.push('ok')
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(monitor.estaEnLinea()).toBe(true)
  })

  it('RF-23: si el navegador dice que no hay red, no gasta verificaciones', async () => {
    monitor.informarFalloDeRed()
    navegadorEnLinea(false)
    window.dispatchEvent(new Event('offline'))

    await vi.advanceTimersByTimeAsync(60_000)

    expect(fetch).not.toHaveBeenCalled()
    expect(monitor.estaEnLinea()).toBe(false)
  })

  it('RF-23: cuando el navegador recupera la red después de un fallo, verifica de inmediato', async () => {
    monitor.informarFalloDeRed()
    navegadorEnLinea(false)
    window.dispatchEvent(new Event('offline'))

    navegadorEnLinea(true)
    respuestas.push('ok')
    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(0)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(monitor.estaEnLinea()).toBe(true)
  })

  it('RF-23: avisa a los suscriptores cuando el navegador pierde o recupera la red', async () => {
    const oyente = vi.fn()
    const dejar = monitor.suscribir(oyente)

    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('online'))
    expect(oyente).toHaveBeenCalledTimes(2)

    dejar()
    window.dispatchEvent(new Event('offline'))
    expect(oyente).toHaveBeenCalledTimes(2)
  })
})
