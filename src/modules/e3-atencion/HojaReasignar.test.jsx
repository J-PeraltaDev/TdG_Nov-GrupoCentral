import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listarAreas } from '../../core/supabase/repositorios/catalogos.js'
import { HojaReasignar } from './HojaReasignar.jsx'

vi.mock('../../core/supabase/repositorios/catalogos.js', () => ({
  listarAreas: vi.fn(),
}))

const MANTENIMIENTO = { id: 'area-m', nombre: 'Mantenimiento' }
const SISTEMAS = { id: 'area-s', nombre: 'Sistemas' }
// Como llega del detalle: la novedad está hoy en Sistemas.
const NOVEDAD = { area_id: 'area-s', area: 'Sistemas' }

function pintar(props = {}) {
  const alCerrar = vi.fn()
  const alConfirmar = vi.fn().mockResolvedValue({ ok: true })
  const utilidades = render(
    <HojaReasignar
      abierta
      novedad={NOVEDAD}
      alCerrar={alCerrar}
      alConfirmar={alConfirmar}
      enCurso={false}
      {...props}
    />,
  )
  return { alCerrar, alConfirmar, ...utilidades }
}

const hoja = () => screen.getByRole('dialog', { name: 'Reasignar a otra área' })
const motivo = () => screen.getByRole('textbox', { name: 'Motivo de la reasignación' })
const confirmar = () => screen.getByRole('button', { name: 'Reasignar' })
const destinoListo = () => screen.findByText('Destino')

describe('Hoja 17 · Reasignar a otra área (RF-17 / CU-17)', () => {
  beforeEach(() => {
    vi.mocked(listarAreas).mockReset()
    vi.mocked(listarAreas).mockResolvedValue([MANTENIMIENTO, SISTEMAS])
  })

  it('RF-17 / CU-17 2: muestra el área actual y la de destino, y pide el motivo', async () => {
    pintar()

    expect(hoja()).toBeVisible()
    expect(within(screen.getByText('Área actual').closest('p')).getByText('Sistemas')).toBeVisible()
    const destino = (await destinoListo()).closest('p')
    expect(within(destino).getByText('Mantenimiento')).toBeVisible()
    expect(motivo()).toBeRequired()
    expect(motivo()).toHaveValue('')
    expect(screen.getByText('0/500')).toBeVisible()
    expect(
      screen.getByText(
        'La novedad pasará a la bandeja de Mantenimiento como Asignada. Se avisará a Mantenimiento y a la finca.',
      ),
    ).toBeVisible()
  })

  it('el destino sale de las áreas activas del catálogo, sin la actual', async () => {
    pintar({ novedad: { area_id: 'area-m', area: 'Mantenimiento' } })

    const destino = (await destinoListo()).closest('p')
    expect(within(destino).getByText('Sistemas')).toBeVisible()
    expect(screen.getByText(/La novedad pasará a la bandeja de Sistemas/)).toBeVisible()
  })

  it('cerrada no pinta nada ni pide las áreas', () => {
    pintar({ abierta: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listarAreas).not.toHaveBeenCalled()
  })

  it('RF-17 / CU-17 3a: sin motivo no deja confirmar', async () => {
    const { alConfirmar } = pintar()
    await destinoListo()

    expect(confirmar()).toBeDisabled()

    await userEvent.type(motivo(), '   ')
    expect(confirmar()).toBeDisabled()
    await userEvent.click(confirmar())
    expect(alConfirmar).not.toHaveBeenCalled()

    await userEvent.type(motivo(), 'Es un daño del aire acondicionado')
    expect(confirmar()).toBeEnabled()
  })

  it('RF-17 / CU-17 3: confirma con el área de destino y el motivo sin espacios sobrantes', async () => {
    const { alConfirmar } = pintar()
    await destinoListo()

    await userEvent.type(
      motivo(),
      '  Es un daño del aire acondicionado; lo atiende Mantenimiento.  ',
    )
    await userEvent.click(confirmar())

    expect(alConfirmar).toHaveBeenCalledExactlyOnceWith(
      MANTENIMIENTO,
      'Es un daño del aire acondicionado; lo atiende Mantenimiento.',
    )
  })

  it('mientras cargan las áreas no deja confirmar, aunque haya motivo', async () => {
    let entregar
    vi.mocked(listarAreas).mockReturnValue(new Promise((resolver) => (entregar = resolver)))
    pintar()

    await userEvent.type(motivo(), 'No es de Sistemas')
    expect(within(hoja()).getByRole('status')).toHaveTextContent('Cargando…')
    expect(confirmar()).toBeDisabled()

    entregar([MANTENIMIENTO, SISTEMAS])
    await destinoListo()
    expect(confirmar()).toBeEnabled()
  })

  it('si las áreas no cargan, lo dice y deja reintentar', async () => {
    vi.mocked(listarAreas).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    pintar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar las áreas. Revisa tu conexión.',
    )
    await userEvent.type(motivo(), 'No es de Sistemas')
    expect(confirmar()).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    await destinoListo()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    // Lo escrito sigue ahí.
    expect(motivo()).toHaveValue('No es de Sistemas')
    expect(confirmar()).toBeEnabled()
  })

  it('con más de un área posible, la persona elige el destino', async () => {
    const BODEGA = { id: 'area-b', nombre: 'Bodega' }
    vi.mocked(listarAreas).mockResolvedValue([BODEGA, MANTENIMIENTO, SISTEMAS])
    const { alConfirmar } = pintar()

    const opciones = await screen.findAllByRole('radio')
    expect(opciones).toHaveLength(2)
    expect(screen.getByRole('group', { name: 'Destino' })).toBeVisible()
    await userEvent.type(motivo(), 'Es de la bodega')
    // Sin destino elegido no se puede confirmar.
    expect(confirmar()).toBeDisabled()

    await userEvent.click(screen.getByRole('radio', { name: /Bodega/ }))

    expect(screen.getByText(/La novedad pasará a la bandeja de Bodega/)).toBeVisible()
    await userEvent.click(confirmar())
    expect(alConfirmar).toHaveBeenCalledExactlyOnceWith(BODEGA, 'Es de la bodega')
  })

  it('si no hay otra área activa, lo dice y no deja confirmar', async () => {
    vi.mocked(listarAreas).mockResolvedValue([SISTEMAS])
    pintar()

    expect(await screen.findByText('No hay otra área activa.')).toBeVisible()
    await userEvent.type(motivo(), 'No es de Sistemas')
    expect(confirmar()).toBeDisabled()
  })

  it('mientras reasigna, el botón dice «Reasignando…» y no admite otro toque', async () => {
    const { alConfirmar, alCerrar, rerender } = pintar()
    await destinoListo()
    await userEvent.type(motivo(), 'No es de Sistemas')

    rerender(
      <HojaReasignar
        abierta
        novedad={NOVEDAD}
        alCerrar={alCerrar}
        alConfirmar={alConfirmar}
        enCurso
      />,
    )

    const ocupado = screen.getByRole('button', { name: 'Reasignando…' })
    expect(ocupado).toBeDisabled()
    await userEvent.click(ocupado)
    expect(alConfirmar).not.toHaveBeenCalled()
  })

  it('«Cancelar» cierra la hoja sin confirmar', async () => {
    const { alCerrar, alConfirmar } = pintar()
    await destinoListo()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(alCerrar).toHaveBeenCalled()
    expect(alConfirmar).not.toHaveBeenCalled()
  })

  it('RF-17: si el servidor responde que falta el motivo, señala el campo', async () => {
    const alConfirmar = vi.fn().mockResolvedValue({
      ok: false,
      fallo: {
        codigo: 'DATO_OBLIGATORIO',
        mensaje: 'Falta un dato obligatorio. Revisa los campos e intenta de nuevo.',
      },
    })
    pintar({ alConfirmar })
    await destinoListo()
    await userEvent.type(motivo(), 'No es de Sistemas')

    await userEvent.click(confirmar())

    expect(motivo()).toBeInvalid()
  })
})
