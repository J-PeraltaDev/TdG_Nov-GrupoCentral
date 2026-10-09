import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ACCION } from '../../core/acciones/accionesDisponibles.js'
import {
  confirmarResolucion,
  reportarFallaPersiste,
} from '../../core/supabase/repositorios/novedades.js'
import AccionesDelReportante from './AccionesDelReportante.jsx'

// Se simula el repositorio, nunca la red.
vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  confirmarResolucion: vi.fn(),
  reportarFallaPersiste: vi.fn(),
}))

const RESUELTA = { id: 'n-145', estado: 'resuelta', area_id: 'area-s', area: 'Sistemas' }
// Lo que la Tabla 35 le permite al reportante sobre una resuelta de su finca.
const EN_RESUELTA = [ACCION.CONFIRMAR_CIERRE, ACCION.FALLA_PERSISTE, ACCION.ADJUNTAR_FOTO]

function pintar(props = {}) {
  const alCambiar = vi.fn()
  const propiedades = {
    novedad: RESUELTA,
    acciones: EN_RESUELTA,
    alCambiar,
    esEscritorio: false,
    ...props,
  }
  const utilidades = render(<AccionesDelReportante {...propiedades} />)
  return {
    alCambiar,
    ...utilidades,
    /** Lo que hace el detalle al recargarse: la novedad ya no admite estas acciones. */
    recargarCon: (novedad) =>
      utilidades.rerender(
        <AccionesDelReportante
          {...propiedades}
          novedad={novedad}
          acciones={[ACCION.ADJUNTAR_FOTO]}
        />,
      ),
  }
}

const barra = () => document.querySelector('[data-barra-de-acciones]')
const confirmarCierre = () => screen.getByRole('button', { name: 'Confirmar cierre' })
const fallaPersiste = () => screen.getByRole('button', { name: 'La falla persiste' })
const dialogo = () =>
  screen.getByRole('dialog', { name: '¿Confirmas que la novedad quedó resuelta?' })
const hoja = () => screen.getByRole('dialog', { name: 'La falla persiste' })
const siCerrar = () => screen.getByRole('button', { name: 'Sí, cerrar' })
const devolver = () => screen.getByRole('button', { name: 'Devolver a atención' })

afterEach(() => {
  vi.mocked(confirmarResolucion).mockReset()
  vi.mocked(reportarFallaPersiste).mockReset()
})

describe('Pantalla 09 · Acciones del reportante sobre una novedad resuelta (RF-15 / CU-15)', () => {
  it('RF-15 / CU-15 2: en el teléfono la barra ofrece «La falla persiste» y «Confirmar cierre»', () => {
    pintar()

    expect(barra()).toContainElement(fallaPersiste())
    expect(barra()).toContainElement(confirmarCierre())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('RF-15: en el escritorio los botones no van en una barra', () => {
    pintar({ esEscritorio: true })

    expect(confirmarCierre()).toBeEnabled()
    expect(fallaPersiste()).toBeEnabled()
    expect(barra()).toBeNull()
  })

  it('Tabla 35: si la novedad no está resuelta, no ofrece nada (adjuntar foto llega en el Sprint 4)', () => {
    pintar({ novedad: { ...RESUELTA, estado: 'en_atencion' }, acciones: [ACCION.ADJUNTAR_FOTO] })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(barra()).toBeNull()
  })
})

describe('Pantalla 09-C · Confirmar el cierre (RF-15 / CU-15 3)', () => {
  it('RF-15 / CU-15 3: «Confirmar cierre» pregunta antes de cerrar y advierte que no hay vuelta atrás', async () => {
    pintar()

    await userEvent.click(confirmarCierre())

    expect(dialogo()).toHaveAccessibleDescription('Al cerrarla ya no admite más cambios.')
    expect(within(dialogo()).getByRole('textbox', { name: 'Observación (opcional)' })).toHaveValue(
      '',
    )
    expect(confirmarResolucion).not.toHaveBeenCalled()
  })

  it('RF-15: «Cancelar» cierra el diálogo sin llamar a nada', async () => {
    const { alCambiar } = pintar()

    await userEvent.click(confirmarCierre())
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(confirmarResolucion).not.toHaveBeenCalled()
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('RF-15 / CU-15 3 y 4: «Sí, cerrar» confirma sin observación, avisa y recarga el detalle', async () => {
    vi.mocked(confirmarResolucion).mockResolvedValue({ id: 'n-145', estado: 'cerrada' })
    const { alCambiar } = pintar()

    await userEvent.click(confirmarCierre())
    await userEvent.click(siCerrar())

    expect(confirmarResolucion).toHaveBeenCalledExactlyOnceWith('n-145', null)
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Cierre confirmado. La novedad queda Cerrada.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-15 / CU-15 3: si escribe una observación, la envía sin espacios sobrantes', async () => {
    vi.mocked(confirmarResolucion).mockResolvedValue({ id: 'n-145', estado: 'cerrada' })
    pintar()

    await userEvent.click(confirmarCierre())
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Observación (opcional)' }),
      '  Quedó imprimiendo bien.  ',
    )
    await userEvent.click(siCerrar())

    expect(confirmarResolucion).toHaveBeenCalledExactlyOnceWith('n-145', 'Quedó imprimiendo bien.')
  })

  it('RF-15: mientras cierra, el botón lo dice y no admite otro toque', async () => {
    let terminar
    vi.mocked(confirmarResolucion).mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    pintar()

    await userEvent.click(confirmarCierre())
    await userEvent.click(siCerrar())

    const enCurso = screen.getByRole('button', { name: 'Cerrando…' })
    expect(enCurso).toBeDisabled()
    await userEvent.click(enCurso)
    expect(confirmarResolucion).toHaveBeenCalledOnce()

    terminar({ id: 'n-145', estado: 'cerrada' })
    expect(await screen.findByRole('status')).toBeVisible()
  })

  it('RF-15 / Tabla 22: si otra persona de la finca ya respondió, avisa y recarga el detalle', async () => {
    vi.mocked(confirmarResolucion).mockRejectedValue({ message: 'TRANSICION_INVALIDA' })
    const { alCambiar } = pintar()

    await userEvent.click(confirmarCierre())
    await userEvent.click(siCerrar())

    expect(await screen.findByRole('alert')).toHaveTextContent('La novedad cambió de estado.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-15 / RF-25: si se cae la conexión no cierra, dice que sigue Resuelta y deja reintentar', async () => {
    vi.mocked(confirmarResolucion)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ id: 'n-145', estado: 'cerrada' })
    const { alCambiar } = pintar()

    await userEvent.click(confirmarCierre())
    await userEvent.type(screen.getByRole('textbox', { name: 'Observación (opcional)' }), 'Listo')
    await userEvent.click(siCerrar())

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent(
      'No se aplicó: se perdió la conexión. La novedad sigue Resuelta.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).not.toHaveBeenCalled()

    await userEvent.click(within(aviso).getByRole('button', { name: 'Reintentar' }))

    expect(confirmarResolucion).toHaveBeenLastCalledWith('n-145', 'Listo')
    expect(await screen.findByRole('status')).toHaveTextContent('Cierre confirmado.')
  })

  it('RF-15: después de cerrar ya no hay barra, pero el aviso sigue a la vista', async () => {
    vi.mocked(confirmarResolucion).mockResolvedValue({ id: 'n-145', estado: 'cerrada' })
    const { recargarCon } = pintar()

    await userEvent.click(confirmarCierre())
    await userEvent.click(siCerrar())
    await screen.findByRole('status')
    recargarCon({ ...RESUELTA, estado: 'cerrada' })

    expect(barra()).toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Cierre confirmado.')
  })
})

describe('Pantalla 09-B · La falla persiste (RF-15 / CU-15 3a y 3b)', () => {
  const observacion = () => screen.getByRole('textbox', { name: '¿Qué sigue fallando?' })

  it('RF-15 / CU-15 3a: abre la hoja, que dice a quién vuelve la novedad y pide qué sigue fallando', async () => {
    pintar()

    await userEvent.click(fallaPersiste())

    expect(
      within(hoja()).getByText(
        'La novedad volverá a En atención para Sistemas, con tu observación.',
      ),
    ).toBeVisible()
    expect(observacion()).toBeRequired()
    expect(within(hoja()).getByText('0/500')).toBeVisible()
  })

  it('RF-15 / CU-15 3b: sin la observación, o solo con espacios, no se puede devolver', async () => {
    pintar()

    await userEvent.click(fallaPersiste())
    expect(devolver()).toBeDisabled()

    await userEvent.type(observacion(), '   ')
    expect(devolver()).toBeDisabled()
    expect(reportarFallaPersiste).not.toHaveBeenCalled()
  })

  it('RF-15 / CU-15 3a: con la observación devuelve la novedad al área, avisa y recarga el detalle', async () => {
    vi.mocked(reportarFallaPersiste).mockResolvedValue({ id: 'n-145', estado: 'en_atencion' })
    const { alCambiar } = pintar()

    await userEvent.click(fallaPersiste())
    await userEvent.type(observacion(), '  Sigue sin imprimir desde la báscula.  ')
    expect(within(hoja()).getByText('40/500')).toBeVisible()
    await userEvent.click(devolver())

    expect(reportarFallaPersiste).toHaveBeenCalledExactlyOnceWith(
      'n-145',
      'Sigue sin imprimir desde la báscula.',
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Novedad devuelta a Sistemas. Vuelve a estar En atención.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-15 / Tabla 22: si el servidor no acepta la observación, se corrige en la misma hoja', async () => {
    vi.mocked(reportarFallaPersiste).mockRejectedValue({ message: 'DATO_OBLIGATORIO' })
    const { alCambiar } = pintar()

    await userEvent.click(fallaPersiste())
    await userEvent.type(observacion(), 'No.')
    await userEvent.click(devolver())

    expect(await within(hoja()).findByText(/Falta un dato obligatorio/)).toBeVisible()
    expect(observacion()).toBeInvalid()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('RF-15: «Cancelar» cierra la hoja sin devolver nada y la siguiente empieza en blanco', async () => {
    pintar()

    await userEvent.click(fallaPersiste())
    await userEvent.type(observacion(), 'Borrador')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(reportarFallaPersiste).not.toHaveBeenCalled()

    await userEvent.click(fallaPersiste())
    expect(observacion()).toHaveValue('')
  })

  it('RF-15 / RF-25: si se cae la conexión, la hoja se cierra y el aviso deja reintentar', async () => {
    vi.mocked(reportarFallaPersiste)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ id: 'n-145', estado: 'en_atencion' })
    pintar()

    await userEvent.click(fallaPersiste())
    await userEvent.type(observacion(), 'Sigue sin imprimir.')
    await userEvent.click(devolver())

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('La novedad sigue Resuelta.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    expect(reportarFallaPersiste).toHaveBeenLastCalledWith('n-145', 'Sigue sin imprimir.')
    expect(await screen.findByRole('status')).toHaveTextContent('Novedad devuelta a Sistemas.')
  })
})
