import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HojaRechazar } from './HojaRechazar.jsx'

function pintar(props = {}) {
  const alCerrar = vi.fn()
  const alConfirmar = vi.fn().mockResolvedValue({ ok: true })
  const utilidades = render(
    <HojaRechazar
      abierta
      alCerrar={alCerrar}
      alConfirmar={alConfirmar}
      enCurso={false}
      {...props}
    />,
  )
  return { alCerrar, alConfirmar, ...utilidades }
}

const hoja = () => screen.getByRole('dialog', { name: 'Rechazar novedad' })
const motivo = () => screen.getByRole('textbox', { name: 'Motivo del rechazo' })
const confirmar = () => screen.getByRole('button', { name: 'Rechazar novedad' })
const frecuente = (nombre) =>
  within(screen.getByRole('group', { name: 'Motivos frecuentes' })).getByRole('button', {
    name: nombre,
  })

describe('Hoja 16 · Rechazar novedad (RF-11 / CU-11)', () => {
  it('RF-11 / CU-11 2: pide el motivo y advierte que el rechazo no se puede deshacer', () => {
    pintar()

    expect(hoja()).toBeVisible()
    expect(
      screen.getByText(
        'La novedad se cerrará como Rechazada y la finca verá el motivo. Esta acción no se puede deshacer.',
      ),
    ).toBeVisible()
    expect(motivo()).toBeRequired()
    expect(motivo()).toHaveValue('')
    expect(screen.getByText('0/500')).toBeVisible()
  })

  it('cerrada no pinta nada', () => {
    pintar({ abierta: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('RF-11 / CU-11 3a: sin motivo no deja confirmar', async () => {
    const { alConfirmar } = pintar()

    expect(confirmar()).toBeDisabled()

    await userEvent.type(motivo(), '   ')
    expect(confirmar()).toBeDisabled()
    // Ni con Enter desde el formulario.
    await userEvent.click(confirmar())
    expect(alConfirmar).not.toHaveBeenCalled()

    await userEvent.type(motivo(), 'Ya se atendió')
    expect(confirmar()).toBeEnabled()
  })

  it('RF-11 / CU-11 3: confirma con el motivo sin espacios sobrantes', async () => {
    const { alConfirmar } = pintar()

    await userEvent.type(motivo(), '  Ya la atendió el electricista.  ')
    await userEvent.click(confirmar())

    expect(alConfirmar).toHaveBeenCalledExactlyOnceWith('Ya la atendió el electricista.')
  })

  it('ofrece los tres motivos frecuentes de Figma, ninguno elegido al abrir', () => {
    pintar()

    const opciones = within(screen.getByRole('group', { name: 'Motivos frecuentes' }))
      .getAllByRole('button')
      .map((boton) => [boton.textContent, boton.getAttribute('aria-pressed')])
    expect(opciones).toEqual([
      ['Duplicada', 'false'],
      ['Es una solicitud de insumos', 'false'],
      ['No corresponde a Mantenimiento ni a Sistemas', 'false'],
    ])
  })

  it('RF-11: un motivo frecuente llena el campo, queda marcado y deja completar el detalle', async () => {
    const { alConfirmar } = pintar()

    await userEvent.click(frecuente('Duplicada'))

    expect(motivo()).toHaveValue('Duplicada')
    expect(frecuente('Duplicada')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('9/500')).toBeVisible()
    expect(confirmar()).toBeEnabled()

    await userEvent.type(motivo(), ': ya está en atención como NOV-0149.')
    await userEvent.click(confirmar())

    expect(alConfirmar).toHaveBeenCalledExactlyOnceWith(
      'Duplicada: ya está en atención como NOV-0149.',
    )
  })

  it('otro motivo frecuente reemplaza al anterior y conserva lo escrito; el mismo lo quita', async () => {
    pintar()
    await userEvent.type(motivo(), 'la pidieron ayer')

    await userEvent.click(frecuente('Duplicada'))
    expect(motivo()).toHaveValue('Duplicada: la pidieron ayer')

    await userEvent.click(frecuente('Es una solicitud de insumos'))
    expect(motivo()).toHaveValue('Es una solicitud de insumos: la pidieron ayer')
    expect(frecuente('Duplicada')).toHaveAttribute('aria-pressed', 'false')
    expect(frecuente('Es una solicitud de insumos')).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(frecuente('Es una solicitud de insumos'))
    expect(motivo()).toHaveValue('la pidieron ayer')
    expect(frecuente('Es una solicitud de insumos')).toHaveAttribute('aria-pressed', 'false')
  })

  it('el campo no deja pasar de 500 caracteres', async () => {
    pintar()

    await userEvent.click(motivo())
    await userEvent.paste('a'.repeat(520))

    expect(motivo().value).toHaveLength(500)
    expect(screen.getByText('500/500')).toBeVisible()
  })

  it('mientras rechaza, el botón dice «Rechazando…» y no admite otro toque', async () => {
    const { alConfirmar, rerender, alCerrar } = pintar()
    await userEvent.type(motivo(), 'Duplicada')

    rerender(<HojaRechazar abierta alCerrar={alCerrar} alConfirmar={alConfirmar} enCurso />)

    const ocupado = screen.getByRole('button', { name: 'Rechazando…' })
    expect(ocupado).toBeDisabled()
    await userEvent.click(ocupado)
    expect(alConfirmar).not.toHaveBeenCalled()
    // Lo escrito sigue ahí.
    expect(motivo()).toHaveValue('Duplicada')
  })

  it('«Cancelar» cierra la hoja sin confirmar', async () => {
    const { alCerrar, alConfirmar } = pintar()
    await userEvent.type(motivo(), 'Duplicada')

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(alCerrar).toHaveBeenCalled()
    expect(alConfirmar).not.toHaveBeenCalled()
  })

  it('cada vez que se abre, el motivo empieza en blanco', async () => {
    const { rerender, alCerrar, alConfirmar } = pintar()
    await userEvent.type(motivo(), 'Duplicada')

    const props = { alCerrar, alConfirmar, enCurso: false }
    rerender(<HojaRechazar abierta={false} {...props} />)
    rerender(<HojaRechazar abierta {...props} />)

    expect(motivo()).toHaveValue('')
  })

  it('RF-11: si el servidor responde que falta el motivo, señala el campo y la hoja sigue abierta', async () => {
    const alConfirmar = vi.fn().mockResolvedValue({
      ok: false,
      fallo: {
        codigo: 'DATO_OBLIGATORIO',
        mensaje: 'Falta un dato obligatorio. Revisa los campos e intenta de nuevo.',
      },
    })
    pintar({ alConfirmar })
    await userEvent.type(motivo(), 'Duplicada')

    await userEvent.click(confirmar())

    expect(motivo()).toBeInvalid()
    expect(motivo()).toHaveAccessibleDescription(
      'Falta un dato obligatorio. Revisa los campos e intenta de nuevo.',
    )

    // Al corregirlo, el error se quita.
    await userEvent.type(motivo(), ' ya')
    expect(motivo()).not.toBeInvalid()
  })
})
