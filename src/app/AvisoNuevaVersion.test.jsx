import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AvisoNuevaVersion } from './AvisoNuevaVersion.jsx'

const registro = vi.hoisted(() => ({
  hayVersionNueva: false,
  setHayVersionNueva: vi.fn(),
  updateServiceWorker: vi.fn(),
}))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [registro.hayVersionNueva, registro.setHayVersionNueva],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: registro.updateServiceWorker,
  }),
}))

describe('Aviso de nueva versión (C-04, service worker con registerType «prompt»)', () => {
  beforeEach(() => {
    registro.hayVersionNueva = false
  })

  it('no muestra nada mientras no haya una versión nueva', () => {
    render(<AvisoNuevaVersion />)

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('avisa que hay una versión nueva y la activa solo al pulsar «Actualizar»', async () => {
    registro.hayVersionNueva = true
    render(<AvisoNuevaVersion />)

    expect(screen.getByRole('status')).toHaveTextContent('Hay una versión nueva de la aplicación')
    expect(registro.updateServiceWorker).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }))

    expect(registro.updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('«Ahora no» cierra el aviso sin actualizar', async () => {
    registro.hayVersionNueva = true
    render(<AvisoNuevaVersion />)

    await userEvent.click(screen.getByRole('button', { name: 'Ahora no' }))

    expect(registro.setHayVersionNueva).toHaveBeenCalledWith(false)
    expect(registro.updateServiceWorker).not.toHaveBeenCalled()
  })
})
