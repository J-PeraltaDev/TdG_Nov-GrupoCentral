import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Boton } from './Boton.jsx'
import iconoSync from './iconos/sync.svg'

// Figma (nodo 1:153): 6 tipos × 2 tamaños = 12 variantes. «Deshabilitado» es `disabled`.
const TIPOS = [
  ['primario', ['bg-primario', 'text-sobre-primario']],
  ['secundario', ['bg-superficie', 'text-texto', 'inset-ring-borde']],
  ['secundario-peligro', ['bg-superficie', 'text-error', 'inset-ring-borde']],
  ['texto', ['text-primario']],
  ['peligro', ['bg-error', 'text-sobre-primario']],
]

const TAMANOS = [
  ['movil', ['h-12', 'px-5', 'text-cuerpo-fuerte']],
  ['escritorio', ['h-10', 'px-4', 'text-etiqueta-fuerte']],
]

const VARIANTES = TIPOS.flatMap(([tipo, clasesTipo]) =>
  TAMANOS.map(([tamano, clasesTamano]) => [tipo, tamano, [...clasesTipo, ...clasesTamano]]),
)

describe('Botón · sistema de diseño (SDD 5.2)', () => {
  it.each(VARIANTES)('%s en %s: pinta el texto con sus tokens', (tipo, tamano, clases) => {
    render(
      <Boton tipo={tipo} tamano={tamano}>
        Guardar
      </Boton>,
    )

    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveClass(...clases)
  })

  it.each(TAMANOS)('deshabilitado en %s: gris y sin interacción', async (tamano, clases) => {
    const alPulsar = vi.fn()
    render(
      <Boton tamano={tamano} disabled onClick={alPulsar}>
        Confirmar
      </Boton>,
    )

    const boton = screen.getByRole('button', { name: 'Confirmar' })
    expect(boton).toBeDisabled()
    expect(boton).toHaveClass('bg-gris-200', 'text-deshabilitado', ...clases)
    expect(boton).not.toHaveClass('bg-primario')

    await userEvent.click(boton)
    expect(alPulsar).not.toHaveBeenCalled()
  })

  it('sin tamaño se adapta: 48 px en el teléfono y 40 px en el escritorio', () => {
    render(<Boton>Registrar novedad</Boton>)

    expect(screen.getByRole('button', { name: 'Registrar novedad' })).toHaveClass('h-12', 'lg:h-10')
  })

  it('avisa al pulsarlo y no envía formularios por accidente', async () => {
    const alPulsar = vi.fn()
    render(<Boton onClick={alPulsar}>Tomar para atención</Boton>)

    const boton = screen.getByRole('button', { name: 'Tomar para atención' })
    await userEvent.click(boton)

    expect(alPulsar).toHaveBeenCalledTimes(1)
    expect(boton).toHaveAttribute('type', 'button')
  })

  it('acepta type="submit" para los formularios', () => {
    render(<Boton type="submit">Ingresar</Boton>)

    expect(screen.getByRole('button', { name: 'Ingresar' })).toHaveAttribute('type', 'submit')
  })

  it('el ícono es opcional y decorativo: no cambia el nombre accesible', () => {
    render(<Boton icono={iconoSync}>Reintentar</Boton>)

    const boton = screen.getByRole('button', { name: 'Reintentar' })
    expect(boton.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})
