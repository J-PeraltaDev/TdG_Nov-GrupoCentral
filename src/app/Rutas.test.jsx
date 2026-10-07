import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Rutas } from './Rutas.jsx'

function abrir(ruta) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Rutas />
    </MemoryRouter>,
  )
}

describe('Rutas de la aplicación (Sprint 0)', () => {
  it('/ abre la app de prueba con el indicador de conexión', () => {
    abrir('/')

    expect(screen.getByRole('heading', { level: 1, name: 'Novedades' })).toBeVisible()
    expect(screen.getByText('En línea')).toBeVisible()
  })

  it('una ruta que no existe muestra la página de no encontrada, con salida al inicio', () => {
    abrir('/no-existe')

    expect(
      screen.getByRole('heading', { level: 1, name: 'No encontramos esta página' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/')
  })

  it('/_dev/componentes muestra las 28 variantes de los componentes base', async () => {
    abrir('/_dev/componentes')

    expect(await screen.findByRole('heading', { level: 1, name: 'Componentes base' })).toBeVisible()
    // 9 estados + 4 prioridades + 3 conexiones + 12 botones
    expect(document.querySelectorAll('[data-estado]')).toHaveLength(9)
    expect(document.querySelectorAll('[data-prioridad]')).toHaveLength(4)
    expect(document.querySelectorAll('[data-conexion]')).toHaveLength(3)
    expect(screen.getAllByRole('button')).toHaveLength(12)
  })
})
