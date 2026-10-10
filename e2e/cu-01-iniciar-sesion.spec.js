import { expect, test } from '@playwright/test'
import {
  HAY_CLAVE,
  ingresarComo,
  ingresarPorElFormulario,
  llenarIngreso,
  menuVisible,
  MOTIVO_SIN_CLAVE,
  USUARIOS,
} from './apoyo/usuarios.js'

// CU-01 · Iniciar y cerrar sesión (RF-01). Corre contra una base con el seed de prueba.
//
// Aquí sí se ingresa por el formulario: es lo que se prueba. Las demás pruebas reutilizan la
// sesión que cada usuario abrió al comienzo de la corrida (e2e/sesiones.setup.js).

// Auth tarda en responder cuando varias pruebas ingresan al tiempo contra «staging».
const ESPERA_DE_AUTH = { timeout: 20_000 }
test.describe('CU-01 · Iniciar y cerrar sesión', () => {
  test('RF-01 / CU-01 2a (01-D): sin conexión, el primer ingreso informa que necesita internet', async ({
    page,
    context,
  }) => {
    await page.goto('/ingresar')
    await context.setOffline(true)

    await expect(page.getByText('Sin conexión', { exact: true })).toBeVisible()
    await expect(
      page.getByText('El primer ingreso en este teléfono necesita internet', { exact: false }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeDisabled()
  })

  test.describe('con los usuarios de prueba', () => {
    test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

    for (const rol of ['reportante', 'aprobador', 'director', 'administrador']) {
      test(`RF-01 / CU-01 curso normal: el ${rol} ingresa y ve el menú de su rol`, async ({
        page,
      }) => {
        const usuario = await ingresarPorElFormulario(page, rol)

        await expect(page).toHaveURL(new RegExp(`${usuario.inicio}$`))
        // En el escritorio la cuenta va en la barra superior, no en el menú lateral.
        const escritorio = page.viewportSize().width >= 1024
        const opciones = usuario.menu.filter((opcion) => !(escritorio && opcion === 'Cuenta'))
        const menu = menuVisible(page)
        for (const opcion of opciones) {
          await expect(menu.getByRole('link', { name: opcion })).toBeVisible()
        }
      })
    }

    test('RF-01 / CU-01 4a (01-B): credenciales incorrectas; sigue en el formulario', async ({
      page,
    }) => {
      await llenarIngreso(page, USUARIOS.reportante.correo, 'una-contrasena-equivocada')

      await expect(page.getByRole('alert')).toHaveText(
        'Correo o contraseña incorrectos. Revisa los datos e intenta de nuevo.',
        ESPERA_DE_AUTH,
      )
      await expect(page).toHaveURL(/\/ingresar$/)
      await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute(
        'aria-invalid',
        'true',
      )
      await expect(page.getByLabel('Correo', { exact: true })).toHaveValue(
        USUARIOS.reportante.correo,
      )
    })

    test('RF-01 / CU-01 4b (01-C): a un usuario desactivado se le niega el acceso', async ({
      page,
    }) => {
      await llenarIngreso(page, USUARIOS.desactivado.correo)

      await expect(page.getByRole('alert')).toHaveText(
        'Tu usuario está desactivado. Si crees que es un error, comunícate con un administrador.',
        ESPERA_DE_AUTH,
      )
      await expect(page).toHaveURL(/\/ingresar$/)
    })

    test('RF-18: el guardián de rol devuelve a cada quien a su inicio', async ({ page }) => {
      await ingresarComo(page, 'reportante')

      await page.goto('/bandeja')

      // Al recargar, la aplicación recupera la sesión y vuelve a descargar el perfil antes de
      // decidir adónde ir: se le da la misma espera que al ingreso.
      await expect(page).toHaveURL(/\/novedades$/, ESPERA_DE_AUTH)
    })

    test('RF-01 / CU-01 5 y 6: cerrar la sesión vuelve al ingreso y ya no deja entrar', async ({
      page,
    }) => {
      // Con una sesión propia: al cerrarla no se le quita a las demás pruebas.
      await ingresarPorElFormulario(page, 'reportante')

      await page.goto('/cuenta')
      // El nombre y el botón también están en la barra lateral del escritorio: se usan los
      // de la página.
      const cuenta = page.getByRole('main')
      await expect(cuenta.getByText(USUARIOS.reportante.nombre)).toBeVisible(ESPERA_DE_AUTH)
      await cuenta.getByRole('button', { name: 'Cerrar sesión' }).click()

      await expect(page).toHaveURL(/\/ingresar$/)
      await page.goto('/novedades')
      await expect(page).toHaveURL(/\/ingresar$/)
    })
  })
})
