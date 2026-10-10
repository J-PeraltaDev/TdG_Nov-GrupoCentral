import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Panel } from './Panel.jsx'

/** Una pantalla mínima con el botón que abre el panel, como la lista de usuarios. */
function Ejemplo({ alCerrar = () => {} }) {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => {
    alCerrar()
    setAbierto(false)
  }
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Nuevo usuario
      </button>
      <Panel abierto={abierto} alCerrar={cerrar} titulo="Nuevo usuario">
        <label>
          Nombre completo
          <input name="nombre" />
        </label>
        <button type="button" onClick={cerrar}>
          Cancelar
        </button>
      </Panel>
    </>
  )
}

const abrir = () => userEvent.click(screen.getByRole('button', { name: 'Nuevo usuario' }))

describe('Panel lateral (Figma 29 y 29-B)', () => {
  it('cerrado no expone ningún diálogo ni su contenido', () => {
    render(<Ejemplo />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre completo')).not.toBeInTheDocument()
  })

  it('al abrirlo es un diálogo modal con su título como nombre y el foco adentro', async () => {
    render(<Ejemplo />)

    await abrir()

    const panel = screen.getByRole('dialog', { name: 'Nuevo usuario' })
    expect(panel).toBeVisible()
    expect(panel).toContainElement(document.activeElement)
  })

  it.each([
    ['Escape', () => userEvent.keyboard('{Escape}')],
    ['la equis', () => userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))],
    ['«Cancelar»', () => userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))],
  ])('se cierra con %s y devuelve el foco al botón que lo abrió', async (_, cerrar) => {
    const alCerrar = vi.fn()
    render(<Ejemplo alCerrar={alCerrar} />)
    await abrir()

    await cerrar()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCerrar).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Nuevo usuario' })).toHaveFocus()
  })

  it('tocar el fondo no lo cierra: un toque fuera no cuesta el formulario', async () => {
    render(<Ejemplo />)
    await abrir()
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana')

    await userEvent.click(screen.getByRole('dialog'))

    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Ana')
  })

  it('cada apertura empieza en blanco', async () => {
    render(<Ejemplo />)
    await abrir()
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    await abrir()

    expect(screen.getByLabelText('Nombre completo')).toHaveValue('')
  })
})
