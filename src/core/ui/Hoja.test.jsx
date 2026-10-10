import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Hoja } from './Hoja.jsx'

/** Una pantalla mínima con el botón que abre la hoja, como en el detalle. */
function Ejemplo({ alCerrar = () => {} }) {
  const [abierta, setAbierta] = useState(false)
  const cerrar = () => {
    alCerrar()
    setAbierta(false)
  }
  return (
    <>
      <button type="button" onClick={() => setAbierta(true)}>
        Rechazar
      </button>
      <Hoja abierta={abierta} alCerrar={cerrar} titulo="Rechazar novedad">
        <label>
          Motivo del rechazo
          <textarea name="motivo" />
        </label>
        <button type="button" onClick={cerrar}>
          Cancelar
        </button>
      </Hoja>
    </>
  )
}

describe('Hoja inferior (Figma 15, 16 y 17)', () => {
  it('cerrada no expone ningún diálogo ni su contenido', () => {
    render(<Ejemplo />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Motivo del rechazo')).not.toBeInTheDocument()
  })

  it('al abrirla es un diálogo modal con su título como nombre y el foco adentro', async () => {
    render(<Ejemplo />)

    await userEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    const hoja = screen.getByRole('dialog', { name: 'Rechazar novedad' })
    expect(hoja).toBeVisible()
    expect(hoja).toContainElement(document.activeElement)
  })

  it('se cierra con Escape y devuelve el foco al botón que la abrió', async () => {
    const alCerrar = vi.fn()
    render(<Ejemplo alCerrar={alCerrar} />)
    const abrir = screen.getByRole('button', { name: 'Rechazar' })
    await userEvent.click(abrir)

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCerrar).toHaveBeenCalled()
    expect(abrir).toHaveFocus()
  })

  it('se cierra con el botón «Cancelar» del contenido', async () => {
    render(<Ejemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechazar' })).toHaveFocus()
  })

  it('se cierra al tocar el fondo, pero no al tocar el contenido', async () => {
    render(<Ejemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    await userEvent.click(screen.getByLabelText('Motivo del rechazo'))
    expect(screen.getByRole('dialog')).toBeVisible()

    await userEvent.click(screen.getByRole('dialog'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cada apertura empieza en blanco', async () => {
    render(<Ejemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    await userEvent.type(screen.getByLabelText('Motivo del rechazo'), 'Duplicada')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    await userEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    expect(screen.getByLabelText('Motivo del rechazo')).toHaveValue('')
  })
})
