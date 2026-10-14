import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CampoFoto } from './CampoFoto.jsx'
import { reducirFoto } from './reducirFoto.js'

// La codificación necesita el navegador: se prueba en la e2e. Aquí, lo que hace el campo.
vi.mock('./reducirFoto.js', () => ({ reducirFoto: vi.fn() }))

function Formulario() {
  const [fotos, setFotos] = useState([])
  return <CampoFoto fotos={fotos} alCambiar={setFotos} />
}

const imagen = (nombre) => new File(['foto'], nombre, { type: 'image/jpeg' })
const elegirDeLaGaleria = (usuario, archivo) =>
  usuario.upload(screen.getByLabelText('Elegir de la galería'), archivo)

describe('Campo Foto de la pantalla 05 (RF-08 / CU-08)', () => {
  /** @type {import('vitest').MockInstance | undefined} */
  let enLinea

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:miniatura')
    URL.revokeObjectURL = vi.fn()
    vi.mocked(reducirFoto).mockReset()
    // 180 KB, como en Figma.
    vi.mocked(reducirFoto).mockResolvedValue(new Blob([new Uint8Array(184_320)]))
  })
  afterEach(() => {
    enLinea?.mockRestore()
  })

  it('RF-08 / CU-08 1 a 4: «Tomar foto» abre la cámara y «Elegir de la galería», las fotos', () => {
    render(<Formulario />)

    expect(screen.getByLabelText('Tomar foto')).toHaveAttribute('capture', 'environment')
    expect(screen.getByLabelText('Elegir de la galería')).not.toHaveAttribute('capture')
    for (const nombre of ['Tomar foto', 'Elegir de la galería']) {
      expect(screen.getByLabelText(nombre)).toHaveAttribute('accept', 'image/*')
      expect(screen.getByRole('button', { name: nombre })).toBeEnabled()
    }
  })

  it('RF-08 / CU-08 4: la foto elegida se reduce y sale con su nombre y su peso; se puede quitar', async () => {
    const usuario = userEvent.setup()
    render(<Formulario />)

    await elegirDeLaGaleria(usuario, imagen('IMG_0412.jpg'))

    const lista = within(await screen.findByRole('list', { name: 'Fotos elegidas' }))
    expect(lista.getByText('IMG_0412.jpg')).toBeVisible()
    expect(lista.getByText('Reducida a 180 KB')).toBeVisible()
    await usuario.click(lista.getByRole('button', { name: 'Quitar IMG_0412.jpg' }))
    expect(screen.queryByRole('list', { name: 'Fotos elegidas' })).not.toBeInTheDocument()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:miniatura')
  })

  it('RF-08 (decisión 37): hasta 3 fotos; después los botones dicen por qué no', async () => {
    const usuario = userEvent.setup()
    render(<Formulario />)

    for (const nombre of ['1.jpg', '2.jpg', '3.jpg']) {
      await elegirDeLaGaleria(usuario, imagen(nombre))
    }

    expect(await screen.findAllByRole('button', { name: /^Quitar / })).toHaveLength(3)
    const tomar = screen.getByRole('button', { name: 'Tomar foto' })
    expect(tomar).toHaveAttribute('aria-disabled', 'true')
    expect(tomar).toHaveAccessibleDescription('Máximo 3 fotos por novedad.')
  })

  it('CU-08 4a (05-D): un archivo que no es imagen, o que no se pudo reducir, se señala', async () => {
    const usuario = userEvent.setup({ applyAccept: false })
    vi.mocked(reducirFoto).mockRejectedValue(Object.assign(new Error(), { name: 'FotoInvalida' }))
    render(<Formulario />)

    await elegirDeLaGaleria(usuario, new File(['texto'], 'notas.txt', { type: 'text/plain' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El archivo no es una imagen o supera el tamaño permitido. Elige otra foto.',
    )
    expect(screen.queryByRole('list', { name: 'Fotos elegidas' })).not.toBeInTheDocument()
  })

  it('CU-08 4b (05-B): sin conexión los dos botones no están disponibles y dicen por qué', () => {
    enLinea = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    render(<Formulario />)

    for (const nombre of ['Tomar foto', 'Elegir de la galería']) {
      const boton = screen.getByRole('button', { name: nombre })
      expect(boton).toHaveAttribute('aria-disabled', 'true')
      expect(boton).toHaveAccessibleDescription(
        'Las fotos necesitan conexión. Podrás adjuntarla desde el detalle cuando la novedad se sincronice.',
      )
    }
  })
})
