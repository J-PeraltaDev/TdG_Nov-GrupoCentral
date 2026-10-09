import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HojaEscalar } from './HojaEscalar.jsx'

const NOVEDAD = { codigo: 150, finca: 'Pavarandó', prioridad: 'critico' }

function pintar(props = {}) {
  const alCerrar = vi.fn()
  const alConfirmar = vi.fn().mockResolvedValue({ ok: true })
  const utilidades = render(
    <HojaEscalar
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

const hoja = () => screen.getByRole('dialog', { name: 'Escalar al director de agricultura' })
const justificacion = () => screen.getByRole('textbox', { name: 'Justificación' })
const confirmar = () => screen.getByRole('button', { name: 'Escalar novedad' })

describe('Hoja 15 · Escalar al director de agricultura (RF-12 / CU-12)', () => {
  it('RF-12 / CU-12 2: pide la justificación y explica cuándo conviene escalar', () => {
    pintar()

    expect(hoja()).toBeVisible()
    expect(
      screen.getByText(
        'Úsalo cuando la solución necesita una autorización mayor, por ejemplo, la compra de repuestos. La novedad quedará Escalada hasta que el director decida.',
      ),
    ).toBeVisible()
    expect(justificacion()).toBeRequired()
    expect(justificacion()).toHaveValue('')
    expect(justificacion()).toHaveAccessibleDescription('Obligatoria para escalar')
    expect(screen.getByText('0/500')).toBeVisible()
    expect(screen.getByText('Se avisará al director de agricultura y a la finca.')).toBeVisible()
  })

  it('muestra la novedad que se va a escalar: código, finca y prioridad', () => {
    pintar()

    const resumen = within(screen.getByText('NOV-0150').closest('p'))
    expect(resumen.getByText(/Pavarandó/)).toBeVisible()
    expect(resumen.getByText('Crítico')).toBeVisible()
  })

  it('cerrada no pinta nada', () => {
    pintar({ abierta: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('RF-12 / CU-12 3a: sin justificación no deja confirmar', async () => {
    const { alConfirmar } = pintar()

    expect(confirmar()).toBeDisabled()

    await userEvent.type(justificacion(), '   ')
    expect(confirmar()).toBeDisabled()
    await userEvent.click(confirmar())
    expect(alConfirmar).not.toHaveBeenCalled()

    await userEvent.type(justificacion(), 'Hay que comprar un router')
    expect(confirmar()).toBeEnabled()
  })

  it('RF-12 / CU-12 3: confirma con la justificación sin espacios sobrantes', async () => {
    const { alConfirmar } = pintar()

    await userEvent.type(justificacion(), '  El router se quemó; hay que comprar uno nuevo.  ')
    expect(screen.getByText('50/500')).toBeVisible()
    await userEvent.click(confirmar())

    expect(alConfirmar).toHaveBeenCalledExactlyOnceWith(
      'El router se quemó; hay que comprar uno nuevo.',
    )
  })

  it('el campo no deja pasar de 500 caracteres', async () => {
    pintar()

    await userEvent.click(justificacion())
    await userEvent.paste('a'.repeat(520))

    expect(justificacion().value).toHaveLength(500)
    expect(screen.getByText('500/500')).toBeVisible()
  })

  it('mientras escala, el botón dice «Escalando…» y no admite otro toque', async () => {
    const { alConfirmar, alCerrar, rerender } = pintar()
    await userEvent.type(justificacion(), 'Hay que comprar un router')

    rerender(
      <HojaEscalar
        abierta
        novedad={NOVEDAD}
        alCerrar={alCerrar}
        alConfirmar={alConfirmar}
        enCurso
      />,
    )

    const ocupado = screen.getByRole('button', { name: 'Escalando…' })
    expect(ocupado).toBeDisabled()
    await userEvent.click(ocupado)
    expect(alConfirmar).not.toHaveBeenCalled()
    expect(justificacion()).toHaveValue('Hay que comprar un router')
  })

  it('«Cancelar» cierra la hoja sin confirmar', async () => {
    const { alCerrar, alConfirmar } = pintar()
    await userEvent.type(justificacion(), 'Hay que comprar un router')

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(alCerrar).toHaveBeenCalled()
    expect(alConfirmar).not.toHaveBeenCalled()
  })

  it('RF-12: si el servidor responde que falta la justificación, señala el campo', async () => {
    const alConfirmar = vi.fn().mockResolvedValue({
      ok: false,
      fallo: {
        codigo: 'DATO_OBLIGATORIO',
        mensaje: 'Falta un dato obligatorio. Revisa los campos e intenta de nuevo.',
      },
    })
    pintar({ alConfirmar })
    await userEvent.type(justificacion(), 'Hay que comprar un router')

    await userEvent.click(confirmar())

    expect(justificacion()).toBeInvalid()
    expect(justificacion()).toHaveAccessibleDescription(
      'Falta un dato obligatorio. Revisa los campos e intenta de nuevo.',
    )
  })
})
