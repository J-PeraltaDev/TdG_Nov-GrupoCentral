import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarRecuperacion } from '../../core/supabase/repositorios/recuperacion.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import RecuperarContrasena from './RecuperarContrasena.jsx'

// Se simula el repositorio, nunca la red.
vi.mock('../../core/supabase/repositorios/recuperacion.js', () => ({
  solicitarRecuperacion: vi.fn(),
}))

const MENSAJE_02B =
  'Si el correo corresponde a un usuario activo, un administrador te entregará un código temporal. El código tiene una vigencia limitada.'

/** Muestra a dónde se llegó y con qué correo, sin que el correo vaya en la dirección. */
function Destino({ nombre }) {
  const { state, search } = useLocation()
  return (
    <>
      <h1>{nombre}</h1>
      <output data-testid="correo">{state?.correo ?? ''}</output>
      <output data-testid="consulta">{search}</output>
    </>
  )
}

function abrir(estado) {
  return pintarConSesion(
    <Routes>
      <Route path="/recuperar" element={<RecuperarContrasena />} />
      <Route path="/recuperar/codigo" element={<Destino nombre="Crear contraseña nueva" />} />
      <Route path="/ingresar" element={<Destino nombre="Ingreso" />} />
    </Routes>,
    { ruta: { pathname: '/recuperar', state: estado } },
  )
}

const correo = () => screen.getByLabelText('Correo registrado')
const enviar = () => screen.getByRole('button', { name: 'Enviar solicitud' })

beforeEach(() => {
  solicitarRecuperacion.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('Pantalla 02 · Recuperar contraseña (RF-02 / CU-02 1 a 3)', () => {
  it('muestra los textos de Figma: la explicación, el campo, el botón y cómo funciona', () => {
    abrir()

    expect(screen.getByRole('heading', { level: 1, name: 'Recuperar contraseña' })).toBeVisible()
    expect(
      screen.getByText(
        'Escribe el correo con el que ingresas. Un administrador recibirá tu solicitud y te entregará un código temporal para crear una contraseña nueva.',
      ),
    ).toBeVisible()
    expect(correo()).toHaveAttribute('type', 'email')
    expect(correo()).toHaveAttribute('autocomplete', 'username')
    expect(enviar()).toBeEnabled()

    const pasos = within(screen.getByRole('list', { name: 'Cómo funciona' })).getAllByRole(
      'listitem',
    )
    expect(pasos.map((paso) => paso.textContent)).toEqual([
      '1Envías la solicitud',
      '2Un administrador te entrega un código temporal',
      '3Ingresas el código y tu contraseña nueva',
    ])
    expect(screen.getByRole('status')).toHaveTextContent('En línea')
  })

  it('la flecha vuelve al ingreso', () => {
    abrir()

    expect(screen.getByRole('link', { name: 'Volver al ingreso' })).toHaveAttribute(
      'href',
      '/ingresar',
    )
  })

  it('RF-02 / CU-02 3 y 4: envía la solicitud con el correo y muestra 02-B', async () => {
    abrir()

    await userEvent.type(correo(), 'persona@novedades.test')
    await userEvent.click(enviar())

    expect(solicitarRecuperacion).toHaveBeenCalledExactlyOnceWith('persona@novedades.test')
    const titulo = await screen.findByRole('heading', { level: 2, name: 'Solicitud enviada' })
    expect(titulo).toHaveFocus()
    expect(screen.getByText(MENSAJE_02B)).toBeVisible()
    expect(screen.queryByLabelText('Correo registrado')).not.toBeInTheDocument()
  })

  it('RF-02 / CU-02 4a: la pantalla no sabe si el correo existe: con cualquiera muestra lo mismo', async () => {
    abrir()

    await userEvent.type(correo(), 'nadie-con-este-correo@novedades.test')
    await userEvent.click(enviar())

    expect(await screen.findByText(MENSAJE_02B)).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('quita los espacios de los extremos antes de enviar', async () => {
    abrir()

    await userEvent.type(correo(), '  persona@novedades.test ')
    await userEvent.click(enviar())

    expect(solicitarRecuperacion).toHaveBeenCalledWith('persona@novedades.test')
  })

  it.each(['', 'sin-arroba', 'a@b'])(
    'con «%s» no envía: señala el campo y le deja el foco',
    async (texto) => {
      abrir()

      if (texto) await userEvent.type(correo(), texto)
      await userEvent.click(enviar())

      expect(solicitarRecuperacion).not.toHaveBeenCalled()
      expect(correo()).toHaveAttribute('aria-invalid', 'true')
      expect(correo()).toHaveAccessibleDescription('Escribe un correo válido.')
      expect(correo()).toHaveFocus()
    },
  )

  it('mientras envía, el botón queda deshabilitado y lo dice', async () => {
    let terminar
    solicitarRecuperacion.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    abrir()

    await userEvent.type(correo(), 'persona@novedades.test')
    await userEvent.click(enviar())

    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled()
    terminar()
    expect(await screen.findByText('Solicitud enviada')).toBeVisible()
  })

  it('RF-02: requiere conexión; sin ella no envía y explica por qué', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    abrir()

    expect(enviar()).toBeDisabled()
    expect(enviar()).toHaveAccessibleDescription(
      'Sin conexión Necesitas internet para enviar la solicitud.',
    )
    expect(screen.getByText('Necesitas internet para enviar la solicitud.')).toBeVisible()
  })

  it('RF-02: si la red se cae al enviar, lo dice y conserva el correo', async () => {
    solicitarRecuperacion.mockRejectedValue(new TypeError('Failed to fetch'))
    abrir()

    await userEvent.type(correo(), 'persona@novedades.test')
    await userEvent.click(enviar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hay conexión. Revisa tu internet e intenta de nuevo.',
    )
    expect(correo()).toHaveValue('persona@novedades.test')
    expect(screen.queryByText('Solicitud enviada')).not.toBeInTheDocument()
  })

  it('si el servidor falla, lo dice sin detalles y deja reintentar', async () => {
    solicitarRecuperacion.mockRejectedValueOnce({ code: '57014', message: 'canceling statement' })
    abrir()

    await userEvent.type(correo(), 'persona@novedades.test')
    await userEvent.click(enviar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos enviar la solicitud. Intenta de nuevo en un momento.',
    )

    await userEvent.click(enviar())
    expect(await screen.findByText('Solicitud enviada')).toBeVisible()
  })

  it('«Ya tengo un código» lleva a crear la contraseña, con el correo que haya escrito', async () => {
    abrir()

    await userEvent.type(correo(), 'persona@novedades.test')
    await userEvent.click(screen.getByRole('link', { name: 'Ya tengo un código' }))

    expect(screen.getByRole('heading', { name: 'Crear contraseña nueva' })).toBeVisible()
    expect(screen.getByTestId('correo')).toHaveTextContent('persona@novedades.test')
    // El correo viaja en el estado de la navegación, nunca en la dirección.
    expect(screen.getByTestId('consulta')).toBeEmptyDOMElement()
    expect(solicitarRecuperacion).not.toHaveBeenCalled()
  })

  it('RF-02 / CU-02 9a: al volver de 03-B trae puesto el correo', () => {
    abrir({ correo: 'persona@novedades.test' })

    expect(correo()).toHaveValue('persona@novedades.test')
  })
})

describe('Pantalla 02-B · Solicitud enviada (RF-02 / CU-02 4)', () => {
  async function enviada() {
    abrir()
    await userEvent.type(correo(), 'persona@novedades.test')
    await userEvent.click(enviar())
    await screen.findByText('Solicitud enviada')
  }

  it('«Ingresar código» lleva a crear la contraseña con el correo puesto', async () => {
    await enviada()

    await userEvent.click(screen.getByRole('button', { name: 'Ingresar código' }))

    expect(screen.getByRole('heading', { name: 'Crear contraseña nueva' })).toBeVisible()
    expect(screen.getByTestId('correo')).toHaveTextContent('persona@novedades.test')
    expect(screen.getByTestId('consulta')).toBeEmptyDOMElement()
  })

  it('«Volver al inicio» lleva al ingreso', async () => {
    await enviada()

    await userEvent.click(screen.getByRole('link', { name: 'Volver al inicio' }))

    expect(screen.getByRole('heading', { name: 'Ingreso' })).toBeVisible()
  })
})
