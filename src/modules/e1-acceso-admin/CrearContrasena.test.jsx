import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { restablecerContrasena } from '../../core/supabase/repositorios/recuperacion.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import CrearContrasena from './CrearContrasena.jsx'

// Se simula el repositorio, nunca la red.
vi.mock('../../core/supabase/repositorios/recuperacion.js', () => ({
  restablecerContrasena: vi.fn(),
}))

const CORREO = 'persona@novedades.test'
const CONTRASENA = 'Banano-4821'
const CODIGO_INVALIDO = 'El código no es válido. Revísalo; si sigue sin servir, pide uno nuevo.'
const CODIGO_VENCIDO = 'El código venció. Pide uno nuevo al administrador.'

/** Un error como los que lanza `invocarFuncion`: el mensaje es el código. */
function errorDeFuncion(codigo, campos = []) {
  return Object.assign(new Error(codigo), { name: 'ErrorDeFuncion', status: 400, campos })
}

/** Muestra a dónde se llegó y con qué estado, sin que nada vaya en la dirección. */
function Destino({ nombre }) {
  const { state, search } = useLocation()
  return (
    <>
      <h1>{nombre}</h1>
      <output data-testid="estado">{JSON.stringify(state ?? {})}</output>
      <output data-testid="consulta">{search}</output>
    </>
  )
}

function abrir(estado = { correo: CORREO }) {
  return pintarConSesion(
    <Routes>
      <Route path="/recuperar/codigo" element={<CrearContrasena />} />
      <Route path="/recuperar" element={<Destino nombre="Recuperar contraseña" />} />
      <Route path="/ingresar" element={<Destino nombre="Ingreso" />} />
    </Routes>,
    { ruta: { pathname: '/recuperar/codigo', state: estado } },
  )
}

const correo = () => screen.getByLabelText('Correo')
const codigo = () => screen.getByLabelText('Código temporal')
const contrasena = () => screen.getByLabelText('Contraseña nueva')
const confirmacion = () => screen.getByLabelText('Confirmar contraseña')
const guardar = () => screen.getByRole('button', { name: 'Guardar contraseña' })
const regla = (texto) =>
  within(screen.getByRole('list', { name: 'Requisitos de la contraseña' }))
    .getAllByRole('listitem')
    .find((item) => item.textContent.includes(texto))

async function llenar({
  elCodigo = '482719',
  laContrasena = CONTRASENA,
  laConfirmacion = laContrasena,
} = {}) {
  if (elCodigo) await userEvent.type(codigo(), elCodigo)
  if (laContrasena) await userEvent.type(contrasena(), laContrasena)
  if (laConfirmacion) await userEvent.type(confirmacion(), laConfirmacion)
}

beforeEach(() => {
  restablecerContrasena.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  // También las respuestas «una vez» que una prueba fallida haya dejado sin usar.
  vi.resetAllMocks()
})

describe('Pantalla 03 · Crear contraseña nueva (RF-02 / CU-02 8)', () => {
  it('muestra los textos de Figma, con el correo que viene de la pantalla anterior', () => {
    abrir()

    expect(screen.getByRole('heading', { level: 1, name: 'Crear contraseña nueva' })).toBeVisible()
    expect(correo()).toHaveValue(CORREO)
    expect(codigo()).toHaveValue('')
    expect(contrasena()).toHaveAttribute('type', 'password')
    expect(confirmacion()).toHaveAttribute('type', 'password')
    expect(regla('Mínimo 8 caracteres')).toBeVisible()
    expect(regla('Al menos una letra y un número')).toBeVisible()
    expect(guardar()).toBeEnabled()
    expect(screen.getByText('El código solo sirve una vez.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Volver a recuperar contraseña' })).toHaveAttribute(
      'href',
      '/recuperar',
    )
  })

  it('sin correo de la pantalla anterior, lo pide', () => {
    abrir(null)

    expect(correo()).toHaveValue('')
  })

  it('WCAG 3.3.8: ofrece los campos al gestor de contraseñas y deja pegar', async () => {
    abrir()

    expect(correo()).toHaveAttribute('autocomplete', 'username')
    expect(contrasena()).toHaveAttribute('autocomplete', 'new-password')
    expect(confirmacion()).toHaveAttribute('autocomplete', 'new-password')

    await userEvent.click(contrasena())
    await userEvent.paste(CONTRASENA)
    expect(contrasena()).toHaveValue(CONTRASENA)
  })

  it('RF-02 / CU-02 8: las dos reglas dicen si se cumplen mientras se escribe, no solo con color', async () => {
    abrir()

    expect(regla('Mínimo 8 caracteres')).toHaveTextContent('Mínimo 8 caracteres: pendiente')
    expect(regla('Al menos una letra')).toHaveTextContent(
      'Al menos una letra y un número: pendiente',
    )

    await userEvent.type(contrasena(), 'banano')
    expect(regla('Mínimo 8 caracteres')).toHaveTextContent('pendiente')
    expect(regla('Al menos una letra')).toHaveTextContent('pendiente')

    await userEvent.type(contrasena(), '48')
    expect(regla('Mínimo 8 caracteres')).toHaveTextContent('Mínimo 8 caracteres: cumplida')
    expect(regla('Al menos una letra')).toHaveTextContent(
      'Al menos una letra y un número: cumplida',
    )
    // Quien usa un lector de pantalla oye los requisitos al entrar al campo.
    expect(contrasena()).toHaveAccessibleDescription(/Mínimo 8 caracteres/)
  })

  it('el botón del ojo muestra y oculta la contraseña nueva', async () => {
    abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar la contraseña' }))
    expect(contrasena()).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar la contraseña' }))
    expect(contrasena()).toHaveAttribute('type', 'password')
  })

  it('RF-02 / CU-02 8: con todo vacío no envía, señala cada campo y deja el foco en el primero', async () => {
    abrir(null)

    await userEvent.click(guardar())

    expect(restablecerContrasena).not.toHaveBeenCalled()
    expect(correo()).toHaveAccessibleDescription('Escribe un correo válido.')
    expect(codigo()).toHaveAccessibleDescription('Escribe los seis dígitos del código.')
    expect(contrasena()).toHaveAccessibleDescription(
      /Usa mínimo 8 caracteres, con al menos una letra y un número\./,
    )
    expect(correo()).toHaveFocus()
  })

  it('RF-02 / CU-02 8: un código incompleto no se envía', async () => {
    abrir()

    await llenar({ elCodigo: '4827' })
    await userEvent.click(guardar())

    expect(restablecerContrasena).not.toHaveBeenCalled()
    expect(codigo()).toHaveAttribute('aria-invalid', 'true')
    expect(codigo()).toHaveAccessibleDescription('Escribe los seis dígitos del código.')
    expect(codigo()).toHaveFocus()
  })

  it.each([
    ['corta', 'Ban-482'],
    ['sin números', 'BananoVerde'],
    ['sin letras', '48214821'],
  ])('RF-02 / CU-02 8: una contraseña %s no se envía', async (_caso, laContrasena) => {
    abrir()

    await llenar({ laContrasena })
    await userEvent.click(guardar())

    expect(restablecerContrasena).not.toHaveBeenCalled()
    expect(contrasena()).toHaveAttribute('aria-invalid', 'true')
    expect(contrasena()).toHaveFocus()
  })

  it('RF-02 / CU-02 8: si la confirmación es distinta, no envía y lo dice en ese campo', async () => {
    abrir()

    await llenar({ laConfirmacion: 'Banano-4822' })
    await userEvent.click(guardar())

    expect(restablecerContrasena).not.toHaveBeenCalled()
    expect(confirmacion()).toHaveAttribute('aria-invalid', 'true')
    expect(confirmacion()).toHaveAccessibleDescription('Las contraseñas no coinciden.')
    expect(confirmacion()).toHaveFocus()
  })

  it('al corregir un campo, su error desaparece', async () => {
    abrir()

    await llenar({ elCodigo: '4827' })
    await userEvent.click(guardar())
    await userEvent.type(codigo(), '19')

    expect(codigo()).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText('Escribe los seis dígitos del código.')).not.toBeInTheDocument()
  })

  it('RF-02: requiere conexión; sin ella no envía y explica por qué', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    abrir()

    expect(guardar()).toBeDisabled()
    expect(screen.getByText('Necesitas internet para guardar la contraseña.')).toBeVisible()
  })
})

describe('Pantalla 03 · Guardar la contraseña (RF-02 / CU-02 9)', () => {
  it('RF-02 / CU-02 9 y 10: con el código correcto guarda y lleva al ingreso con el aviso 01-E', async () => {
    abrir()

    await llenar()
    await userEvent.click(guardar())

    expect(restablecerContrasena).toHaveBeenCalledExactlyOnceWith({
      correo: CORREO,
      codigo: '482719',
      contrasena: CONTRASENA,
    })
    expect(await screen.findByRole('heading', { name: 'Ingreso' })).toBeVisible()
    expect(screen.getByTestId('estado')).toHaveTextContent('{"contrasenaActualizada":true}')
    // Ni el correo, ni el código, ni la contraseña quedan en la dirección ni en el historial.
    expect(screen.getByTestId('consulta')).toBeEmptyDOMElement()
  })

  it('mientras guarda, el botón queda deshabilitado y lo dice', async () => {
    let terminar
    restablecerContrasena.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    abrir()

    await llenar()
    await userEvent.click(guardar())

    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
    terminar()
    expect(await screen.findByRole('heading', { name: 'Ingreso' })).toBeVisible()
  })

  it('RF-02 / CU-02 9b: con un código incorrecto lo dice en el campo y deja corregirlo', async () => {
    restablecerContrasena.mockRejectedValueOnce(errorDeFuncion('CODIGO_INVALIDO'))
    abrir()

    await llenar()
    await userEvent.click(guardar())

    expect(await screen.findByText(CODIGO_INVALIDO)).toBeVisible()
    expect(codigo()).toHaveAttribute('aria-invalid', 'true')
    expect(codigo()).toHaveAccessibleDescription(CODIGO_INVALIDO)
    expect(codigo()).toHaveFocus()
    // Sigue en la pantalla 03, con lo demás como estaba; no aparece el aviso de 03-B.
    expect(contrasena()).toHaveValue(CONTRASENA)
    expect(confirmacion()).toHaveValue(CONTRASENA)
    expect(screen.queryByText(CODIGO_VENCIDO)).not.toBeInTheDocument()

    // Corrige el código y guarda.
    await userEvent.type(codigo(), '{Backspace}8')
    await userEvent.click(guardar())

    expect(restablecerContrasena).toHaveBeenLastCalledWith({
      correo: CORREO,
      codigo: '482718',
      contrasena: CONTRASENA,
    })
    expect(await screen.findByRole('heading', { name: 'Ingreso' })).toBeVisible()
  })

  it('RF-02 / CU-02 9a (03-B): con un código vencido o ya usado muestra el aviso con «Solicitar otro código»', async () => {
    restablecerContrasena.mockRejectedValueOnce(errorDeFuncion('CODIGO_VENCIDO'))
    abrir()

    await llenar()
    await userEvent.click(guardar())

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent(CODIGO_VENCIDO)
    expect(codigo()).toHaveAttribute('aria-invalid', 'true')
    expect(codigo()).toHaveAttribute('aria-describedby', aviso.id)
    // Sigue en la pantalla, con lo escrito.
    expect(codigo()).toHaveValue('482719')
    expect(contrasena()).toHaveValue(CONTRASENA)

    await userEvent.click(within(aviso).getByRole('button', { name: 'Solicitar otro código' }))

    expect(screen.getByRole('heading', { name: 'Recuperar contraseña' })).toBeVisible()
    expect(screen.getByTestId('estado')).toHaveTextContent(`{"correo":"${CORREO}"}`)
    expect(screen.getByTestId('consulta')).toBeEmptyDOMElement()
  })

  it('RF-02 / CU-02 9a y 9b: cada intento deja solo lo que dijo el servidor esa vez', async () => {
    restablecerContrasena
      .mockRejectedValueOnce(errorDeFuncion('CODIGO_INVALIDO'))
      .mockRejectedValueOnce(errorDeFuncion('CODIGO_VENCIDO'))
      .mockRejectedValueOnce(errorDeFuncion('CODIGO_INVALIDO'))
    abrir()
    await llenar()

    await userEvent.click(guardar())
    expect(await screen.findByText(CODIGO_INVALIDO)).toBeVisible()

    // El mismo código otra vez, y ahora está vencido: ya no dice que no es válido.
    await userEvent.click(guardar())
    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent(CODIGO_VENCIDO)
    expect(screen.queryByText(CODIGO_INVALIDO)).not.toBeInTheDocument()
    expect(codigo()).toHaveAttribute('aria-describedby', aviso.id)

    // Y al revés: el aviso de 03-B no se queda cuando la respuesta es otra.
    await userEvent.click(guardar())
    expect(await screen.findByText(CODIGO_INVALIDO)).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('RF-02 / CU-02 9a: al escribir otro código, el aviso de 03-B se va', async () => {
    restablecerContrasena.mockRejectedValueOnce(errorDeFuncion('CODIGO_VENCIDO'))
    abrir()

    await llenar()
    await userEvent.click(guardar())
    await screen.findByRole('alert')
    await userEvent.type(codigo(), '{Backspace}')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(codigo()).not.toHaveAttribute('aria-invalid')
  })

  it('RF-02 / CU-02 8: si la función rechaza un dato, lo señala en su campo', async () => {
    restablecerContrasena.mockRejectedValueOnce(
      errorDeFuncion('DATO_OBLIGATORIO', ['correo', 'contrasena']),
    )
    abrir()

    await llenar()
    await userEvent.click(guardar())

    expect(await screen.findByText('Escribe un correo válido.')).toBeVisible()
    expect(contrasena()).toHaveAttribute('aria-invalid', 'true')
    expect(correo()).toHaveFocus()
    expect(codigo()).not.toHaveAttribute('aria-invalid')
  })

  it('RF-02: si la red se cae al guardar, lo dice y conserva lo escrito', async () => {
    restablecerContrasena.mockRejectedValueOnce(
      Object.assign(new Error('Failed to send a request to the Edge Function'), {
        name: 'FunctionsFetchError',
      }),
    )
    abrir()

    await llenar()
    await userEvent.click(guardar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hay conexión. Revisa tu internet e intenta de nuevo.',
    )
    expect(codigo()).toHaveValue('482719')
    expect(contrasena()).toHaveValue(CONTRASENA)
    expect(guardar()).toBeEnabled()
  })

  it('RF-02 / CU-02 9: si el servidor falla, dice que pida otro código: el anterior pudo quedar gastado', async () => {
    restablecerContrasena.mockRejectedValueOnce(
      Object.assign(new Error('ERROR'), { name: 'ErrorDeFuncion', status: 500, campos: [] }),
    )
    abrir()

    await llenar()
    await userEvent.click(guardar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos guardar la contraseña. Intenta de nuevo; si el código deja de servir, pide uno nuevo.',
    )
    expect(guardar()).toBeEnabled()
  })

  it('RNF-11: no guarda nada de lo escrito en el almacenamiento del navegador', async () => {
    const guardarLocal = vi.spyOn(Storage.prototype, 'setItem')
    abrir()

    await llenar()
    await userEvent.click(guardar())
    await screen.findByRole('heading', { name: 'Ingreso' })

    expect(guardarLocal).not.toHaveBeenCalled()
  })
})
