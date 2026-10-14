import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cambiarSincronizacion } from '../offline/estadoDeSincronizacion.js'
import { AnuncioDeConexion, Conexion } from './Conexion.jsx'

// Las pendientes del usuario: cada prueba dice cuántas hay.
const cola = vi.hoisted(() => ({ cantidad: 0 }))
vi.mock('../offline/pendientes.js', () => ({ usePendientes: () => cola.cantidad }))

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
    cola.cantidad = 0
    cambiarSincronizacion({ enCurso: false, total: 0 })
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

describe('Conexión · enlace a las pendientes y sincronización (RF-22, RF-23)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    cola.cantidad = 0
    cambiarSincronizacion({ enCurso: false, total: 0 })
  })

  it('RF-23: con pendientes es el enlace a la pantalla 08, con un nombre que dice adónde lleva', () => {
    cola.cantidad = 2
    render(
      <MemoryRouter>
        <Conexion />
      </MemoryRouter>,
    )

    const enlace = screen.getByRole('link', { name: 'En línea · 2 pendientes: ver la lista' })
    expect(enlace).toHaveAttribute('href', '/pendientes')
  })

  it('RF-23: sin pendientes no es un enlace', () => {
    render(<Conexion />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('RF-22 / CU-22: mientras envía dice «En línea · sincronizando», y el anuncio también', () => {
    cola.cantidad = 2
    cambiarSincronizacion({ enCurso: true, total: 2 })
    render(
      <MemoryRouter>
        <Conexion />
        <AnuncioDeConexion />
      </MemoryRouter>,
    )

    expect(indicador()).toHaveTextContent('En línea · sincronizando')
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
      'En línea · sincronizando',
    )
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
