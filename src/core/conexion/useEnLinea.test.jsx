import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useEnLinea } from './useEnLinea.js'

function cambiarConexion(enLinea) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(enLinea)
  window.dispatchEvent(new Event(enLinea ? 'online' : 'offline'))
}

describe('useEnLinea · eventos de conexión del navegador (RF-23)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('parte del estado que informa el navegador', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)

    const { result } = renderHook(() => useEnLinea())

    expect(result.current).toBe(false)
  })

  it('cambia cuando el navegador pierde y recupera la conexión', () => {
    const { result } = renderHook(() => useEnLinea())
    expect(result.current).toBe(true)

    act(() => cambiarConexion(false))
    expect(result.current).toBe(false)

    act(() => cambiarConexion(true))
    expect(result.current).toBe(true)
  })
})
