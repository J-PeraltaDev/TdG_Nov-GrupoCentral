import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Prioridad } from './Prioridad.jsx'

// Las 4 variantes de Figma (nodo 1:106).
const VARIANTES = [
  ['critico', 'Crítico'],
  ['alto', 'Alto'],
  ['normal', 'Normal'],
  ['bajo', 'Bajo'],
]

describe('Prioridad · sistema de diseño (SDD 5.2)', () => {
  it.each(VARIANTES)('%s: muestra la etiqueta «%s» con su ícono', (prioridad, etiqueta) => {
    render(<Prioridad prioridad={prioridad} />)

    const pastilla = screen.getByText(etiqueta)
    expect(pastilla).toBeVisible()
    expect(pastilla.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it.each(VARIANTES)('%s: fondo sólido de su token y texto blanco', (prioridad, etiqueta) => {
    render(<Prioridad prioridad={prioridad} />)

    expect(screen.getByText(etiqueta)).toHaveClass(
      `bg-prioridad-${prioridad}`,
      'text-sobre-primario',
    )
  })

  it('no pinta nada si la prioridad no existe', () => {
    const { container } = render(<Prioridad prioridad="urgentisimo" />)

    expect(container).toBeEmptyDOMElement()
  })
})
