import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Paginacion } from './Paginacion.jsx'

describe('Páginas con número (Figma 21; plan del Sprint 5, decisión 12)', () => {
  it('RF-19: «1–20 de 45» sin nombre, la actual marcada y cada número lleva a su página', async () => {
    const alCambiar = vi.fn()
    const { rerender } = render(
      <Paginacion
        pagina={0}
        ultima={2}
        desde={0}
        visibles={20}
        total={45}
        numeros
        alCambiar={alCambiar}
      />,
    )

    expect(screen.getByText('1–20 de 45')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('button', { name: 'Página 3' }))
    expect(alCambiar).toHaveBeenCalledWith(2)

    // Las cifras con el separador de miles de Colombia.
    rerender(
      <Paginacion
        pagina={0}
        ultima={54}
        desde={0}
        visibles={20}
        total={1082}
        numeros
        alCambiar={alCambiar}
      />,
    )
    expect(screen.getByText('1–20 de 1.082')).toBeInTheDocument()
  })

  it('RF-03 / RF-04: con el nombre, como 28 y 30, y sin números', () => {
    render(
      <Paginacion
        pagina={0}
        ultima={1}
        desde={0}
        visibles={7}
        total={12}
        singular="finca"
        plural="fincas"
        alCambiar={() => {}}
      />,
    )

    expect(screen.getByText('1–7 de 12 fincas')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Página 1' })).not.toBeInTheDocument()
  })
})
