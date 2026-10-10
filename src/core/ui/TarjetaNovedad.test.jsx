import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TarjetaNovedad } from './TarjetaNovedad.jsx'

const NOVEDAD = {
  id: 'n-153',
  codigo: 153,
  descripcion: 'El torniquete de la entrada principal marca luz verde pero no gira.',
  prioridad: 'critico',
  estado: 'asignada',
  area: 'Sistemas',
  finca: 'Finca de prueba 01',
  fecha_registro: '2026-09-24T12:40:00Z',
}

function pintar(props) {
  render(
    <MemoryRouter>
      <ul>
        <TarjetaNovedad novedad={NOVEDAD} {...props} />
      </ul>
    </MemoryRouter>,
  )
  return within(screen.getByRole('listitem'))
}

describe('Tarjeta de novedad (Figma 2:36 y 3:338)', () => {
  beforeEach(() => {
    // 25 minutos después del registro.
    vi.useFakeTimers({ now: new Date('2026-09-24T13:05:00Z') })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('RF-18: muestra el código, el estado, la prioridad, la descripción y el tiempo', () => {
    const tarjeta = pintar()

    expect(tarjeta.getByRole('heading', { level: 2, name: 'NOV-0153' })).toBeVisible()
    expect(tarjeta.getByText('Asignada')).toBeVisible()
    expect(tarjeta.getByText('Crítico')).toBeVisible()
    expect(tarjeta.getByText(NOVEDAD.descripcion)).toBeVisible()
    expect(tarjeta.getByText('hace 25 min')).toHaveAttribute('datetime', NOVEDAD.fecha_registro)
  })

  it('RF-18: al reportante le muestra el área que atiende', () => {
    const tarjeta = pintar()

    expect(tarjeta.getByText('Sistemas')).toBeVisible()
    expect(tarjeta.queryByText('Finca de prueba 01')).not.toBeInTheDocument()
  })

  it('RF-09 / CU-09 3: al aprobador le muestra la finca que reporta', () => {
    const tarjeta = pintar({ pie: 'finca' })

    expect(tarjeta.getByText('Finca de prueba 01')).toBeVisible()
    expect(tarjeta.queryByText('Sistemas')).not.toBeInTheDocument()
  })

  it('RF-09 / CU-09 4: con una ruta, el código es el enlace que abre la novedad', () => {
    const tarjeta = pintar({ a: '/novedades/n-153' })

    expect(tarjeta.getByRole('link', { name: 'NOV-0153' })).toHaveAttribute(
      'href',
      '/novedades/n-153',
    )
  })

  it('sin ruta, la tarjeta no ofrece ningún enlace', () => {
    const tarjeta = pintar()

    expect(tarjeta.queryByRole('link')).not.toBeInTheDocument()
  })
})
