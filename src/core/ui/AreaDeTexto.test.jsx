import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { AreaDeTexto } from './AreaDeTexto.jsx'

function Ejemplo(props) {
  const [texto, setTexto] = useState(props.inicial ?? '')
  return (
    <AreaDeTexto
      etiqueta="Motivo del rechazo"
      value={texto}
      onChange={(evento) => setTexto(evento.target.value)}
      {...props}
    />
  )
}

const campo = () => screen.getByRole('textbox', { name: 'Motivo del rechazo' })

describe('Área de texto (Figma: campo de la hoja 16)', () => {
  it('asocia la etiqueta con el campo', () => {
    render(<Ejemplo />)

    expect(campo()).toHaveValue('')
    expect(campo()).not.toBeRequired()
  })

  it('obligatorio: lo marca como requerido; el asterisco es solo visual', () => {
    render(<Ejemplo obligatorio />)

    // El asterisco no entra en el nombre del campo.
    expect(campo()).toBeRequired()
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
  })

  it('con máximo muestra el contador y el campo no deja pasar de ahí', async () => {
    render(<Ejemplo maximo={10} />)
    expect(screen.getByText('0/10')).toBeVisible()

    await userEvent.type(campo(), 'Duplicada, ya existe')

    expect(campo()).toHaveValue('Duplicada,')
    expect(screen.getByText('10/10')).toBeVisible()
  })

  it('sin máximo no hay contador', () => {
    render(<Ejemplo inicial="Duplicada" />)

    expect(screen.queryByText(/\/\d+$/)).not.toBeInTheDocument()
  })

  it('la ayuda describe el campo', () => {
    render(<Ejemplo ayuda="Obligatoria para escalar" />)

    expect(campo()).toHaveAccessibleDescription('Obligatoria para escalar')
    expect(campo()).not.toBeInvalid()
  })

  it('con error lo marca como inválido y el mensaje reemplaza a la ayuda', () => {
    render(<Ejemplo ayuda="Obligatoria para escalar" error="Escribe el motivo." maximo={500} />)

    expect(campo()).toBeInvalid()
    expect(campo()).toHaveAccessibleDescription('Escribe el motivo.')
    expect(screen.queryByText('Obligatoria para escalar')).not.toBeInTheDocument()
    // El contador sigue a la vista.
    expect(screen.getByText('0/500')).toBeVisible()
  })

  it('pasa al campo los demás atributos', () => {
    render(<Ejemplo placeholder="Escribe el motivo" rows={4} />)

    expect(campo()).toHaveAttribute('placeholder', 'Escribe el motivo')
    expect(campo()).toHaveAttribute('rows', '4')
  })
})
