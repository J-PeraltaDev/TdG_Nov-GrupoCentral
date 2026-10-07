import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Conexion } from './Conexion.jsx'

// Las 3 variantes de Figma (nodo 1:116).
const VARIANTES = [
  ['en_linea', 'En línea'],
  ['sin_conexion', 'Sin conexión'],
  ['sincronizando', 'En línea · sincronizando'],
]

describe('Conexión · sistema de diseño (RF-23)', () => {
  it.each(VARIANTES)('%s: muestra «%s» y se anuncia como estado', (estado, etiqueta) => {
    render(<Conexion estado={estado} />)

    const indicador = screen.getByRole('status')
    expect(indicador).toHaveTextContent(etiqueta)
    expect(indicador).toHaveAttribute('data-conexion', estado)
  })

  it('en línea: lleva el punto verde de Figma, no un ícono', () => {
    render(<Conexion estado="en_linea" />)

    const indicador = screen.getByRole('status')
    expect(indicador.querySelector('img')).toHaveAttribute('alt', '')
    expect(indicador).toHaveClass('bg-superficie', 'inset-ring-borde')
  })

  it('sin conexión: ícono y colores de advertencia', () => {
    render(<Conexion estado="sin_conexion" />)

    const indicador = screen.getByRole('status')
    expect(indicador.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    expect(indicador).toHaveClass('bg-advertencia-suave', 'text-advertencia')
  })

  it('sincronizando: ícono y colores de información', () => {
    render(<Conexion estado="sincronizando" />)

    const indicador = screen.getByRole('status')
    expect(indicador.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    expect(indicador).toHaveClass('bg-info-suave', 'text-info')
  })

  it('no pinta nada si el estado no existe', () => {
    const { container } = render(<Conexion estado="intermitente" />)

    expect(container).toBeEmptyDOMElement()
  })
})
