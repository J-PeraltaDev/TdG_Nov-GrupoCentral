import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Dialogo } from './Dialogo.jsx'

/** Una pantalla mínima con el botón que abre el diálogo, como en el detalle. */
function Ejemplo({ alCerrar = () => {}, descripcion = 'Al cerrarla ya no admite más cambios.' }) {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => {
    alCerrar()
    setAbierto(false)
  }
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Confirmar cierre
      </button>
      <Dialogo
        abierto={abierto}
        alCerrar={cerrar}
        titulo="¿Confirmas que la novedad quedó resuelta?"
        descripcion={descripcion}
      >
        <label>
          Observación (opcional)
          <textarea name="observacion" />
        </label>
        <button type="button" onClick={cerrar}>
          Cancelar
        </button>
      </Dialogo>
    </>
  )
}

const abrir = () => userEvent.click(screen.getByRole('button', { name: 'Confirmar cierre' }))

describe('Diálogo de confirmación (Figma 09-C, 28-B, 30 y 32)', () => {
  it('cerrado no expone ningún diálogo ni su contenido', () => {
    render(<Ejemplo />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Observación (opcional)')).not.toBeInTheDocument()
  })

  it('al abrirlo es un diálogo modal con su título como nombre, su descripción y el foco adentro', async () => {
    render(<Ejemplo />)

    await abrir()

    const dialogo = screen.getByRole('dialog', {
      name: '¿Confirmas que la novedad quedó resuelta?',
    })
    expect(dialogo).toBeVisible()
    expect(dialogo).toHaveAccessibleDescription('Al cerrarla ya no admite más cambios.')
    expect(dialogo).toContainElement(document.activeElement)
  })

  it('sin descripción no anuncia ninguna', async () => {
    render(<Ejemplo descripcion={null} />)

    await abrir()

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby')
  })

  it('se cierra con Escape y devuelve el foco al botón que lo abrió', async () => {
    const alCerrar = vi.fn()
    render(<Ejemplo alCerrar={alCerrar} />)
    await abrir()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCerrar).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Confirmar cierre' })).toHaveFocus()
  })

  it('se cierra con el botón «Cancelar» del contenido', async () => {
    render(<Ejemplo />)
    await abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar cierre' })).toHaveFocus()
  })

  it('se cierra al tocar el fondo, pero no al tocar el contenido', async () => {
    render(<Ejemplo />)
    await abrir()

    await userEvent.click(screen.getByLabelText('Observación (opcional)'))
    expect(screen.getByRole('dialog')).toBeVisible()

    await userEvent.click(screen.getByRole('dialog'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cada apertura empieza en blanco', async () => {
    render(<Ejemplo />)
    await abrir()
    await userEvent.type(screen.getByLabelText('Observación (opcional)'), 'Quedó bien')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    await abrir()

    expect(screen.getByLabelText('Observación (opcional)')).toHaveValue('')
  })
})
