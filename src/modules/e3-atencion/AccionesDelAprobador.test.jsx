import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ACCION } from '../../core/acciones/accionesDisponibles.js'
import { tomarNovedad } from '../../core/supabase/repositorios/novedades.js'
import AccionesDelAprobador from './AccionesDelAprobador.jsx'

vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  tomarNovedad: vi.fn(),
}))

const ASIGNADA = { id: 'n-153', estado: 'asignada' }
// Lo que la Tabla 35 le permite al aprobador en cada estado.
const EN_ASIGNADA = [ACCION.TOMAR, ACCION.REASIGNAR, ACCION.RECHAZAR]
const EN_ATENCION = [ACCION.REGISTRAR_SOLUCION, ACCION.ESCALAR, ACCION.REASIGNAR, ACCION.RECHAZAR]

function pintar(props = {}) {
  const alCambiar = vi.fn()
  const utilidades = render(
    <AccionesDelAprobador
      novedad={ASIGNADA}
      acciones={EN_ASIGNADA}
      alCambiar={alCambiar}
      esEscritorio={false}
      {...props}
    />,
  )
  return { alCambiar, ...utilidades }
}

const tomar = () => screen.getByRole('button', { name: 'Tomar para atención' })
const barra = () => document.querySelector('[data-barra-de-acciones]')

describe('Acciones del aprobador en el detalle (RF-10 / CU-10, Figma 13, 13-B y 14-C)', () => {
  beforeEach(() => {
    vi.mocked(tomarNovedad).mockReset()
  })

  it('RF-10 / CU-10 1: en una novedad asignada ofrece tomarla, en la barra de acciones', () => {
    pintar()

    expect(tomar()).toBeEnabled()
    expect(barra()).toContainElement(tomar())
  })

  it('RF-10 / CU-10 2 y 3: al tomarla llama a la función, avisa y recarga el detalle', async () => {
    vi.mocked(tomarNovedad).mockResolvedValue({ id: 'n-153', estado: 'en_atencion' })
    const { alCambiar } = pintar()

    await userEvent.click(tomar())

    expect(tomarNovedad).toHaveBeenCalledExactlyOnceWith('n-153')
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Novedad tomada. Ya está En atención.',
    )
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-10: mientras la toma, el botón no admite otro toque', async () => {
    let terminar
    vi.mocked(tomarNovedad).mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    pintar()

    await userEvent.click(tomar())

    const ocupado = screen.getByRole('button', { name: 'Tomando…' })
    expect(ocupado).toBeDisabled()
    await userEvent.click(ocupado)
    expect(tomarNovedad).toHaveBeenCalledOnce()

    terminar({ id: 'n-153', estado: 'en_atencion' })
    expect(await screen.findByRole('status')).toBeVisible()
  })

  it('RF-10 / CU-10: si otro aprobador la tomó primero, avisa que cambió de estado y recarga', async () => {
    vi.mocked(tomarNovedad).mockRejectedValue({ code: 'P0001', message: 'TRANSICION_INVALIDA' })
    const { alCambiar } = pintar()

    await userEvent.click(tomar())

    expect(await screen.findByRole('alert')).toHaveTextContent('La novedad cambió de estado.')
    expect(alCambiar).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })

  it('RF-25 / CU-10 2a (14-C): si se pierde la conexión dice que no se aplicó, en qué estado sigue y deja reintentar', async () => {
    vi.mocked(tomarNovedad).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { alCambiar } = pintar()

    await userEvent.click(tomar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se aplicó: se perdió la conexión. La novedad sigue Asignada.',
    )
    // No se recarga ni se reintenta sola: todas las transiciones requieren conexión.
    expect(alCambiar).not.toHaveBeenCalled()
    expect(tomarNovedad).toHaveBeenCalledOnce()
    expect(tomar()).toBeEnabled()

    vi.mocked(tomarNovedad).mockResolvedValue({ id: 'n-153', estado: 'en_atencion' })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Novedad tomada.')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(tomarNovedad).toHaveBeenCalledTimes(2)
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RNF-11: si el servidor niega el permiso, muestra su mensaje y no recarga', async () => {
    vi.mocked(tomarNovedad).mockRejectedValue({ code: 'P0001', message: 'SIN_PERMISO' })
    const { alCambiar } = pintar()

    await userEvent.click(tomar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tienes permiso para esta acción.',
    )
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('si la sesión venció, lo dice', async () => {
    vi.mocked(tomarNovedad).mockRejectedValue({ status: 401, message: 'JWT expired' })
    pintar()

    await userEvent.click(tomar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu sesión venció. Ingresa de nuevo.',
    )
  })

  it('RF-18 / CU-18 5: sin acciones construidas para el estado no hay barra ni botones', () => {
    pintar({ novedad: { id: 'n-153', estado: 'en_atencion' }, acciones: EN_ATENCION })

    expect(barra()).toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('RF-18: no ofrece una acción que el mapa no le da, aunque sepa ejecutarla', () => {
    pintar({ novedad: { id: 'n-153', estado: 'escalada' }, acciones: [] })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('RF-10: después de tomarla conserva el aviso aunque ya no queden acciones', async () => {
    vi.mocked(tomarNovedad).mockResolvedValue({ id: 'n-153', estado: 'en_atencion' })
    const { rerender } = pintar()
    await userEvent.click(tomar())
    await screen.findByRole('status')

    // El detalle se recarga y la novedad llega en atención.
    rerender(
      <AccionesDelAprobador
        novedad={{ id: 'n-153', estado: 'en_atencion' }}
        acciones={EN_ATENCION}
        alCambiar={() => {}}
        esEscritorio={false}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Novedad tomada. Ya está En atención.')
    expect(barra()).toBeNull()
  })

  it('en el escritorio la acción es un botón bajo el encabezado, sin barra fija', async () => {
    vi.mocked(tomarNovedad).mockResolvedValue({ id: 'n-153', estado: 'en_atencion' })
    pintar({ esEscritorio: true })

    expect(barra()).toBeNull()
    await userEvent.click(tomar())

    expect(await screen.findByRole('status')).toHaveTextContent('Novedad tomada.')
  })
})
