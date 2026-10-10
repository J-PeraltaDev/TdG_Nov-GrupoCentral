import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sugerirTiposFalla } from '../../core/supabase/repositorios/tiposFalla.js'
import { SelectorDeTipoDeFalla } from './SelectorDeTipoDeFalla.jsx'

vi.mock('../../core/supabase/repositorios/tiposFalla.js', () => ({
  sugerirTiposFalla: vi.fn(),
}))

const BIOMETRICO = {
  id: 'tipo-b',
  nombre: 'Biométrico',
  cantidad_novedades: 11,
  coincidencia_exacta: true,
}
const BIOMETRICO_DE_SALIDA = {
  id: 'tipo-bs',
  nombre: 'Biométrico de salida',
  cantidad_novedades: 1,
  coincidencia_exacta: false,
}

function Ejemplo({ alCambiar = () => {}, inicial = null, error = null }) {
  const [valor, setValor] = useState(inicial)
  return (
    <SelectorDeTipoDeFalla
      valor={valor}
      error={error}
      alCambiar={(nuevo) => {
        alCambiar(nuevo)
        setValor(nuevo)
      }}
    />
  )
}

const campo = () => screen.getByRole('combobox', { name: 'Tipo de falla' })
const lista = () => screen.getByRole('listbox', { name: 'Tipos de falla' })
const opciones = () => within(lista()).getAllByRole('option')
const crear = (texto) => screen.getByRole('option', { name: `Crear tipo nuevo «${texto}»` })

/** Escribe y espera a que lleguen las sugerencias de ese texto, con los espacios arreglados. */
async function escribir(texto) {
  await userEvent.type(campo(), texto)
  const buscado = texto.trim().replace(/\s+/g, ' ')
  await vi.waitFor(() => expect(sugerirTiposFalla).toHaveBeenLastCalledWith(buscado))
  await screen.findByRole('option', { name: /Crear tipo nuevo/ })
}

describe('Selector de tipo de falla (RF-14 / CU-14 3 a 5, Figma 18)', () => {
  beforeEach(() => {
    vi.mocked(sugerirTiposFalla).mockReset()
    vi.mocked(sugerirTiposFalla).mockResolvedValue([])
  })

  it('RF-14 / CU-14 2: es un campo obligatorio con autocompletado; sin texto no hay lista ni consulta', async () => {
    render(<Ejemplo />)

    expect(campo()).toBeRequired()
    expect(campo()).toHaveAttribute('aria-autocomplete', 'list')
    expect(campo()).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(campo())
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(sugerirTiposFalla).not.toHaveBeenCalled()
  })

  it('RF-14 / CU-14 3 y 4: al escribir sugiere los tipos que coinciden, con cuántas novedades tiene cada uno', async () => {
    vi.mocked(sugerirTiposFalla).mockResolvedValue([
      { ...BIOMETRICO, coincidencia_exacta: false },
      BIOMETRICO_DE_SALIDA,
    ])
    render(<Ejemplo />)

    await escribir('biom')

    expect(campo()).toHaveAttribute('aria-expanded', 'true')
    expect(opciones().map((opcion) => opcion.textContent)).toEqual([
      'Biométrico11 novedades',
      'Biométrico de salida1 novedad',
      'Crear tipo nuevo «biom»',
    ])
    expect(screen.getByRole('status')).toHaveTextContent('2 tipos coinciden.')
  })

  it('espera a que la persona deje de escribir: una sola consulta, con el texto completo', async () => {
    render(<Ejemplo />)

    await escribir('biometrico')

    expect(sugerirTiposFalla).toHaveBeenCalledExactlyOnceWith('biometrico')
  })

  it('RF-14 / CU-14 5a: con una coincidencia exacta la marca, no deja crear uno nuevo y explica por qué', async () => {
    vi.mocked(sugerirTiposFalla).mockResolvedValue([BIOMETRICO])
    const alCambiar = vi.fn()
    render(<Ejemplo alCambiar={alCambiar} />)

    await escribir('biometrico')

    expect(within(opciones()[0]).getByText('Coincide')).toBeVisible()
    expect(crear('biometrico')).toHaveAttribute('aria-disabled', 'true')
    expect(
      screen.getByText(
        'Ya existe «Biométrico». Solo cambia en mayúsculas o tildes, así que se usará el tipo existente.',
      ),
    ).toBeVisible()

    // Tocar la opción deshabilitada no elige nada.
    await userEvent.click(crear('biometrico'))
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('si lo escrito es idéntico al tipo que existe, no hace falta la explicación', async () => {
    vi.mocked(sugerirTiposFalla).mockResolvedValue([BIOMETRICO])
    render(<Ejemplo />)

    await escribir('Biométrico')

    expect(screen.queryByText(/Ya existe/)).not.toBeInTheDocument()
    expect(crear('Biométrico')).toHaveAttribute('aria-disabled', 'true')
  })

  it('RF-14 / CU-14 5: al elegir un tipo existente lo entrega con su identificador y lo muestra con su conteo', async () => {
    vi.mocked(sugerirTiposFalla).mockResolvedValue([BIOMETRICO])
    const alCambiar = vi.fn()
    render(<Ejemplo alCambiar={alCambiar} />)
    await escribir('biometrico')

    await userEvent.click(screen.getByRole('option', { name: /Biométrico/ }))

    expect(alCambiar).toHaveBeenCalledExactlyOnceWith({
      id: 'tipo-b',
      nombre: 'Biométrico',
      cantidad: 11,
    })
    const elegido = within(screen.getByRole('group', { name: 'Tipo de falla' }))
    expect(elegido.getByText('Biométrico')).toBeVisible()
    expect(elegido.getByText('11 novedades')).toBeVisible()
    expect(screen.getByText('Este dato alimenta el indicador de fallas recurrentes.')).toBeVisible()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('RF-14 / CU-14 5: sin coincidencias deja crear un tipo nuevo, con los espacios arreglados', async () => {
    const alCambiar = vi.fn()
    render(<Ejemplo alCambiar={alCambiar} />)

    await escribir('  Cable   vía ')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Ningún tipo coincide. Puedes crear uno nuevo.',
    )
    await userEvent.click(crear('Cable vía'))

    expect(alCambiar).toHaveBeenCalledExactlyOnceWith({
      id: null,
      nombre: 'Cable vía',
      cantidad: null,
    })
    const elegido = within(screen.getByRole('group', { name: 'Tipo de falla' }))
    expect(elegido.getByText('Cable vía')).toBeVisible()
    expect(elegido.getByText('Tipo nuevo')).toBeVisible()
  })

  it('con el teclado: las flechas recorren las opciones que se pueden elegir y Enter elige', async () => {
    vi.mocked(sugerirTiposFalla).mockResolvedValue([BIOMETRICO, BIOMETRICO_DE_SALIDA])
    const alCambiar = vi.fn()
    render(<Ejemplo alCambiar={alCambiar} />)
    await escribir('biometrico')

    await userEvent.keyboard('{ArrowDown}')
    expect(campo()).toHaveAttribute('aria-activedescendant', opciones()[0].id)
    expect(opciones()[0]).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{ArrowDown}')
    expect(opciones()[1]).toHaveAttribute('aria-selected', 'true')

    // «Crear tipo nuevo» está deshabilitada: la flecha la salta y vuelve al comienzo.
    await userEvent.keyboard('{ArrowDown}')
    expect(opciones()[0]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowUp}')
    expect(opciones()[1]).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{Enter}')
    expect(alCambiar).toHaveBeenCalledExactlyOnceWith({
      id: 'tipo-bs',
      nombre: 'Biométrico de salida',
      cantidad: 1,
    })
  })

  it('Enter sin una opción activa no elige nada ni envía el formulario', async () => {
    const alEnviar = vi.fn((evento) => evento.preventDefault())
    const alCambiar = vi.fn()
    render(
      <form onSubmit={alEnviar}>
        <Ejemplo alCambiar={alCambiar} />
      </form>,
    )
    await escribir('cable')

    await userEvent.keyboard('{Enter}')

    expect(alEnviar).not.toHaveBeenCalled()
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('Escape cierra la lista y conserva lo escrito', async () => {
    render(<Ejemplo />)
    await escribir('cable')

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(campo()).toHaveValue('cable')
    expect(campo()).toHaveAttribute('aria-expanded', 'false')
  })

  it('el botón de borrar limpia lo escrito y deja el foco en el campo', async () => {
    render(<Ejemplo />)
    await escribir('cable')

    await userEvent.click(screen.getByRole('button', { name: 'Borrar lo escrito' }))

    expect(campo()).toHaveValue('')
    expect(campo()).toHaveFocus()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('un tipo elegido se puede cambiar: vuelve al campo de búsqueda, en blanco', async () => {
    const alCambiar = vi.fn()
    render(
      <Ejemplo
        alCambiar={alCambiar}
        inicial={{ id: 'tipo-b', nombre: 'Biométrico', cantidad: 9 }}
      />,
    )
    expect(screen.getByText('9 novedades')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar el tipo de falla' }))

    expect(alCambiar).toHaveBeenCalledExactlyOnceWith(null)
    expect(campo()).toHaveValue('')
  })

  it('si la búsqueda falla, lo dice y deja crear el tipo por su nombre', async () => {
    vi.mocked(sugerirTiposFalla).mockRejectedValue(new TypeError('Failed to fetch'))
    const alCambiar = vi.fn()
    render(<Ejemplo alCambiar={alCambiar} />)

    await userEvent.type(campo(), 'cable')

    expect(
      await screen.findByText('No pudimos buscar los tipos. Revisa tu conexión.', {
        selector: 'p:not([role])',
      }),
    ).toBeVisible()
    // El servidor normaliza el nombre: si ya existe, usará el existente.
    await userEvent.click(crear('cable'))
    expect(alCambiar).toHaveBeenCalledExactlyOnceWith({ id: null, nombre: 'cable', cantidad: null })
  })

  it('con error lo marca como inválido y el mensaje lo describe', () => {
    render(<Ejemplo error="Elige un tipo de falla o crea uno nuevo." />)

    expect(campo()).toBeInvalid()
    expect(campo()).toHaveAccessibleDescription('Elige un tipo de falla o crea uno nuevo.')
  })

  it('no deja escribir un nombre de más de 60 caracteres', async () => {
    render(<Ejemplo />)

    await userEvent.click(campo())
    await userEvent.paste('a'.repeat(80))

    expect(campo().value).toHaveLength(60)
  })
})
