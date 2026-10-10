import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { CampoCodigo } from './CampoCodigo.jsx'
import { enGrupos, soloDigitos } from './codigoTemporal.js'

function Envoltura({ inicial = '', ...resto }) {
  const [valor, setValor] = useState(inicial)
  return (
    <>
      <CampoCodigo etiqueta="Código temporal" valor={valor} alCambiar={setValor} {...resto} />
      <output data-testid="valor">{valor}</output>
    </>
  )
}

const campo = () => screen.getByLabelText('Código temporal')
const casillas = () => [...document.querySelectorAll('[data-casilla]')].map((c) => c.textContent)

describe('Pantalla 03 · Campo del código temporal (RF-02 / CU-02 8)', () => {
  it('es un solo campo, con el teclado numérico y listo para un código de un solo uso', () => {
    render(<Envoltura />)

    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(campo()).toHaveAttribute('inputmode', 'numeric')
    expect(campo()).toHaveAttribute('autocomplete', 'one-time-code')
  })

  it('pinta cada dígito en su casilla, como en Figma', async () => {
    render(<Envoltura />)

    await userEvent.type(campo(), '482')

    expect(casillas()).toEqual(['4', '8', '2', '', '', ''])
    expect(campo()).toHaveValue('482')
  })

  it('RF-02 / CU-02 8: pegar un código de seis dígitos lo llena', async () => {
    render(<Envoltura />)

    await userEvent.click(campo())
    await userEvent.paste('482719')

    expect(casillas()).toEqual(['4', '8', '2', '7', '1', '9'])
    expect(screen.getByTestId('valor')).toHaveTextContent('482719')
  })

  it('RF-02 / CU-02 8: acepta el código como lo muestra la pantalla 32, con un espacio', async () => {
    render(<Envoltura />)

    await userEvent.click(campo())
    await userEvent.paste(' 482 719 ')

    expect(screen.getByTestId('valor')).toHaveTextContent('482719')
  })

  it('solo deja dígitos, y no más de seis', async () => {
    render(<Envoltura />)

    await userEvent.type(campo(), '4a8-2x7191234')

    expect(screen.getByTestId('valor')).toHaveTextContent('482719')
  })

  it('se puede borrar para corregirlo', async () => {
    render(<Envoltura inicial="482719" />)

    await userEvent.type(campo(), '{Backspace}{Backspace}05')

    expect(screen.getByTestId('valor')).toHaveTextContent('482705')
  })

  it('con error, lo dice a los lectores de pantalla y apunta a su explicación', () => {
    render(<Envoltura conError descritoPor="explicacion" />)

    expect(campo()).toHaveAttribute('aria-invalid', 'true')
    expect(campo()).toHaveAttribute('aria-describedby', 'explicacion')
  })

  it('soloDigitos quita lo que no es un dígito y corta en seis', () => {
    expect(soloDigitos('482 719')).toBe('482719')
    expect(soloDigitos('abc')).toBe('')
    expect(soloDigitos('12345678')).toBe('123456')
    expect(soloDigitos('D4d8')).toBe('48')
    expect(soloDigitos(null)).toBe('')
  })

  it('enGrupos lo escribe como la pantalla 32, y soloDigitos lo deja como estaba', () => {
    expect(enGrupos('482719')).toBe('482 719')
    expect(soloDigitos(enGrupos('007041'))).toBe('007041')
  })
})
