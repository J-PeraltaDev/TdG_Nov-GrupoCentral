import { expect, test } from '@playwright/test'
import { menuVisible } from './apoyo/usuarios.js'

/*
 * RNF-10 · Sesión para uso sin conexión (CU-01 2b). Prueba obligatoria del Sprint 1.
 *
 * Deja el dispositivo como queda después de un ingreso (la sesión de supabase-js en su
 * almacenamiento y el perfil en IndexedDB), corta la red y vuelve a abrir la aplicación.
 * La sesión es fabricada: sin red nadie la valida, que es justo lo que se quiere observar,
 * y así la prueba no necesita credenciales ni esperar a que venza un token real.
 *
 * Resultado y explicación: docs/pruebas/sesion-sin-conexion.md
 */

const PERFIL = {
  id: '00000000-0000-4000-a000-000000000001',
  nombre: 'Reportante de prueba 01',
  rol_id: 1,
  finca_id: '00000000-0000-4000-c000-000000000001',
  area_id: null,
  activo: true,
  finca: {
    id: '00000000-0000-4000-c000-000000000001',
    nombre: 'Finca de prueba 01',
    razon_social: {
      id: '00000000-0000-4000-b000-00000000000a',
      nombre: 'Razón social de prueba A',
    },
  },
  area: null,
}

// supabase-js guarda la sesión con la clave sb-<primer tramo del host del proyecto>-auth-token.
const PROYECTO = new URL(process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321').hostname.split(
  '.',
)[0]
const CLAVE_DE_SESION = `sb-${PROYECTO}-auth-token`

/** Deja en el navegador la sesión y el perfil de un ingreso anterior. */
function simularIngresoAnterior(page, segundosParaVencer) {
  return page.evaluate(
    async ({ clave, perfil, segundos }) => {
      localStorage.setItem(
        clave,
        JSON.stringify({
          access_token: 'fabricado.fabricado.fabricado',
          refresh_token: 'fabricado',
          token_type: 'bearer',
          expires_in: 300,
          expires_at: Math.floor(Date.now() / 1000) + segundos,
          user: { id: perfil.id, aud: 'authenticated', role: 'authenticated' },
        }),
      )
      await new Promise((resolver, rechazar) => {
        const solicitud = indexedDB.open('novedades')
        solicitud.onerror = () => rechazar(solicitud.error)
        solicitud.onsuccess = () => {
          const tx = solicitud.result.transaction('meta', 'readwrite')
          tx.objectStore('meta').put(perfil, 'perfil')
          tx.oncomplete = () => {
            solicitud.result.close()
            resolver()
          }
        }
      })
    },
    { clave: CLAVE_DE_SESION, perfil: PERFIL, segundos: segundosParaVencer },
  )
}

for (const caso of [
  { nombre: 'token vigente', segundosParaVencer: 3600 },
  { nombre: 'token vencido', segundosParaVencer: -3600 },
]) {
  test(`RNF-10 / CU-01 2b: sin red y con el ${caso.nombre}, abre con la sesión guardada`, async ({
    page,
    context,
  }) => {
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
