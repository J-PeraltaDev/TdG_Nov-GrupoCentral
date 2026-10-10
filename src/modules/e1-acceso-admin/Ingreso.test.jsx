import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PERFILES, pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import { Ingreso } from './Ingreso.jsx'

function abrir(ingresar = vi.fn(), sesion = {}) {
  return pintarConSesion(
    <Routes>
      <Route path="/ingresar" element={<Ingreso />} />
      <Route path="/novedades" element={<h1>Mis novedades</h1>} />
      <Route path="/bandeja" element={<h1>Bandeja del área</h1>} />
    </Routes>,
    { ruta: '/ingresar', sesion: { ingresar, ...sesion } },
  )
}

async function llenarYEnviar(
  correo = 'reportante.01@novedades.test',
  contrasena = 'una-clave-de-prueba',
) {
  await userEvent.type(screen.getByLabelText('Correo'), correo)
  await userEvent.type(screen.getByLabelText('Contraseña'), contrasena)
  await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
}

describe('Pantalla 01 · Iniciar sesión (RF-01 / CU-01)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra los textos de Figma: marca, campos, botón y recuperación', () => {
    abrir()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Novedades · Grupo Central' }),
    ).toBeVisible()
    expect(screen.getByText('Reporta y sigue las novedades de tu finca')).toBeVisible()
    expect(screen.getByLabelText('Correo')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled()
    expect(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' })).toHaveAttribute(
      'href',
      '/recuperar',
    )
  })

  it('RNF-18: informa el tratamiento de datos conforme a la Ley 1581 de 2012', () => {
    abrir()

    expect(screen.getByText('Tus datos se tratan conforme a la Ley 1581 de 2012')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Política de tratamiento de datos' })).toBeVisible()
  })

  it('RNF-03: invita a instalar la aplicación', () => {
    abrir()

    expect(
      screen.getByText(
        'Instala la app en este teléfono para registrar novedades aunque no haya internet',
      ),
    ).toBeVisible()
  })

  it('RF-01 / CU-01 curso normal: ingresa y va a la pantalla de inicio del rol', async () => {
    const ingresar = vi.fn().mockResolvedValue({ ok: true, perfil: PERFILES.reportante })
    abrir(ingresar)

    await llenarYEnviar()

    expect(ingresar).toHaveBeenCalledWith('reportante.01@novedades.test', 'una-clave-de-prueba')
    expect(await screen.findByRole('heading', { name: 'Mis novedades' })).toBeVisible()
  })

  it('RF-01 / CU-01 4: cada rol entra a su propio inicio', async () => {
    abrir(vi.fn().mockResolvedValue({ ok: true, perfil: PERFILES.aprobador }))

    await llenarYEnviar('aprobador.mantenimiento@novedades.test')

    expect(await screen.findByRole('heading', { name: 'Bandeja del área' })).toBeVisible()
  })

  it('RF-01 / CU-01 4a (01-B): credenciales incorrectas; sigue en el formulario y señala la contraseña', async () => {
    abrir(vi.fn().mockResolvedValue({ ok: false, motivo: 'credenciales' }))

    await llenarYEnviar()

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent(
      'Correo o contraseña incorrectos. Revisa los datos e intenta de nuevo.',
    )
    const contrasena = screen.getByLabelText('Contraseña')
    expect(contrasena).toHaveAttribute('aria-invalid', 'true')
    expect(contrasena).toHaveAttribute('aria-describedby', aviso.id)
    expect(contrasena).toHaveFocus()
    // El correo se conserva para corregir solo lo necesario.
    expect(screen.getByLabelText('Correo')).toHaveValue('reportante.01@novedades.test')
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled()
  })

  it('RF-01 / CU-01 4b (01-C): usuario desactivado', async () => {
    abrir(vi.fn().mockResolvedValue({ ok: false, motivo: 'desactivado' }))

    await llenarYEnviar('desactivado@novedades.test')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu usuario está desactivado. Si crees que es un error, comunícate con un administrador.',
    )
    expect(screen.getByLabelText('Contraseña')).not.toHaveAttribute('aria-invalid')
  })

  it('RF-01 / CU-01 2a (01-D): sin conexión explica que el primer ingreso necesita internet y bloquea el botón', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const ingresar = vi.fn()
    abrir(ingresar)

    expect(screen.getByText('Sin conexión')).toBeVisible()
    expect(
      screen.getByText(
        'El primer ingreso en este teléfono necesita internet; después podrás registrar novedades sin conexión.',
      ),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeDisabled()
  })

  it('RF-01 / CU-01 2a: si la red se cae al enviar, muestra el mismo aviso de sin conexión', async () => {
    abrir(vi.fn().mockResolvedValue({ ok: false, motivo: 'sin_conexion' }))

    await llenarYEnviar()

    expect(await screen.findByText('Sin conexión')).toBeVisible()
  })

  it('mientras envía, el botón queda deshabilitado y lo dice', async () => {
    let terminar
    abrir(vi.fn(() => new Promise((resolver) => (terminar = resolver))))

    await llenarYEnviar()

    expect(screen.getByRole('button', { name: 'Ingresando…' })).toBeDisabled()
    terminar({ ok: false, motivo: 'credenciales' })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled())
  })

  it('WCAG 3.3.8: deja pegar la contraseña y la ofrece al gestor de contraseñas', async () => {
    abrir()
    const contrasena = screen.getByLabelText('Contraseña')

    await userEvent.click(contrasena)
    await userEvent.paste('pegada-desde-el-gestor')

    expect(contrasena).toHaveValue('pegada-desde-el-gestor')
    expect(contrasena).toHaveAttribute('autocomplete', 'current-password')
    expect(screen.getByLabelText('Correo')).toHaveAttribute('autocomplete', 'username')
  })

  it('el botón del ojo muestra y oculta la contraseña', async () => {
    abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar la contraseña' }))
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar la contraseña' }))
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
  })
})

describe('Pantalla 01-C · La sesión se cerró porque desactivaron al usuario (RF-03 / CU-01 4b)', () => {
  const AVISO =
    'Tu usuario está desactivado. Si crees que es un error, comunícate con un administrador.'

  it('RF-03 / CU-01 4b: al llegar al ingreso dice por qué ya no tiene sesión', () => {
    abrir(vi.fn(), { motivoDeSalida: 'desactivado' })

    expect(screen.getByRole('alert')).toHaveTextContent(AVISO)
    // El formulario sigue ahí: otra persona puede ingresar en el mismo dispositivo.
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled()
  })

  it('RF-01: lo que resulte del siguiente intento reemplaza ese aviso', async () => {
    abrir(vi.fn().mockResolvedValue({ ok: false, motivo: 'credenciales' }), {
      motivoDeSalida: 'desactivado',
    })

    await llenarYEnviar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos')
    expect(screen.queryByText(AVISO)).not.toBeInTheDocument()
  })

  it('RF-01: sin ese motivo, el ingreso no muestra ningún aviso', () => {
    abrir()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
