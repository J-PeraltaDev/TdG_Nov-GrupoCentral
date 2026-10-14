import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnuncioDeConexion, Conexion } from './Conexion.jsx'

// Las 3 variantes de Figma (nodo 1:116).
const VARIANTES = [
  ['en_linea', 'En línea'],
  ['sin_conexion', 'Sin conexión'],
  ['sincronizando', 'En línea · sincronizando'],
]

const indicador = () => document.querySelector('[data-conexion]')

describe('Conexión · sistema de diseño (RF-23)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(VARIANTES)('%s: muestra «%s»', (estado, etiqueta) => {
    render(<Conexion estado={estado} />)

    expect(indicador()).toHaveTextContent(etiqueta)
    expect(indicador()).toHaveAttribute('data-conexion', estado)
  })

  it('RF-23: no se anuncia por sí mismo (lo hace la región única del marco)', () => {
    render(<Conexion estado="sin_conexion" />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(indicador()).not.toHaveAttribute('aria-live')
  })

  it('en línea: lleva el punto verde de Figma, no un ícono', () => {
    render(<Conexion estado="en_linea" />)

    expect(indicador().querySelector('img')).toHaveAttribute('alt', '')
    expect(indicador()).toHaveClass('bg-superficie', 'inset-ring-borde')
  })

  it('sin conexión: ícono y colores de advertencia', () => {
    render(<Conexion estado="sin_conexion" />)

    expect(indicador().querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    expect(indicador()).toHaveClass('bg-advertencia-suave', 'text-advertencia')
  })

  it('sincronizando: ícono y colores de información', () => {
    render(<Conexion estado="sincronizando" />)

    expect(indicador().querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    expect(indicador()).toHaveClass('bg-info-suave', 'text-info')
  })

  it('no pinta nada si el estado no existe', () => {
    const { container } = render(<Conexion estado="intermitente" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('RF-23 / CU-23 2: sin estado fijo, sigue al monitor de conexión', () => {
    render(<Conexion />)
    expect(indicador()).toHaveTextContent('En línea')

    act(() => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(indicador()).toHaveTextContent('Sin conexión')
  })
})

describe('Conexión · texto con las pendientes (RF-23 / CU-23 3)', () => {
  it.each([
    ['sin_conexion', 0, 'Sin conexión'],
    ['sin_conexion', 1, 'Sin conexión · 1 pendiente'],
    ['sin_conexion', 2, 'Sin conexión · 2 pendientes'],
    ['en_linea', 3, 'En línea · 3 pendientes'],
    ['sincronizando', 3, 'En línea · sincronizando'],
  ])('%s con %i: «%s»', (estado, pendientes, texto) => {
    render(<Conexion estado={estado} pendientes={pendientes} />)

    expect(indicador()).toHaveTextContent(texto)
  })

  it('RF-23: una sola región anuncia el estado, con las pendientes', () => {
    render(<AnuncioDeConexion />)

    const region = document.querySelector('[aria-live="polite"]')
    expect(region).toHaveTextContent('En línea')
    expect(region).toHaveClass('sr-only')
  })
})
