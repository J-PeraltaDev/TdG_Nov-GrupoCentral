import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ROL } from '../core/sesion/roles.js'
import { contarSolicitudesPendientes } from '../core/supabase/repositorios/recuperacion.js'
import { pedirConteoDeInsignias } from './insignias.js'
import { useInsignias } from './useInsignias.js'

// Se simula el repositorio, nunca la red.
vi.mock('../core/supabase/repositorios/recuperacion.js', () => ({
  contarSolicitudesPendientes: vi.fn(),
}))

const contar = vi.mocked(contarSolicitudesPendientes)

/** Deja que se resuelvan las promesas pendientes, con los temporizadores simulados. */
const asentar = () => act(() => vi.advanceTimersByTimeAsync(0))

function conVisibilidad(estado) {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(estado)
}

beforeEach(() => {
  contar.mockResolvedValue(2)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('Insignias del menú (RF-02, decisión 28 del plan del Sprint 3)', () => {
  it('el administrador recibe cuántas solicitudes esperan un código', async () => {
    const { result } = renderHook(() => useInsignias(ROL.ADMINISTRADOR))

    expect(result.current).toEqual({})
    await waitFor(() => expect(result.current).toEqual({ '/recuperacion': 2 }))
  })

  it.each([ROL.REPORTANTE, ROL.APROBADOR_AREA, ROL.DIRECTOR_AGRICULTURA])(
    'RNF-11: el rol %i no tiene insignias ni consulta nada',
    (rol) => {
      const { result } = renderHook(() => useInsignias(rol))

      expect(result.current).toEqual({})
      expect(contar).not.toHaveBeenCalled()
    },
  )

  it('cuenta de nuevo cuando una pantalla lo pide', async () => {
    const { result } = renderHook(() => useInsignias(ROL.ADMINISTRADOR))
    await waitFor(() => expect(result.current).toEqual({ '/recuperacion': 2 }))

    contar.mockResolvedValue(1)
    act(() => pedirConteoDeInsignias())

    await waitFor(() => expect(result.current).toEqual({ '/recuperacion': 1 }))
  })

  it('cuenta de nuevo cada minuto: es la única señal de que llegó una solicitud', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useInsignias(ROL.ADMINISTRADOR))
    await asentar()
    expect(contar).toHaveBeenCalledTimes(1)

    contar.mockResolvedValue(3)
    await act(() => vi.advanceTimersByTimeAsync(59_000))
    expect(contar).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(1_000))

    expect(contar).toHaveBeenCalledTimes(2)
    expect(result.current).toEqual({ '/recuperacion': 3 })
  })

  it('con la aplicación oculta o sin conexión no consulta; al volver, cuenta', async () => {
    vi.useFakeTimers()
    renderHook(() => useInsignias(ROL.ADMINISTRADOR))
    await asentar()

    conVisibilidad('hidden')
    await act(() => vi.advanceTimersByTimeAsync(180_000))
    expect(contar).toHaveBeenCalledTimes(1)

    conVisibilidad('visible')
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await asentar()
    expect(contar).toHaveBeenCalledTimes(2)

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(contar).toHaveBeenCalledTimes(2)

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    act(() => window.dispatchEvent(new Event('online')))
    await asentar()
    expect(contar).toHaveBeenCalledTimes(3)
  })

  it('si la cuenta falla, conserva la anterior', async () => {
    const { result } = renderHook(() => useInsignias(ROL.ADMINISTRADOR))
    await waitFor(() => expect(result.current).toEqual({ '/recuperacion': 2 }))

    contar.mockRejectedValue(new TypeError('Failed to fetch'))
    act(() => pedirConteoDeInsignias())
    await waitFor(() => expect(contar).toHaveBeenCalledTimes(2))

    expect(result.current).toEqual({ '/recuperacion': 2 })
  })

  it('RF-03: si deja de ser administrador con la aplicación abierta, se queda sin insignias', async () => {
    const { result, rerender } = renderHook(({ rol }) => useInsignias(rol), {
      initialProps: { rol: ROL.ADMINISTRADOR },
    })
    await waitFor(() => expect(result.current).toEqual({ '/recuperacion': 2 }))

    rerender({ rol: ROL.DIRECTOR_AGRICULTURA })

    expect(result.current).toEqual({})
    act(() => pedirConteoDeInsignias())
    expect(contar).toHaveBeenCalledTimes(1)
  })

  it('al salir de la aplicación deja de contar', async () => {
    vi.useFakeTimers()
    const { unmount } = renderHook(() => useInsignias(ROL.ADMINISTRADOR))
    await asentar()

    unmount()
    pedirConteoDeInsignias()
    await vi.advanceTimersByTimeAsync(120_000)

    expect(contar).toHaveBeenCalledTimes(1)
  })
})
