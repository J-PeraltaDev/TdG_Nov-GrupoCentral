import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { guardarMeta, leerMeta } from '../../core/offline/bd.js'
import { activarPush, estadoDelPush } from '../../core/push/suscripcion.js'
import { HojaActivarNotificaciones } from './HojaActivarNotificaciones.jsx'

vi.mock('../../core/push/suscripcion.js', () => ({
  estadoDelPush: vi.fn(),
  activarPush: vi.fn(),
}))
vi.mock('../../core/offline/bd.js', () => ({
  leerMeta: vi.fn(),
  guardarMeta: vi.fn().mockResolvedValue(undefined),
}))

const REPORTANTE = { id: 'u-1', rol_id: 1 }
const APROBADOR = { id: 'u-2', rol_id: 2 }

const hoja = () => screen.queryByRole('dialog', { name: 'Activa las notificaciones' })

beforeEach(() => {
  vi.stubGlobal('Notification', { permission: 'default' })
  vi.mocked(estadoDelPush).mockReset().mockResolvedValue('desactivadas')
  vi.mocked(leerMeta).mockReset().mockResolvedValue(undefined)
  vi.mocked(activarPush).mockReset().mockResolvedValue('activadas')
  vi.mocked(guardarMeta).mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('10-B · Activa las notificaciones (RF-31; decisión 44)', () => {
  it('RF-31: la primera vez en el dispositivo, con el texto del reportante', async () => {
    render(<HojaActivarNotificaciones perfil={REPORTANTE} />)

    expect(await screen.findByRole('dialog', { name: 'Activa las notificaciones' })).toBeVisible()
    expect(
      screen.getByText(
        'Te avisaremos en este teléfono cuando tu novedad cambie de estado, aunque la app esté cerrada.',
      ),
    ).toBeVisible()
    expect(screen.getByText('Puedes cambiarlo después en Cuenta.')).toBeVisible()
  })

  it('decisión 44: los demás roles leen que es por las novedades que atienden', async () => {
    render(<HojaActivarNotificaciones perfil={APROBADOR} />)

    expect(
      await screen.findByText(
        'Te avisaremos en este dispositivo cuando cambie una novedad que atiendes, aunque la app esté cerrada.',
      ),
    ).toBeVisible()
  })

  it.each([
    ['ya se ofreció', () => vi.mocked(leerMeta).mockResolvedValue(true)],
    [
      'el navegador no lo admite',
      () => vi.mocked(estadoDelPush).mockResolvedValue('no-disponible'),
    ],
    ['ya están activadas', () => vi.mocked(estadoDelPush).mockResolvedValue('activadas')],
    ['el permiso ya se negó', () => vi.mocked(estadoDelPush).mockResolvedValue('bloqueadas')],
    ['el permiso ya se dio', () => vi.stubGlobal('Notification', { permission: 'granted' })],
  ])('RF-31: no sale si %s', async (_, preparar) => {
    preparar()
    render(<HojaActivarNotificaciones perfil={REPORTANTE} />)

    await waitFor(() => expect(estadoDelPush).toHaveBeenCalled())
    await new Promise((listo) => setTimeout(listo, 0))
    expect(hoja()).toBeNull()
  })

  it('RF-31: «Ahora no» la cierra y no vuelve a preguntar en este dispositivo', async () => {
    render(<HojaActivarNotificaciones perfil={REPORTANTE} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Ahora no' }))

    expect(hoja()).toBeNull()
    expect(guardarMeta).toHaveBeenCalledWith('push-ofrecida', true)
    expect(activarPush).not.toHaveBeenCalled()
  })

  it('RF-31 / CU-31: «Activar notificaciones» pide el permiso con el toque y suscribe', async () => {
    render(<HojaActivarNotificaciones perfil={REPORTANTE} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Activar notificaciones' }))

    expect(activarPush).toHaveBeenCalledExactlyOnceWith('u-1')
    await waitFor(() => expect(hoja()).toBeNull())
    expect(guardarMeta).toHaveBeenCalledWith('push-ofrecida', true)
  })

  it('RF-31: si no se pudo guardar, lo dice y deja reintentar', async () => {
    vi.mocked(activarPush).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    render(<HojaActivarNotificaciones perfil={REPORTANTE} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Activar notificaciones' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron activar. Revisa la conexión e intenta de nuevo.',
    )
    expect(screen.getByRole('button', { name: 'Activar notificaciones' })).toBeEnabled()
  })
})
