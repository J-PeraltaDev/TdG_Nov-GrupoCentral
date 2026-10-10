import { expect, test } from '@playwright/test'
import { enTelefono } from './apoyo/novedades.js'
import {
  HAY_CLAVE,
  ingresarComo,
  leerDeLaApi,
  llamarALaApi,
  llenarIngreso,
  MOTIVO_SIN_CLAVE,
  USUARIOS,
} from './apoyo/usuarios.js'

/*
 * CU-03 · Gestionar usuarios (RF-03). Pantallas 28 (lista), 28-B (desactivar), 29 (nuevo
 * usuario y editar) y 29-B (aprobador con su área).
 *
 * La prueba crea su propio usuario (`e2e-…@novedades.test`), con la contraseña que genera el
 * formulario, y lo deja desactivado al terminar: un usuario no se puede borrar. A los usuarios
 * del seed no les cambia nada: ni la contraseña ni el estado.
 */

const ESPERA_DE_SESION = { timeout: 20_000 }
const FINCA = 'Finca de prueba 01 · Razón social de prueba A'
const DESACTIVADO =
  'Tu usuario está desactivado. Si crees que es un error, comunícate con un administrador.'

test.describe('CU-03 · Gestionar usuarios', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  /** El administrador entra: su pantalla de inicio es la lista de usuarios. */
  async function abrirUsuarios(page) {
    await ingresarComo(page, 'administrador')
    await expect(page).toHaveURL(/\/usuarios$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeVisible()
    // La lista ya llegó cuando aparece el rango de la página.
    await expect(page.getByText(/^\d+–\d+ de \d+ usuarios?$/)).toBeVisible(ESPERA_DE_SESION)
  }

  /** La fila de la tabla (escritorio) o la tarjeta (teléfono) de un usuario. */
  const filaDe = (page, nombre) =>
    page
      .getByRole(enTelefono(page) ? 'article' : 'row')
      .filter({ has: page.getByRole('button', { name: `Editar ${nombre}`, exact: true }) })
  const buscar = (page, texto) =>
    page.getByRole('searchbox', { name: 'Buscar por nombre o correo' }).fill(texto)

  /** Otra persona, en su propio navegador, intenta ingresar con correo y contraseña. */
  async function intentarIngreso(browser, correo, contrasena) {
    const contexto = await browser.newContext()
    const page = await contexto.newPage()
    await llenarIngreso(page, correo, contrasena)
    return { contexto, page }
  }

  test('RF-03 / CU-03: el administrador crea un reportante, que ingresa; lo edita, lo desactiva (ya no ingresa) y lo reactiva', async ({
    page,
    browser,
  }, testInfo) => {
    // Cuatro ingresos por el formulario, además de las pantallas del administrador.
    test.setTimeout(120_000)
    const marca = `${testInfo.project.name}-${Date.now()}`
    const nombre = `Usuario e2e ${marca}`
    const editado = `${nombre} editado`
    const correo = `e2e-${marca}@novedades.test`
    await abrirUsuarios(page)

    // CU-03 4 y 5: el formulario, con la contraseña inicial que genera.
    await page.getByRole('button', { name: 'Nuevo usuario' }).click()
    const panel = page.getByRole('dialog', { name: 'Nuevo usuario' })
    await panel.getByRole('textbox', { name: 'Nombre completo' }).fill(nombre)
    await panel.getByRole('textbox', { name: 'Correo de la plataforma' }).fill(correo)
    await panel.getByRole('button', { name: 'Generar' }).click()
    const campoDeContrasena = panel.getByRole('textbox', { name: 'Contraseña inicial' })
    await expect(campoDeContrasena).toHaveValue(/^[A-Z][a-z]+-\d{4}$/)
    // Es lo que el administrador le entrega al usuario: la prueba la usa para ingresar.
    const contrasena = await campoDeContrasena.inputValue()
    // El botón de radio está oculto a la vista: se toca su tarjeta.
    await panel.getByText('Reportante', { exact: true }).click()
    await expect(panel.getByRole('radio', { name: 'Reportante' })).toBeChecked()
    await panel.getByRole('combobox', { name: 'Finca asignada' }).selectOption({ label: FINCA })

    // CU-03 6: guarda y la cuenta queda en la lista, sin haber ingresado nunca.
    await panel.getByRole('button', { name: 'Guardar usuario' }).click()
    await expect(page.getByText('Usuario creado. Entrégale su contraseña inicial.')).toBeVisible()
    await expect(panel).toBeHidden()
    await buscar(page, correo)
    const fila = filaDe(page, nombre)
    await expect(fila).toHaveCount(1)
    await expect(fila.getByText('Reportante')).toBeVisible()
    await expect(fila.getByText('Finca de prueba 01')).toBeVisible()
    await expect(fila.getByText('Activo', { exact: true })).toBeVisible()
    await expect(fila.getByText(/Nunca/)).toBeVisible()

    // El usuario nuevo ingresa con la contraseña inicial y ve Mis novedades.
    const nuevo = await intentarIngreso(browser, correo, contrasena)
    await expect(nuevo.page).toHaveURL(/\/novedades$/, ESPERA_DE_SESION)
    await expect(
      nuevo.page.getByRole('heading', { level: 1, name: 'Mis novedades' }),
    ).toBeAttached()

    // CU-03 5: el administrador le corrige el nombre. Editar no muestra la contraseña ni deja
    // cambiar el correo.
    await page.getByRole('button', { name: `Editar ${nombre}`, exact: true }).click()
    const edicion = page.getByRole('dialog', { name: 'Editar usuario' })
    await expect(edicion.getByRole('textbox', { name: 'Correo de la plataforma' })).toHaveValue(
      correo,
    )
    await expect(
      edicion.getByRole('textbox', { name: 'Correo de la plataforma' }),
    ).not.toBeEditable()
    await expect(edicion.getByRole('textbox', { name: 'Contraseña inicial' })).toHaveCount(0)
    await edicion.getByRole('textbox', { name: 'Nombre completo' }).fill(editado)
    await edicion.getByRole('button', { name: 'Guardar usuario' }).click()
    await expect(page.getByText('Usuario actualizado.')).toBeVisible()
    await expect(filaDe(page, editado)).toHaveCount(1)

    // CU-03 3a: lo desactiva, con su confirmación.
    await page.getByRole('button', { name: `Desactivar ${editado}`, exact: true }).click()
    const confirmacion = page.getByRole('dialog', { name: `¿Desactivar a ${editado}?` })
    await expect(
      confirmacion.getByText(
        'No podrá ingresar a la plataforma. Sus novedades y su historial se conservan.',
      ),
    ).toBeVisible()
    await confirmacion.getByRole('button', { name: 'Desactivar', exact: true }).click()
    await expect(page.getByText('Usuario desactivado.')).toBeVisible()
    await expect(filaDe(page, editado).getByText('Inactivo', { exact: true })).toBeVisible()

    // Su sesión abierta deja de servir: al recargar queda en el ingreso, con el aviso 01-C…
    await nuevo.page.reload()
    await expect(nuevo.page).toHaveURL(/\/ingresar$/, ESPERA_DE_SESION)
    await expect(nuevo.page.getByRole('alert')).toHaveText(DESACTIVADO)
    await nuevo.contexto.close()
    // …y tampoco puede volver a ingresar.
    const rechazado = await intentarIngreso(browser, correo, contrasena)
    await expect(rechazado.page.getByRole('alert')).toHaveText(DESACTIVADO, ESPERA_DE_SESION)
    await expect(rechazado.page).toHaveURL(/\/ingresar$/)
    await rechazado.contexto.close()

    // Reactivar es un toque, sin diálogo; el usuario vuelve a entrar con la misma contraseña.
    await page.getByRole('button', { name: `Reactivar ${editado}`, exact: true }).click()
    await expect(page.getByText('Usuario reactivado.')).toBeVisible()
    await expect(filaDe(page, editado).getByText('Activo', { exact: true })).toBeVisible()
    const deVuelta = await intentarIngreso(browser, correo, contrasena)
    await expect(deVuelta.page).toHaveURL(/\/novedades$/, ESPERA_DE_SESION)
    await deVuelta.contexto.close()

    // Se deja desactivado: es de la prueba y no se puede borrar.
    await page.getByRole('button', { name: `Desactivar ${editado}`, exact: true }).click()
    await page
      .getByRole('dialog', { name: `¿Desactivar a ${editado}?` })
      .getByRole('button', { name: 'Desactivar', exact: true })
      .click()
    await expect(filaDe(page, editado).getByText('Inactivo', { exact: true })).toBeVisible()
    const [perfil] = await leerDeLaApi(
      page,
      `usuario?select=activo,rol_id&nombre=eq.${encodeURIComponent(editado)}`,
    )
    expect(perfil).toEqual({ activo: false, rol_id: 1 })
  })

  test('RF-03 / CU-03 6a y 6b: con el correo de otro usuario o sin el área del aprobador no se crea la cuenta; lo señala en su campo', async ({
    page,
  }, testInfo) => {
    await abrirUsuarios(page)
    await page.getByRole('button', { name: 'Nuevo usuario' }).click()
    const panel = page.getByRole('dialog', { name: 'Nuevo usuario' })
    await panel
      .getByRole('textbox', { name: 'Nombre completo' })
      .fill(`No debería crearse ${testInfo.project.name}`)
    await panel.getByRole('button', { name: 'Generar' }).click()

    // CU-03 6b: un aprobador sin área. Lo detiene el formulario.
    await panel
      .getByRole('textbox', { name: 'Correo de la plataforma' })
      .fill(`e2e-no-${Date.now()}@novedades.test`)
    await panel.getByText('Aprobador de área', { exact: true }).click()
    await expect(panel.getByRole('radiogroup', { name: 'Área' })).toBeVisible()
    await panel.getByRole('button', { name: 'Guardar usuario' }).click()
    await expect(panel.getByText('Elige el área.')).toBeVisible()
    await expect(panel).toBeVisible()

    // CU-03 6a: el correo de un usuario del seed. Lo detiene el servidor.
    await panel
      .getByRole('textbox', { name: 'Correo de la plataforma' })
      .fill(USUARIOS.reportante.correo)
    await panel.getByRole('radiogroup', { name: 'Área' }).getByText('Sistemas').click()
    await panel.getByRole('button', { name: 'Guardar usuario' }).click()
    await expect(panel.getByText('Este correo ya está registrado')).toBeVisible()
    await expect(panel.getByRole('textbox', { name: 'Correo de la plataforma' })).toBeFocused()
    // Lo escrito se conserva.
    await expect(panel.getByRole('textbox', { name: 'Contraseña inicial' })).toHaveValue(
      /^[A-Z][a-z]+-\d{4}$/,
    )

    // No se creó nada, y al usuario del seed no le pasó nada: sigue siendo reportante y activo.
    await panel.getByRole('button', { name: 'Cancelar' }).click()
    await expect(panel).toBeHidden()
    const lista = await llamarALaApi(page, 'listar_usuarios', {})
    const delSeed = lista.filter((usuario) => usuario.correo === USUARIOS.reportante.correo)
    expect(delSeed).toHaveLength(1)
    expect(delSeed[0]).toMatchObject({
      rol_id: 1,
      activo: true,
      nombre: USUARIOS.reportante.nombre,
    })
  })

  test('RNF-11 y RNF-18: quien no es administrador no entra a la pantalla, no lista los usuarios ni puede gestionarlos', async ({
    page,
  }) => {
    await ingresarComo(page, 'director')
    await page.goto('/usuarios')
    // El guardián lo devuelve a su inicio.
    await expect(page).toHaveURL(/\/escaladas$/, ESPERA_DE_SESION)

    // La base de datos tampoco le entrega la lista, ni el correo de nadie.
    await expect(llamarALaApi(page, 'listar_usuarios', {})).rejects.toThrow(/SIN_PERMISO/)
    const correos = await leerDeLaApi(page, 'usuario?select=correo&limit=1')
    expect(correos.code).toBe('42501')

    // Y la función le responde 403, sin decirle qué campos faltan.
    const respuesta = await page.evaluate(
      async ({ url, clave }) => {
        const guardada = Object.keys(localStorage).find((k) => /^sb-.+-auth-token$/.test(k))
        const { access_token: token } = JSON.parse(localStorage.getItem(guardada))
        const r = await fetch(`${url}/functions/v1/gestionar-usuario`, {
          method: 'POST',
          headers: {
            apikey: clave,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accion: 'crear' }),
        })
        return { estado: r.status, cuerpo: await r.json() }
      },
      {
        url: process.env.VITE_SUPABASE_URL,
        clave: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    )
    expect(respuesta).toEqual({ estado: 403, cuerpo: { codigo: 'SIN_PERMISO' } })
  })
})
