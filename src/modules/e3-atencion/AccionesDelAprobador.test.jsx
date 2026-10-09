import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ACCION } from '../../core/acciones/accionesDisponibles.js'
import { rechazarNovedad, tomarNovedad } from '../../core/supabase/repositorios/novedades.js'
import AccionesDelAprobador from './AccionesDelAprobador.jsx'

vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  tomarNovedad: vi.fn(),
  rechazarNovedad: vi.fn(),
}))

const ASIGNADA = { id: 'n-153', estado: 'asignada' }
const ATENDIDA = { id: 'n-153', estado: 'en_atencion' }
const APROBADA = { id: 'n-153', estado: 'aprobada' }
// Lo que la Tabla 35 le permite al aprobador en cada estado.
const EN_ASIGNADA = [ACCION.TOMAR, ACCION.REASIGNAR, ACCION.RECHAZAR]
const EN_ATENCION = [ACCION.REGISTRAR_SOLUCION, ACCION.ESCALAR, ACCION.REASIGNAR, ACCION.RECHAZAR]
const EN_APROBADA = [ACCION.REGISTRAR_SOLUCION]

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
const rechazar = () => screen.getByRole('button', { name: 'Rechazar' })
const barra = () => document.querySelector('[data-barra-de-acciones]')
const motivo = () => screen.getByRole('textbox', { name: 'Motivo del rechazo' })
const confirmarRechazo = () => screen.getByRole('button', { name: 'Rechazar novedad' })

/** Abre la hoja, escribe el motivo y confirma. */
async function rechazarCon(texto) {
  await userEvent.click(rechazar())
  await userEvent.type(motivo(), texto)
  await userEvent.click(confirmarRechazo())
}

describe('Acciones del aprobador en el detalle (RF-10 / CU-10, Figma 13, 13-B y 14-C)', () => {
  beforeEach(() => {
    vi.mocked(tomarNovedad).mockReset()
    vi.mocked(rechazarNovedad).mockReset()
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
    pintar({ novedad: APROBADA, acciones: EN_APROBADA })

    expect(barra()).toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('RF-18: no ofrece una acción que el mapa no le da, aunque sepa ejecutarla', () => {
    pintar({ novedad: { id: 'n-153', estado: 'escalada' }, acciones: [] })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('RF-10: después de tomarla conserva el aviso y ofrece las acciones de una novedad en atención', async () => {
    vi.mocked(tomarNovedad).mockResolvedValue({ id: 'n-153', estado: 'en_atencion' })
    const { rerender } = pintar()
    await userEvent.click(tomar())
    await screen.findByRole('status')

    // El detalle se recarga y la novedad llega en atención.
    rerender(
      <AccionesDelAprobador
        novedad={ATENDIDA}
        acciones={EN_ATENCION}
        alCambiar={() => {}}
        esEscritorio={false}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Novedad tomada. Ya está En atención.')
    expect(screen.queryByRole('button', { name: 'Tomar para atención' })).not.toBeInTheDocument()
    expect(barra()).toContainElement(rechazar())
  })

  it('en el escritorio las acciones son botones bajo el encabezado, sin barra fija', async () => {
    vi.mocked(tomarNovedad).mockResolvedValue({ id: 'n-153', estado: 'en_atencion' })
    pintar({ esEscritorio: true })

    expect(barra()).toBeNull()
    expect(rechazar()).toBeEnabled()
    await userEvent.click(tomar())

    expect(await screen.findByRole('status')).toHaveTextContent('Novedad tomada.')
  })
})

describe('Rechazar desde el detalle (RF-11 / CU-11, Figma 16)', () => {
  beforeEach(() => {
    vi.mocked(tomarNovedad).mockReset()
    vi.mocked(rechazarNovedad).mockReset()
  })

  it.each([
    ['asignada', ASIGNADA, EN_ASIGNADA],
    ['en atención', ATENDIDA, EN_ATENCION],
  ])('RF-11 / CU-11 1: una novedad %s se puede rechazar', (_, novedad, acciones) => {
    pintar({ novedad, acciones })

    expect(barra()).toContainElement(rechazar())
    expect(rechazar()).toBeEnabled()
  })

  it('RF-11 / CU-11 1 y 2: «Rechazar» abre la hoja que pide el motivo, sin rechazar todavía', async () => {
    pintar()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(rechazar())

    expect(screen.getByRole('dialog', { name: 'Rechazar novedad' })).toBeVisible()
    expect(confirmarRechazo()).toBeDisabled()
    expect(rechazarNovedad).not.toHaveBeenCalled()
  })

  it('RF-11 / CU-11 3 a 6: al confirmar llama a la función con el motivo, cierra la hoja, avisa y recarga', async () => {
    vi.mocked(rechazarNovedad).mockResolvedValue({ id: 'n-153', estado: 'rechazada' })
    const { alCambiar } = pintar()

    await rechazarCon('Duplicada: ya está como NOV-0149.')

    expect(rechazarNovedad).toHaveBeenCalledExactlyOnceWith(
      'n-153',
      'Duplicada: ya está como NOV-0149.',
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Novedad rechazada. La finca verá el motivo.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-11: mientras rechaza, la hoja dice «Rechazando…» y «Tomar para atención» no cambia de texto', async () => {
    let terminar
    vi.mocked(rechazarNovedad).mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    pintar()

    await rechazarCon('Duplicada')

    expect(screen.getByRole('button', { name: 'Rechazando…' })).toBeDisabled()
    // El diálogo modal deja lo demás fuera del árbol de accesibilidad: se busca por su texto.
    expect(screen.getByText('Tomar para atención').closest('button')).toBeDisabled()
    expect(screen.queryByText('Tomando…')).not.toBeInTheDocument()

    terminar({ id: 'n-153', estado: 'rechazada' })
    expect(await screen.findByRole('status')).toBeVisible()
  })

  it('RF-11: «Cancelar» cierra la hoja sin rechazar y devuelve el foco al botón', async () => {
    const { alCambiar } = pintar()
    await userEvent.click(rechazar())
    await userEvent.type(motivo(), 'Duplicada')

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(rechazarNovedad).not.toHaveBeenCalled()
    expect(alCambiar).not.toHaveBeenCalled()
    expect(rechazar()).toHaveFocus()

    // Al abrirla de nuevo, el motivo empieza en blanco.
    await userEvent.click(rechazar())
    expect(motivo()).toHaveValue('')
  })

  it('RF-25 / CU-11 1a (14-C): si se pierde la conexión cierra la hoja, dice que no se aplicó y «Reintentar» envía el mismo motivo', async () => {
    vi.mocked(rechazarNovedad).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { alCambiar } = pintar({ novedad: ATENDIDA, acciones: EN_ATENCION })

    await rechazarCon('Es una solicitud de insumos')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se aplicó: se perdió la conexión. La novedad sigue En atención.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).not.toHaveBeenCalled()

    vi.mocked(rechazarNovedad).mockResolvedValue({ id: 'n-153', estado: 'rechazada' })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Novedad rechazada.')
    expect(rechazarNovedad).toHaveBeenCalledTimes(2)
    expect(rechazarNovedad).toHaveBeenLastCalledWith('n-153', 'Es una solicitud de insumos')
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-11: si alguien cambió el estado antes, cierra la hoja, avisa y recarga', async () => {
    vi.mocked(rechazarNovedad).mockRejectedValue({ code: 'P0001', message: 'TRANSICION_INVALIDA' })
    const { alCambiar } = pintar()

    await rechazarCon('Duplicada')

    expect(await screen.findByRole('alert')).toHaveTextContent('La novedad cambió de estado.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-11: si el servidor responde DATO_OBLIGATORIO, la hoja sigue abierta y señala el campo', async () => {
    vi.mocked(rechazarNovedad).mockRejectedValue({ code: 'P0001', message: 'DATO_OBLIGATORIO' })
    const { alCambiar } = pintar()

    await rechazarCon('Duplicada')

    expect(await screen.findByRole('dialog', { name: 'Rechazar novedad' })).toBeVisible()
    await vi.waitFor(() => expect(motivo()).toBeInvalid())
    expect(motivo()).toHaveValue('Duplicada')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('RNF-11: si el servidor niega el permiso, cierra la hoja y muestra su mensaje', async () => {
    vi.mocked(rechazarNovedad).mockRejectedValue({ code: 'P0001', message: 'SIN_PERMISO' })
    pintar()

    await rechazarCon('Duplicada')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tienes permiso para esta acción.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('RF-11: una novedad rechazada ya no tiene acciones; el aviso se conserva', async () => {
    vi.mocked(rechazarNovedad).mockResolvedValue({ id: 'n-153', estado: 'rechazada' })
    const { rerender } = pintar()
    await rechazarCon('Duplicada')
    await screen.findByRole('status')

    rerender(
      <AccionesDelAprobador
        novedad={{ id: 'n-153', estado: 'rechazada' }}
        acciones={[]}
        alCambiar={() => {}}
        esEscritorio={false}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Novedad rechazada.')
    expect(barra()).toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
