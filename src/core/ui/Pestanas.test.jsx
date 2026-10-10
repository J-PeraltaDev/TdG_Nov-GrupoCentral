import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pestanas } from './Pestanas.jsx'

const PESTANAS = [
  { id: 'por_atender', nombre: 'Por atender' },
  { id: 'en_atencion', nombre: 'En atención' },
  { id: 'en_espera', nombre: 'En espera' },
]

function pintar(props = {}) {
  const alElegir = vi.fn()
  render(
    <Pestanas
      etiqueta="Novedades de la bandeja"
      pestanas={PESTANAS}
      elegida="por_atender"
      alElegir={alElegir}
      idDelPanel="lista"
      {...props}
    />,
  )
  return { alElegir }
}

describe('Pestañas (Figma 3:329 y 3:636)', () => {
  it('expone la lista de pestañas con su nombre y marca la elegida', () => {
    pintar()

    const lista = screen.getByRole('tablist', { name: 'Novedades de la bandeja' })
    expect(lista).toBeVisible()
    expect(screen.getAllByRole('tab').map((pestana) => pestana.textContent)).toEqual([
      'Por atender',
      'En atención',
      'En espera',
    ])
    expect(screen.getByRole('tab', { name: 'Por atender' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'En espera' })).toHaveAttribute('aria-selected', 'false')
  })

  it('cada pestaña controla el panel de la lista', () => {
    pintar()

    for (const pestana of screen.getAllByRole('tab')) {
      expect(pestana).toHaveAttribute('aria-controls', 'lista')
    }
  })

  it('al tocar una pestaña avisa cuál se eligió', async () => {
    const { alElegir } = pintar()

    await userEvent.click(screen.getByRole('tab', { name: 'En atención' }))

    expect(alElegir).toHaveBeenCalledExactlyOnceWith('en_atencion')
  })

  it('con el teclado solo la elegida recibe el foco al tabular', async () => {
    pintar({ elegida: 'en_atencion' })

    await userEvent.tab()

    expect(screen.getByRole('tab', { name: 'En atención' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Por atender' })).toHaveAttribute('tabindex', '-1')
  })

  it('las flechas, Inicio y Fin mueven el foco entre las pestañas, con vuelta', async () => {
    const { alElegir } = pintar()
    await userEvent.tab()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'En atención' })).toHaveFocus()

    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'En espera' })).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Por atender' })).toHaveFocus()

    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'En espera' })).toHaveFocus()

    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Por atender' })).toHaveFocus()

    // Mover el foco no cambia de pestaña: se elige con Enter o con la barra espaciadora.
    expect(alElegir).not.toHaveBeenCalled()
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(alElegir).toHaveBeenCalledExactlyOnceWith('en_atencion')
  })

  it.each(['segmentada', 'subrayada'])(
    'la variante «%s» conserva el mismo comportamiento',
    (variante) => {
      pintar({ variante })

      expect(screen.getByRole('tablist')).toHaveAttribute('data-variante', variante)
      expect(screen.getAllByRole('tab')).toHaveLength(3)
    },
  )
})
