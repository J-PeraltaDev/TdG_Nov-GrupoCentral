import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { contarAvisosSinLeer } from '../core/supabase/repositorios/avisos.js'
import { contarBandeja } from '../core/supabase/repositorios/novedades.js'
import { contarSolicitudesPendientes } from '../core/supabase/repositorios/recuperacion.js'
import { pedirConteoDeInsignias } from './insignias.js'
import { useInsignias } from './useInsignias.js'

// Se simulan los repositorios, nunca la red, y el monitor de conexión.
vi.mock('../core/supabase/repositorios/recuperacion.js', () => ({
  contarSolicitudesPendientes: vi.fn(),
}))
vi.mock('../core/supabase/repositorios/avisos.js', () => ({ contarAvisosSinLeer: vi.fn() }))
vi.mock('../core/supabase/repositorios/novedades.js', () => ({ contarBandeja: vi.fn() }))
const conexion = vi.hoisted(() => ({ enLinea: true, oyentes: new Set() }))
vi.mock('../core/conexion/monitor.js', () => ({
  estaEnLinea: () => conexion.enLinea,
  suscribir: (oyente) => {
    conexion.oyentes.add(oyente)
    return () => conexion.oyentes.delete(oyente)
  },
}))

const REPORTANTE = { id: 'u-1', rol_id: 1, area_id: null }
const APROBADOR = { id: 'u-2', rol_id: 2, area_id: 'area-s' }
const DIRECTOR = { id: 'u-3', rol_id: 3, area_id: null }
const ADMINISTRADOR = { id: 'u-4', rol_id: 4, area_id: null }

const solicitudes = vi.mocked(contarSolicitudesPendientes)
const avisos = vi.mocked(contarAvisosSinLeer)
const bandeja = vi.mocked(contarBandeja)

/** Deja que se resuelvan las promesas pendientes, con los temporizadores simulados. */
const asentar = () => act(() => vi.advanceTimersByTimeAsync(0))

function cambiarConexion(enLinea) {
  conexion.enLinea = enLinea
  act(() => conexion.oyentes.forEach((oyente) => oyente()))
}

beforeEach(() => {
  conexion.enLinea = true
  solicitudes.mockResolvedValue(2)
  avisos.mockResolvedValue(3)
  bandeja.mockResolvedValue(5)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('Insignias del menú y de la campana (RF-30 / CU-30 3, RF-02)', () => {
  it.each([
    ['reportante', REPORTANTE],
    ['director', DIRECTOR],
  ])('RF-30: el %s recibe cuántos avisos tiene sin leer', async (_, perfil) => {
    const { result } = renderHook(() => useInsignias(perfil))

    expect(result.current).toEqual({})
    await waitFor(() => expect(result.current).toEqual({ '/avisos': 3 }))
    expect(solicitudes).not.toHaveBeenCalled()
    expect(bandeja).not.toHaveBeenCalled()
  })

  it('RF-30 (decisión 34): el aprobador recibe también las novedades por atender de su área', async () => {
    const { result } = renderHook(() => useInsignias(APROBADOR))

    await waitFor(() => expect(result.current).toEqual({ '/avisos': 3, '/bandeja': 5 }))
    expect(bandeja).toHaveBeenCalledWith({ areaId: 'area-s', estados: ['asignada', 'aprobada'] })
  })

  it('RF-02: el administrador recibe además cuántas solicitudes esperan un código', async () => {
    const { result } = renderHook(() => useInsignias(ADMINISTRADOR))

    await waitFor(() => expect(result.current).toEqual({ '/avisos': 3, '/recuperacion': 2 }))
  })

  it('SDD 6.1.6: cuenta de nuevo cuando una pantalla lo pide (después de una acción propia)', async () => {
    const { result } = renderHook(() => useInsignias(ADMINISTRADOR))
    await waitFor(() => expect(result.current['/avisos']).toBe(3))

    avisos.mockResolvedValue(0)
    solicitudes.mockResolvedValue(1)
    act(() => pedirConteoDeInsignias())

    await waitFor(() => expect(result.current).toEqual({ '/avisos': 0, '/recuperacion': 1 }))
  })

  it('cuenta de nuevo cada minuto', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useInsignias(REPORTANTE))
    await asentar()
    expect(avisos).toHaveBeenCalledTimes(1)

    avisos.mockResolvedValue(4)
    await act(() => vi.advanceTimersByTimeAsync(59_000))
    expect(avisos).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(1_000))

    expect(avisos).toHaveBeenCalledTimes(2)
    expect(result.current).toEqual({ '/avisos': 4 })
  })

  it('con la aplicación oculta o sin conexión (según el monitor) no consulta; al volver, cuenta', async () => {
    vi.useFakeTimers()
    renderHook(() => useInsignias(REPORTANTE))
    await asentar()

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    await act(() => vi.advanceTimersByTimeAsync(180_000))
    expect(avisos).toHaveBeenCalledTimes(1)

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await asentar()
    expect(avisos).toHaveBeenCalledTimes(2)

    cambiarConexion(false)
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(avisos).toHaveBeenCalledTimes(2)

    cambiarConexion(true)
    await asentar()
    expect(avisos).toHaveBeenCalledTimes(3)
  })

  it('si una cuenta falla, conserva la anterior', async () => {
    const { result } = renderHook(() => useInsignias(ADMINISTRADOR))
    await waitFor(() => expect(result.current).toEqual({ '/avisos': 3, '/recuperacion': 2 }))

    solicitudes.mockRejectedValue(new TypeError('Failed to fetch'))
    avisos.mockResolvedValue(1)
    act(() => pedirConteoDeInsignias())

    await waitFor(() => expect(result.current).toEqual({ '/avisos': 1, '/recuperacion': 2 }))
  })

  it('RF-03: si deja de ser administrador con la aplicación abierta, pierde lo que no es suyo', async () => {
    const { result, rerender } = renderHook(({ perfil }) => useInsignias(perfil), {
      initialProps: { perfil: ADMINISTRADOR },
    })
    await waitFor(() => expect(result.current).toEqual({ '/avisos': 3, '/recuperacion': 2 }))

    rerender({ perfil: { ...ADMINISTRADOR, rol_id: 3 } })

    expect(result.current).toEqual({})
    await waitFor(() => expect(result.current).toEqual({ '/avisos': 3 }))
  })

  it('al salir de la aplicación deja de contar', async () => {
    vi.useFakeTimers()
    const { unmount } = renderHook(() => useInsignias(REPORTANTE))
    await asentar()

    unmount()
    pedirConteoDeInsignias()
    cambiarConexion(true)
    await vi.advanceTimersByTimeAsync(120_000)

    expect(avisos).toHaveBeenCalledTimes(1)
  })
})
