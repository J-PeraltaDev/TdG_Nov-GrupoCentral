import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Estado } from './Estado.jsx'

// Las 9 variantes de Figma (nodo 1:93): estado → etiqueta y tokens de color.
const VARIANTES = [
  ['registrada', 'Registrada', 'registrada'],
  ['asignada', 'Asignada', 'asignada'],
  ['en_atencion', 'En atención', 'atencion'],
  ['escalada', 'Escalada', 'escalada'],
  ['aprobada', 'Aprobada', 'aprobada'],
  ['rechazada', 'Rechazada', 'rechazada'],
  ['resuelta', 'Resuelta', 'resuelta'],
  ['cerrada', 'Cerrada', 'cerrada'],
  ['pendiente', 'Pendiente de sincronizar', 'pendiente'],
]

describe('Estado · sistema de diseño (SDD 5.2, Tabla 28)', () => {
  it.each(VARIANTES)('%s: muestra la etiqueta «%s» con su ícono', (estado, etiqueta) => {
    render(<Estado estado={estado} />)

    const chip = screen.getByText(etiqueta)
    expect(chip).toBeVisible()
    // Nunca solo color: además de la etiqueta lleva un ícono decorativo.
    expect(chip.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it.each(VARIANTES)('%s: usa el texto y el fondo de su token', (estado, etiqueta, token) => {
    render(<Estado estado={estado} />)

    const chip = screen.getByText(etiqueta)
    expect(chip).toHaveClass(`bg-estado-${token}-fondo`, `text-estado-${token}-texto`)
  })

  it('pendiente de sincronizar se distingue además por el borde punteado', () => {
    render(<Estado estado="pendiente" />)

    expect(screen.getByText('Pendiente de sincronizar')).toHaveClass(
      'outline-dashed',
      'outline-estado-pendiente-borde',
    )
  })

  it('no pinta nada si el estado no existe', () => {
    const { container } = render(<Estado estado="inventado" />)

    expect(container).toBeEmptyDOMElement()
  })
})
