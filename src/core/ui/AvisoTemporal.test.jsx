import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AvisoTemporal, DURACION_DEL_AVISO_MS } from './AvisoTemporal.jsx'

describe('Aviso temporal (Figma 3:1276 y 13-B)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('RF-10: una confirmación se anuncia sin interrumpir (status)', () => {
    render(<AvisoTemporal>Novedad tomada. Ya está En atención.</AvisoTemporal>)

    expect(screen.getByRole('status')).toHaveTextContent('Novedad tomada. Ya está En atención.')
    expect(screen.getByRole('status')).toHaveAttribute('data-aviso-temporal', 'exito')
  })

  it('RF-25: un error se anuncia de inmediato (alert) y ofrece su acción', async () => {
    const alPulsar = vi.fn()
    render(
      <AvisoTemporal tipo="error" accion={{ texto: 'Reintentar', alPulsar }}>
        No se aplicó: se perdió la conexión. La novedad sigue En atención.
      </AvisoTemporal>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se aplicó: se perdió la conexión. La novedad sigue En atención.',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(alPulsar).toHaveBeenCalledOnce()
  })

  it('la confirmación se quita sola cuando cumple su tiempo', () => {
    vi.useFakeTimers()
    const alTerminar = vi.fn()
    render(<AvisoTemporal alTerminar={alTerminar}>Novedad tomada.</AvisoTemporal>)

    act(() => vi.advanceTimersByTime(DURACION_DEL_AVISO_MS - 1))
    expect(alTerminar).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(alTerminar).toHaveBeenCalledOnce()
  })

  it('el error no se quita solo: espera a que la persona actúe', () => {
    vi.useFakeTimers()
    const alTerminar = vi.fn()
    render(
      <AvisoTemporal tipo="error" alTerminar={alTerminar}>
        No se aplicó.
      </AvisoTemporal>,
    )

    act(() => vi.advanceTimersByTime(DURACION_DEL_AVISO_MS * 10))

    expect(alTerminar).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeVisible()
  })

  it('si se desmonta antes de tiempo, no avisa después', () => {
    vi.useFakeTimers()
    const alTerminar = vi.fn()
    const { unmount } = render(<AvisoTemporal alTerminar={alTerminar}>Listo.</AvisoTemporal>)

    unmount()
    act(() => vi.advanceTimersByTime(DURACION_DEL_AVISO_MS))

    expect(alTerminar).not.toHaveBeenCalled()
  })
})
