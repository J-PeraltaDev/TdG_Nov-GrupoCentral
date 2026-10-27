import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { activarPush, desactivarPush, estadoDelPush } from '../../core/push/suscripcion.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import { Cuenta } from './Cuenta.jsx'

vi.mock('../../core/push/suscripcion.js', () => ({
  textoDelFallo: (_error, generico) => generico,
  estadoDelPush: vi.fn(),
  activarPush: vi.fn(),
  desactivarPush: vi.fn(),
}))
vi.mock('../../core/offline/pendientes.js', () => ({ usePendientes: () => 0 }))

const abrir = () => pintarConSesion(<Cuenta />, { ruta: '/cuenta', rol: 'reportante' })
const fila = () => screen.findByText('Notificaciones en este dispositivo')

beforeEach(() => {
  vi.mocked(estadoDelPush).mockReset()
  vi.mocked(activarPush).mockReset()
  vi.mocked(desactivarPush).mockReset()
})

describe('Cuenta · Notificaciones en este dispositivo (RF-31; decisión 44)', () => {
  it('RF-31: con las notificaciones desactivadas, «Activar» las activa', async () => {
    vi.mocked(estadoDelPush).mockResolvedValue('desactivadas')
    vi.mocked(activarPush).mockResolvedValue('activadas')
    abrir()

    await fila()
    expect(screen.getByText('Desactivadas')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Activar' }))

    expect(activarPush).toHaveBeenCalledOnce()
    expect(await screen.findByText('Activadas')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeEnabled()
  })

  it('RF-31: con las notificaciones activadas, «Desactivar» las desactiva', async () => {
    vi.mocked(estadoDelPush).mockResolvedValue('activadas')
    vi.mocked(desactivarPush).mockResolvedValue('desactivadas')
    abrir()

    await fila()
    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }))

    expect(desactivarPush).toHaveBeenCalledOnce()
    expect(await screen.findByText('Desactivadas')).toBeVisible()
  })

  it.each([
    [
      'bloqueadas',
      'Bloqueaste las notificaciones en el navegador. Para activarlas, cámbialo en su configuración.',
    ],
    [
      'no-disponible',
      'Este navegador no permite notificaciones. En iPhone, primero agrega la aplicación a la pantalla de inicio.',
    ],
  ])('decisión 44: %s explica por qué, sin botón', async (estado, texto) => {
    vi.mocked(estadoDelPush).mockResolvedValue(estado)
    abrir()

    await fila()
    expect(screen.getByText(texto)).toBeVisible()
    expect(screen.queryByRole('button', { name: /^(Activar|Desactivar)$/ })).toBeNull()
  })

  it('RF-31: si no se pudo cambiar, lo dice', async () => {
    vi.mocked(estadoDelPush).mockResolvedValue('desactivadas')
    vi.mocked(activarPush).mockRejectedValue(new TypeError('Failed to fetch'))
    abrir()

    await fila()
    await userEvent.click(screen.getByRole('button', { name: 'Activar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cambiar. Revisa la conexión e intenta de nuevo.',
    )
  })
})
