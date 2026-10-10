import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ACCION } from '../../core/acciones/accionesDisponibles.js'
import { alPedirRevisionDelPerfil } from '../../core/sesion/perfilVigente.js'
import { listarAreas } from '../../core/supabase/repositorios/catalogos.js'
import {
  escalarNovedad,
  reasignarNovedad,
  rechazarNovedad,
  tomarNovedad,
} from '../../core/supabase/repositorios/novedades.js'
import AccionesDelAprobador from './AccionesDelAprobador.jsx'

vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  tomarNovedad: vi.fn(),
  rechazarNovedad: vi.fn(),
  escalarNovedad: vi.fn(),
  reasignarNovedad: vi.fn(),
}))
vi.mock('../../core/supabase/repositorios/catalogos.js', () => ({
  listarAreas: vi.fn(),
}))

const ASIGNADA = { id: 'n-153', estado: 'asignada', area_id: 'area-m', area: 'Mantenimiento' }
const ATENDIDA = {
  id: 'n-153',
  estado: 'en_atencion',
  codigo: 150,
  finca: 'Pavarandó',
  prioridad: 'critico',
  area_id: 'area-m',
  area: 'Mantenimiento',
}
const APROBADA = { id: 'n-153', estado: 'aprobada' }
// Lo que la Tabla 35 le permite al aprobador en cada estado.
const EN_ASIGNADA = [ACCION.TOMAR, ACCION.REASIGNAR, ACCION.RECHAZAR]
const EN_ATENCION = [ACCION.REGISTRAR_SOLUCION, ACCION.ESCALAR, ACCION.REASIGNAR, ACCION.RECHAZAR]
const EN_APROBADA = [ACCION.REGISTRAR_SOLUCION]

function pintar(props = {}) {
  const alCambiar = vi.fn()
  const alSalir = vi.fn()
  const utilidades = render(
    <AccionesDelAprobador
      novedad={ASIGNADA}
      acciones={EN_ASIGNADA}
      alCambiar={alCambiar}
      alSalir={alSalir}
      esEscritorio={false}
      {...props}
    />,
    // Las acciones enlazan a la pantalla de la solución: necesitan el enrutador.
    { wrapper: MemoryRouter },
  )
  return { alCambiar, alSalir, ...utilidades }
}

const tomar = () => screen.getByRole('button', { name: 'Tomar para atención' })
const rechazar = () => screen.getByRole('button', { name: 'Rechazar' })
const barra = () => document.querySelector('[data-barra-de-acciones]')
const motivo = () => screen.getByRole('textbox', { name: 'Motivo del rechazo' })
const confirmarRechazo = () => screen.getByRole('button', { name: 'Rechazar novedad' })

const escalar = () => screen.getByRole('button', { name: 'Escalar al director' })
const justificacion = () => screen.getByRole('textbox', { name: 'Justificación' })

/** Abre la hoja de escalar, escribe la justificación y confirma. */
async function escalarCon(texto) {
  await userEvent.click(escalar())
  await userEvent.type(justificacion(), texto)
  await userEvent.click(screen.getByRole('button', { name: 'Escalar novedad' }))
}

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

  it('RF-03 / RNF-11: si responde SIN_PERMISO, lo dice y pide releer el perfil (puede que ya no tenga ese rol)', async () => {
    vi.mocked(tomarNovedad).mockRejectedValue({ message: 'SIN_PERMISO' })
    const alPedirRevision = vi.fn()
    const dejarDeEscuchar = alPedirRevisionDelPerfil(alPedirRevision)
    pintar()

    await userEvent.click(tomar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tienes permiso para esta acción.',
    )
    expect(alPedirRevision).toHaveBeenCalledOnce()
    dejarDeEscuchar()
  })

  it('RF-10: otro error no pide releer el perfil', async () => {
    vi.mocked(tomarNovedad).mockRejectedValue({ message: 'TRANSICION_INVALIDA' })
    const alPedirRevision = vi.fn()
    const dejarDeEscuchar = alPedirRevisionDelPerfil(alPedirRevision)
    pintar()

    await userEvent.click(tomar())
    await screen.findByRole('alert')

    expect(alPedirRevision).not.toHaveBeenCalled()
    dejarDeEscuchar()
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

  it('RF-18 / CU-18 5: una novedad aprobada solo ofrece registrar la solución', () => {
    pintar({ novedad: APROBADA, acciones: EN_APROBADA })

    expect(barra()).toContainElement(screen.getByRole('link', { name: 'Registrar solución' }))
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
    expect(barra()).toContainElement(escalar())
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

describe('Escalar desde el detalle (RF-12 / CU-12, Figma 15)', () => {
  beforeEach(() => {
    vi.mocked(tomarNovedad).mockReset()
    vi.mocked(rechazarNovedad).mockReset()
    vi.mocked(escalarNovedad).mockReset()
  })

  const pintarEnAtencion = (props = {}) =>
    pintar({ novedad: ATENDIDA, acciones: EN_ATENCION, ...props })

  it('RF-12 / CU-12 1: una novedad en atención se puede escalar; va a todo el ancho, antes de «Rechazar»', () => {
    pintarEnAtencion()

    expect(barra()).toContainElement(escalar())
    const botones = within(barra()).getAllByRole('button')
    expect(botones.map((boton) => boton.textContent)).toEqual([
      'Escalar al director',
      'Reasignar',
      'Rechazar',
    ])
  })

  it('RF-12: una novedad asignada no ofrece escalar: primero hay que tomarla', () => {
    pintar()

    expect(screen.queryByRole('button', { name: 'Escalar al director' })).not.toBeInTheDocument()
  })

  it('RF-12 / CU-12 1 y 2: «Escalar al director» abre la hoja de la justificación, con la novedad a la vista', async () => {
    pintarEnAtencion()

    await userEvent.click(escalar())

    const hoja = screen.getByRole('dialog', { name: 'Escalar al director de agricultura' })
    expect(hoja).toBeVisible()
    expect(within(hoja).getByText('NOV-0150')).toBeVisible()
    expect(within(hoja).getByText('Crítico')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Escalar novedad' })).toBeDisabled()
    expect(escalarNovedad).not.toHaveBeenCalled()
  })

  it('RF-12 / CU-12 3 a 6: al confirmar llama a la función con la justificación, cierra la hoja, avisa y recarga', async () => {
    vi.mocked(escalarNovedad).mockResolvedValue({ id: 'n-153', estado: 'escalada' })
    const { alCambiar } = pintarEnAtencion()

    await escalarCon('El router se quemó; hay que comprar uno nuevo.')

    expect(escalarNovedad).toHaveBeenCalledExactlyOnceWith(
      'n-153',
      'El router se quemó; hay que comprar uno nuevo.',
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Novedad escalada. Queda en espera del director.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).toHaveBeenCalledOnce()
    expect(rechazarNovedad).not.toHaveBeenCalled()
  })

  it('RF-12: mientras escala, la hoja dice «Escalando…»', async () => {
    let terminar
    vi.mocked(escalarNovedad).mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    pintarEnAtencion()

    await escalarCon('Hay que comprar un router')

    expect(screen.getByRole('button', { name: 'Escalando…' })).toBeDisabled()

    terminar({ id: 'n-153', estado: 'escalada' })
    expect(await screen.findByRole('status')).toBeVisible()
  })

  it('RF-25 / CU-12 1a (14-C): si se pierde la conexión cierra la hoja, dice que no se aplicó y «Reintentar» envía la misma justificación', async () => {
    vi.mocked(escalarNovedad).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { alCambiar } = pintarEnAtencion()

    await escalarCon('Hay que comprar un router')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se aplicó: se perdió la conexión. La novedad sigue En atención.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).not.toHaveBeenCalled()

    vi.mocked(escalarNovedad).mockResolvedValue({ id: 'n-153', estado: 'escalada' })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Novedad escalada.')
    expect(escalarNovedad).toHaveBeenLastCalledWith('n-153', 'Hay que comprar un router')
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-12: si alguien cambió el estado antes, cierra la hoja, avisa y recarga', async () => {
    vi.mocked(escalarNovedad).mockRejectedValue({ code: 'P0001', message: 'TRANSICION_INVALIDA' })
    const { alCambiar } = pintarEnAtencion()

    await escalarCon('Hay que comprar un router')

    expect(await screen.findByRole('alert')).toHaveTextContent('La novedad cambió de estado.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-12: si el servidor responde DATO_OBLIGATORIO, la hoja sigue abierta y señala el campo', async () => {
    vi.mocked(escalarNovedad).mockRejectedValue({ code: 'P0001', message: 'DATO_OBLIGATORIO' })
    pintarEnAtencion()

    await escalarCon('Hay que comprar un router')

    await vi.waitFor(() => expect(justificacion()).toBeInvalid())
    expect(justificacion()).toHaveValue('Hay que comprar un router')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('RF-12: «Cancelar» cierra la hoja sin escalar y devuelve el foco al botón', async () => {
    pintarEnAtencion()
    await userEvent.click(escalar())
    await userEvent.type(justificacion(), 'Hay que comprar un router')

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(escalarNovedad).not.toHaveBeenCalled()
    expect(escalar()).toHaveFocus()
  })

  it('RF-12: una novedad escalada ya no tiene acciones para el aprobador; el aviso se conserva', async () => {
    vi.mocked(escalarNovedad).mockResolvedValue({ id: 'n-153', estado: 'escalada' })
    const { rerender } = pintarEnAtencion()
    await escalarCon('Hay que comprar un router')
    await screen.findByRole('status')

    rerender(
      <AccionesDelAprobador
        novedad={{ ...ATENDIDA, estado: 'escalada' }}
        acciones={[]}
        alCambiar={() => {}}
        esEscritorio={false}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Novedad escalada.')
    expect(barra()).toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('en el escritorio «Escalar al director» es un botón más bajo el encabezado', () => {
    pintarEnAtencion({ esEscritorio: true })

    expect(barra()).toBeNull()
    expect(escalar()).toBeEnabled()
    expect(rechazar()).toBeEnabled()
  })
})

describe('Reasignar desde el detalle (RF-17 / CU-17, Figma 17)', () => {
  beforeEach(() => {
    vi.mocked(tomarNovedad).mockReset()
    vi.mocked(rechazarNovedad).mockReset()
    vi.mocked(escalarNovedad).mockReset()
    vi.mocked(reasignarNovedad).mockReset()
    vi.mocked(listarAreas).mockReset()
    vi.mocked(listarAreas).mockResolvedValue([
      { id: 'area-m', nombre: 'Mantenimiento' },
      { id: 'area-s', nombre: 'Sistemas' },
    ])
  })

  const reasignar = () => screen.getByRole('button', { name: 'Reasignar' })
  const motivoDeReasignacion = () =>
    screen.getByRole('textbox', { name: 'Motivo de la reasignación' })

  /** Abre la hoja, espera el destino, escribe el motivo y confirma. */
  async function reasignarCon(texto) {
    await userEvent.click(reasignar())
    const hoja = within(screen.getByRole('dialog', { name: 'Reasignar a otra área' }))
    await hoja.findByText('Destino')
    await userEvent.type(motivoDeReasignacion(), texto)
    await userEvent.click(hoja.getByRole('button', { name: 'Reasignar' }))
  }

  it.each([
    ['asignada', ASIGNADA, EN_ASIGNADA, ['Tomar para atención', 'Reasignar', 'Rechazar']],
    ['en atención', ATENDIDA, EN_ATENCION, ['Escalar al director', 'Reasignar', 'Rechazar']],
  ])(
    'RF-17 / CU-17 1: una novedad %s se puede reasignar; comparte fila con «Rechazar»',
    (_, novedad, acciones, esperados) => {
      pintar({ novedad, acciones })

      const botones = within(barra()).getAllByRole('button')
      expect(botones.map((boton) => boton.textContent)).toEqual(esperados)
      expect(reasignar().parentElement).toBe(rechazar().parentElement)
    },
  )

  it('RF-17 / CU-17 1 y 2: «Reasignar» abre la hoja con el área actual y la de destino', async () => {
    pintar()

    await userEvent.click(reasignar())

    const hoja = within(screen.getByRole('dialog', { name: 'Reasignar a otra área' }))
    expect(
      within(hoja.getByText('Área actual').closest('p')).getByText('Mantenimiento'),
    ).toBeVisible()
    expect(
      within((await hoja.findByText('Destino')).closest('p')).getByText('Sistemas'),
    ).toBeVisible()
    expect(reasignarNovedad).not.toHaveBeenCalled()
  })

  it('RF-17 / CU-17 3 a 6: al confirmar llama a la función con el área de destino y el motivo, y sale del detalle con el aviso', async () => {
    vi.mocked(reasignarNovedad).mockResolvedValue({ id: 'n-153', estado: 'asignada' })
    const { alCambiar, alSalir } = pintar()

    await reasignarCon('Es un daño de la red; lo atiende Sistemas.')

    expect(reasignarNovedad).toHaveBeenCalledExactlyOnceWith(
      'n-153',
      'area-s',
      'Es un daño de la red; lo atiende Sistemas.',
    )
    await vi.waitFor(() =>
      expect(alSalir).toHaveBeenCalledExactlyOnceWith('Novedad reasignada a Sistemas.'),
    )
    // La novedad ya no está en su alcance: recargar el detalle daría «No puedes ver esta
    // novedad».
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('RF-25 / CU-17 1a (14-C): si se pierde la conexión cierra la hoja, dice que no se aplicó y «Reintentar» envía lo mismo', async () => {
    vi.mocked(reasignarNovedad).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { alCambiar, alSalir } = pintar()

    await reasignarCon('No es de Mantenimiento')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se aplicó: se perdió la conexión. La novedad sigue Asignada.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alSalir).not.toHaveBeenCalled()

    vi.mocked(reasignarNovedad).mockResolvedValue({ id: 'n-153', estado: 'asignada' })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    await vi.waitFor(() => expect(alSalir).toHaveBeenCalledOnce())
    expect(reasignarNovedad).toHaveBeenLastCalledWith('n-153', 'area-s', 'No es de Mantenimiento')
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('RF-17: si alguien cambió el estado antes, cierra la hoja, avisa y recarga el detalle', async () => {
    vi.mocked(reasignarNovedad).mockRejectedValue({ code: 'P0001', message: 'TRANSICION_INVALIDA' })
    const { alCambiar, alSalir } = pintar()

    await reasignarCon('No es de Mantenimiento')

    expect(await screen.findByRole('alert')).toHaveTextContent('La novedad cambió de estado.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).toHaveBeenCalledOnce()
    expect(alSalir).not.toHaveBeenCalled()
  })

  it('RF-17: si el servidor responde AREA_INVALIDA, cierra la hoja y muestra «Elige otra área.»', async () => {
    vi.mocked(reasignarNovedad).mockRejectedValue({ code: 'P0001', message: 'AREA_INVALIDA' })
    const { alSalir } = pintar()

    await reasignarCon('No es de Mantenimiento')

    expect(await screen.findByRole('alert')).toHaveTextContent('Elige otra área.')
    expect(alSalir).not.toHaveBeenCalled()
  })

  it('RF-17: si el servidor responde DATO_OBLIGATORIO, la hoja sigue abierta y señala el campo', async () => {
    vi.mocked(reasignarNovedad).mockRejectedValue({ code: 'P0001', message: 'DATO_OBLIGATORIO' })
    const { alSalir } = pintar()

    await reasignarCon('No es de Mantenimiento')

    await vi.waitFor(() => expect(motivoDeReasignacion()).toBeInvalid())
    expect(alSalir).not.toHaveBeenCalled()
  })

  it('RF-17: «Cancelar» cierra la hoja sin reasignar y devuelve el foco al botón', async () => {
    pintar()
    await userEvent.click(reasignar())

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(reasignarNovedad).not.toHaveBeenCalled()
    expect(reasignar()).toHaveFocus()
  })
})

describe('Registrar solución desde el detalle (RF-14 / CU-14, Figma 14 y 18)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const registrarSolucion = () => screen.getByRole('link', { name: 'Registrar solución' })

  it.each([
    ['en atención', ATENDIDA, EN_ATENCION],
    ['aprobada', APROBADA, EN_APROBADA],
  ])(
    'RF-14 / CU-14 1: una novedad %s ofrece «Registrar solución», la primera de la barra, que abre la pantalla 18',
    (_, novedad, acciones) => {
      pintar({ novedad, acciones })

      expect(registrarSolucion()).toHaveAttribute('href', '/novedades/n-153/solucion')
      expect(barra().firstElementChild).toBe(registrarSolucion())
    },
  )

  it('RF-14: una novedad asignada no ofrece registrar la solución: primero hay que tomarla', () => {
    pintar()

    expect(screen.queryByRole('link', { name: 'Registrar solución' })).not.toBeInTheDocument()
  })

  it('RF-14: en el escritorio el enlace va con los demás botones, sin barra fija', () => {
    pintar({ novedad: ATENDIDA, acciones: EN_ATENCION, esEscritorio: true })

    expect(barra()).toBeNull()
    expect(registrarSolucion()).toBeVisible()
  })

  it('RF-14 / CU-14: muestra el aviso con que se vuelve de la pantalla 18 y lo quita cumplido su tiempo', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const alQuitarAvisoDeLlegada = vi.fn()
    pintar({
      novedad: { ...ATENDIDA, estado: 'resuelta' },
      acciones: [],
      avisoDeLlegada: {
        tipo: 'exito',
        mensaje: 'Solución registrada. La finca debe confirmar el cierre.',
      },
      alQuitarAvisoDeLlegada,
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Solución registrada. La finca debe confirmar el cierre.',
    )
    expect(alQuitarAvisoDeLlegada).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(6100)

    expect(alQuitarAvisoDeLlegada).toHaveBeenCalledOnce()
  })

  it('RF-14: el aviso de llegada puede ser un error, y el de una acción hecha aquí lo reemplaza', async () => {
    vi.mocked(rechazarNovedad).mockReset()
    vi.mocked(rechazarNovedad).mockResolvedValue({ id: 'n-153', estado: 'rechazada' })
    pintar({
      novedad: ATENDIDA,
      acciones: EN_ATENCION,
      avisoDeLlegada: { tipo: 'error', mensaje: 'La novedad cambió de estado.' },
      alQuitarAvisoDeLlegada: () => {},
    })

    expect(screen.getByRole('alert')).toHaveTextContent('La novedad cambió de estado.')

    await rechazarCon('Duplicada')

    expect(await screen.findByRole('status')).toHaveTextContent('Novedad rechazada.')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
