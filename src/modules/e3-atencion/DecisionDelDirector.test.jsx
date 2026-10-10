import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { decidirEscalamiento } from '../../core/supabase/repositorios/novedades.js'
import DecisionDelDirector from './DecisionDelDirector.jsx'

// Se simula el repositorio, nunca la red.
vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  decidirEscalamiento: vi.fn(),
}))

const ESCALADA = {
  id: 'n-147',
  codigo: 147,
  estado: 'escalada',
  prioridad: 'alto',
  area_id: 'area-m',
  area: 'Mantenimiento',
  finca: 'Juanca',
}

function pintar(props = {}) {
  const alCambiar = vi.fn()
  const propiedades = {
    novedad: ESCALADA,
    puedeDecidir: true,
    alCambiar,
    esEscritorio: true,
    ...props,
  }
  const utilidades = render(<DecisionDelDirector {...propiedades} />)
  return {
    alCambiar,
    ...utilidades,
    /** Lo que hace el detalle al recargarse: la novedad ya no admite la decisión. */
    recargarCon: (novedad) =>
      utilidades.rerender(
        <DecisionDelDirector {...propiedades} novedad={novedad} puedeDecidir={false} />,
      ),
  }
}

const panel = () => within(screen.getByRole('region', { name: 'Tu decisión' }))
const aprobar = () => screen.getByRole('radio', { name: 'Aprobar' })
const rechazar = () => screen.getByRole('radio', { name: 'Rechazar' })
const observacion = () => screen.getByRole('textbox', { name: 'Observación' })
const confirmar = () => screen.getByRole('button', { name: 'Confirmar decisión' })
const barra = () => document.querySelector('[data-barra-de-acciones]')

afterEach(() => {
  vi.mocked(decidirEscalamiento).mockReset()
})

describe('Pantallas 20 y 20-B · «Tu decisión» en el escritorio (RF-13 / CU-13)', () => {
  it('RF-13 / CU-13 3: ofrece aprobar o rechazar, sin nada elegido, y dice qué pasa con cada una', () => {
    pintar()

    expect(panel().getByRole('heading', { level: 2, name: 'Tu decisión' })).toBeVisible()
    expect(aprobar()).not.toBeChecked()
    expect(aprobar()).toHaveAccessibleDescription(
      'Vuelve a Mantenimiento para ejecutar la solución',
    )
    expect(rechazar()).not.toBeChecked()
    expect(rechazar()).toHaveAccessibleDescription('La novedad se cierra como Rechazada')
    expect(observacion()).toHaveAccessibleDescription(
      'Opcional al aprobar, obligatoria al rechazar',
    )
    expect(observacion()).toHaveAttribute('placeholder', 'Escribe la observación')
    expect(panel().getByText('0/500')).toBeVisible()
    expect(
      panel().getByText(
        'Se avisará a Mantenimiento y a la finca Juanca. La decisión queda en el historial y no se puede editar.',
      ),
    ).toBeVisible()
    expect(barra()).toBeNull()
  })

  it('RF-13: la nota no repite «finca» si el nombre ya lo trae', () => {
    pintar({ novedad: { ...ESCALADA, finca: 'Finca de prueba 01' } })

    expect(
      panel().getByText(/Se avisará a Mantenimiento y a la finca de prueba 01\./),
    ).toBeVisible()
  })

  it('RF-13 / CU-13 4: sin elegir una opción no se puede confirmar', async () => {
    pintar()

    await userEvent.type(observacion(), 'Comprar con el proveedor habitual.')

    expect(confirmar()).toBeDisabled()
    expect(decidirEscalamiento).not.toHaveBeenCalled()
  })

  it('RF-13 / CU-13 5 y 6: aprueba sin observación, avisa y recarga el detalle', async () => {
    vi.mocked(decidirEscalamiento).mockResolvedValue({ id: 'n-147', estado: 'aprobada' })
    const { alCambiar } = pintar()

    await userEvent.click(aprobar())
    expect(observacion()).not.toBeInvalid()
    await userEvent.click(confirmar())

    expect(decidirEscalamiento).toHaveBeenCalledExactlyOnceWith('n-147', true, null)
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Novedad aprobada. Vuelve a Mantenimiento para ejecutar la solución.',
    )
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-13 / CU-13 5: aprueba con la observación, sin espacios sobrantes', async () => {
    vi.mocked(decidirEscalamiento).mockResolvedValue({ id: 'n-147', estado: 'aprobada' })
    pintar()

    await userEvent.click(aprobar())
    await userEvent.type(observacion(), '  Comprar con el proveedor habitual.  ')
    await userEvent.click(confirmar())

    expect(decidirEscalamiento).toHaveBeenCalledExactlyOnceWith(
      'n-147',
      true,
      'Comprar con el proveedor habitual.',
    )
  })

  it('RF-13 / CU-13 5a (20-B): para rechazar pide la observación y no deja confirmar sin ella', async () => {
    pintar()

    await userEvent.click(rechazar())

    expect(confirmar()).toBeDisabled()
    expect(observacion()).toBeInvalid()
    expect(observacion()).toHaveAccessibleDescription('Escribe la observación para rechazar')

    // Solo espacios no es una observación.
    await userEvent.type(observacion(), '   ')
    expect(confirmar()).toBeDisabled()
    expect(decidirEscalamiento).not.toHaveBeenCalled()
  })

  it('RF-13 / CU-13 5 y 6: rechaza con la observación, avisa y recarga el detalle', async () => {
    vi.mocked(decidirEscalamiento).mockResolvedValue({ id: 'n-147', estado: 'rechazada' })
    const { alCambiar } = pintar()

    await userEvent.click(rechazar())
    await userEvent.type(observacion(), 'No hay presupuesto este mes.')
    expect(observacion()).not.toBeInvalid()
    await userEvent.click(confirmar())

    expect(decidirEscalamiento).toHaveBeenCalledExactlyOnceWith(
      'n-147',
      false,
      'No hay presupuesto este mes.',
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Novedad rechazada. El área y la finca verán tu observación.',
    )
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-13: al volver a «Aprobar» la observación deja de ser obligatoria', async () => {
    pintar()

    await userEvent.click(rechazar())
    await userEvent.click(aprobar())

    expect(observacion()).not.toBeInvalid()
    expect(confirmar()).toBeEnabled()
  })

  it('RF-13: mientras decide, el botón lo dice y no admite otro toque', async () => {
    let terminar
    vi.mocked(decidirEscalamiento).mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    pintar()

    await userEvent.click(aprobar())
    await userEvent.click(confirmar())

    const enCurso = screen.getByRole('button', { name: 'Confirmando…' })
    expect(enCurso).toBeDisabled()
    await userEvent.click(enCurso)
    expect(decidirEscalamiento).toHaveBeenCalledOnce()

    terminar({ id: 'n-147', estado: 'aprobada' })
    expect(await screen.findByRole('status')).toBeVisible()
  })

  it('RF-13: después de decidir ya no hay panel, pero el aviso sigue a la vista', async () => {
    vi.mocked(decidirEscalamiento).mockResolvedValue({ id: 'n-147', estado: 'aprobada' })
    const { recargarCon } = pintar()

    await userEvent.click(aprobar())
    await userEvent.click(confirmar())
    await screen.findByRole('status')
    recargarCon({ ...ESCALADA, estado: 'aprobada' })

    expect(screen.queryByRole('region', { name: 'Tu decisión' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Novedad aprobada.')
  })

  it('RF-13 / Tabla 22: si otro director ya decidió, avisa y recarga el detalle', async () => {
    vi.mocked(decidirEscalamiento).mockRejectedValue({ message: 'TRANSICION_INVALIDA' })
    const { alCambiar } = pintar()

    await userEvent.click(aprobar())
    await userEvent.click(confirmar())

    expect(await screen.findByRole('alert')).toHaveTextContent('La novedad cambió de estado.')
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-13 / RF-25: si se cae la conexión no decide, dice que sigue Escalada y deja reintentar', async () => {
    vi.mocked(decidirEscalamiento)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ id: 'n-147', estado: 'rechazada' })
    const { alCambiar } = pintar()

    await userEvent.click(rechazar())
    await userEvent.type(observacion(), 'No hay presupuesto.')
    await userEvent.click(confirmar())

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent(
      'No se aplicó: se perdió la conexión. La novedad sigue Escalada.',
    )
    expect(alCambiar).not.toHaveBeenCalled()
    // Lo escrito no se pierde.
    expect(observacion()).toHaveValue('No hay presupuesto.')

    await userEvent.click(within(aviso).getByRole('button', { name: 'Reintentar' }))

    expect(decidirEscalamiento).toHaveBeenCalledTimes(2)
    expect(decidirEscalamiento).toHaveBeenLastCalledWith('n-147', false, 'No hay presupuesto.')
    expect(await screen.findByRole('status')).toHaveTextContent('Novedad rechazada.')
  })

  it('RF-13 / Tabla 22: si el servidor no acepta la observación, lo dice en el campo', async () => {
    vi.mocked(decidirEscalamiento).mockRejectedValue({ message: 'DATO_OBLIGATORIO' })
    const { alCambiar } = pintar()

    await userEvent.click(rechazar())
    await userEvent.type(observacion(), 'No.')
    await userEvent.click(confirmar())

    expect(await screen.findByText(/Falta un dato obligatorio/)).toBeVisible()
    expect(observacion()).toBeInvalid()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(alCambiar).not.toHaveBeenCalled()

    // Al corregir, el mensaje se quita.
    await userEvent.type(observacion(), ' No hay presupuesto.')
    expect(screen.queryByText(/Falta un dato obligatorio/)).not.toBeInTheDocument()
  })

  it('Tabla 35: si la novedad no admite la decisión, no pinta nada', () => {
    const { container } = pintar({
      novedad: { ...ESCALADA, estado: 'aprobada' },
      puedeDecidir: false,
    })

    expect(container).toBeEmptyDOMElement()
  })
})

describe('Pantalla 20-C · La decisión en el teléfono (RF-13 / CU-13)', () => {
  const botonAprobar = () => screen.getByRole('button', { name: 'Aprobar' })
  const botonRechazar = () => screen.getByRole('button', { name: 'Rechazar' })

  it('RF-13 / CU-13 3: la barra de acciones ofrece «Rechazar» y «Aprobar»', () => {
    pintar({ esEscritorio: false })

    expect(barra()).toContainElement(botonRechazar())
    expect(barra()).toContainElement(botonAprobar())
    expect(screen.queryByRole('region', { name: 'Tu decisión' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('RF-13 / CU-13 5: «Aprobar» abre su hoja, que confirma sin exigir la observación', async () => {
    vi.mocked(decidirEscalamiento).mockResolvedValue({ id: 'n-147', estado: 'aprobada' })
    const { alCambiar } = pintar({ esEscritorio: false })

    await userEvent.click(botonAprobar())
    const hoja = within(screen.getByRole('dialog', { name: 'Aprobar' }))
    expect(hoja.getByText('Vuelve a Mantenimiento para ejecutar la solución.')).toBeVisible()
    expect(hoja.getByText('NOV-0147')).toBeVisible()
    expect(hoja.getByRole('textbox', { name: 'Observación' })).toHaveAccessibleDescription(
      'Opcional al aprobar',
    )
    await userEvent.click(hoja.getByRole('button', { name: 'Confirmar decisión' }))

    expect(decidirEscalamiento).toHaveBeenCalledExactlyOnceWith('n-147', true, null)
    expect(await screen.findByRole('status')).toHaveTextContent('Novedad aprobada.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).toHaveBeenCalledOnce()
  })

  it('RF-13 / CU-13 5: la hoja de «Aprobar» envía la observación que se escriba', async () => {
    vi.mocked(decidirEscalamiento).mockResolvedValue({ id: 'n-147', estado: 'aprobada' })
    pintar({ esEscritorio: false })

    await userEvent.click(botonAprobar())
    await userEvent.type(observacion(), 'Comprar con el proveedor habitual.')
    await userEvent.click(confirmar())

    expect(decidirEscalamiento).toHaveBeenCalledExactlyOnceWith(
      'n-147',
      true,
      'Comprar con el proveedor habitual.',
    )
  })

  it('RF-13 / CU-13 5a: «Rechazar» abre su hoja, que no confirma sin la observación', async () => {
    vi.mocked(decidirEscalamiento).mockResolvedValue({ id: 'n-147', estado: 'rechazada' })
    pintar({ esEscritorio: false })

    await userEvent.click(botonRechazar())
    const hoja = within(screen.getByRole('dialog', { name: 'Rechazar' }))
    expect(hoja.getByText('La novedad se cierra como Rechazada.')).toBeVisible()
    expect(hoja.getByRole('textbox', { name: 'Observación' })).toBeRequired()
    expect(hoja.getByRole('textbox', { name: 'Observación' })).toHaveAccessibleDescription(
      'Obligatoria al rechazar',
    )
    expect(hoja.getByRole('button', { name: 'Confirmar decisión' })).toBeDisabled()

    await userEvent.type(observacion(), 'No hay presupuesto este mes.')
    await userEvent.click(confirmar())

    expect(decidirEscalamiento).toHaveBeenCalledExactlyOnceWith(
      'n-147',
      false,
      'No hay presupuesto este mes.',
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Novedad rechazada.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('RF-13: «Cancelar» cierra la hoja sin decidir y la siguiente empieza en blanco', async () => {
    pintar({ esEscritorio: false })

    await userEvent.click(botonRechazar())
    await userEvent.type(observacion(), 'Borrador')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(decidirEscalamiento).not.toHaveBeenCalled()

    await userEvent.click(botonRechazar())
    expect(observacion()).toHaveValue('')
  })

  it('RF-13 / RF-25: si se cae la conexión, la hoja se cierra y el aviso deja reintentar', async () => {
    vi.mocked(decidirEscalamiento)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ id: 'n-147', estado: 'aprobada' })
    pintar({ esEscritorio: false })

    await userEvent.click(botonAprobar())
    await userEvent.click(confirmar())

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('La novedad sigue Escalada.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Novedad aprobada.')
  })

  it('RF-13: después de decidir ya no hay barra, pero el aviso sigue a la vista', async () => {
    vi.mocked(decidirEscalamiento).mockResolvedValue({ id: 'n-147', estado: 'rechazada' })
    const { recargarCon } = pintar({ esEscritorio: false })

    await userEvent.click(botonRechazar())
    await userEvent.type(observacion(), 'No hay presupuesto.')
    await userEvent.click(confirmar())
    await screen.findByRole('status')
    recargarCon({ ...ESCALADA, estado: 'rechazada' })

    expect(barra()).toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Novedad rechazada.')
  })
})
