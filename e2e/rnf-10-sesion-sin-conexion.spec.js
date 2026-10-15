import { expect, test } from '@playwright/test'
import { CLAVE_DE_SESION, simularIngresoAnterior } from './apoyo/sesionFabricada.js'
import { menuVisible } from './apoyo/usuarios.js'

/*
 * RNF-10 · Sesión para uso sin conexión (CU-01 2b). Prueba obligatoria del Sprint 1.
 *
 * Deja el dispositivo como queda después de un ingreso (la sesión de supabase-js en su
 * almacenamiento y el perfil en IndexedDB), corta la red y vuelve a abrir la aplicación.
 * La sesión es fabricada (e2e/apoyo/sesionFabricada.js): sin red nadie la valida, que es justo
 * lo que se quiere observar, y así la prueba no necesita credenciales ni esperar a que venza un
 * token real.
 *
 * Resultado y explicación: docs/pruebas/sesion-sin-conexion.md
 */

for (const caso of [
  { nombre: 'token vigente', segundosParaVencer: 3600 },
  { nombre: 'token vencido', segundosParaVencer: -3600 },
]) {
  test(`RNF-10 / CU-01 2b: sin red y con el ${caso.nombre}, abre con la sesión guardada`, async ({
    page,
    context,
    browserName,
  }) => {
    test.fixme(
      browserName === 'webkit',
      'Playwright WebKit no abre la aplicación sin red («WebKit encountered an internal error»): se verifica en un iPhone real (plan del Sprint 4, decisión 29)',
    )
    // 1. Primera carga con red: instala el service worker y crea la base local.
    await page.goto('/ingresar')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.waitForFunction(async () => (await caches.keys()).length > 0)

    // 2. El dispositivo queda como después de un ingreso.
    await simularIngresoAnterior(page, caso.segundosParaVencer)

    // 3. Sin red, se vuelve a abrir la aplicación.
    await context.setOffline(true)
    await page.reload()

    // Abre desde la caché y entra de una vez, sin esperar a que supabase-js renueve el token.
    await expect(page).toHaveURL(/\/novedades$/, { timeout: 5000 })
    const menu = menuVisible(page)
    for (const opcion of ['Novedades', 'Registrar', 'Avisos', 'Cuenta']) {
      await expect(menu.getByRole('link', { name: opcion })).toBeVisible()
    }
    await expect(
      page.locator('[data-conexion="sin_conexion"]').filter({ visible: true }),
    ).toBeVisible()

    // 4. Llega al formulario de registro.
    await menu.getByRole('link', { name: 'Registrar' }).click()
    await expect(page).toHaveURL(/\/registrar$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Registrar novedad' })).toBeVisible()

    // 5. supabase-js intentó renovar el token sin red y no borró la sesión.
    await page.waitForTimeout(3000)
    expect(
      await page.evaluate((clave) => localStorage.getItem(clave), CLAVE_DE_SESION),
    ).not.toBeNull()
  })
}
