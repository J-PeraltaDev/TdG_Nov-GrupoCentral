import { expect, test } from '@playwright/test'
import { descripcionUnica, esperarQueFuncioneSinRed, llenarNovedad } from './apoyo/registro.js'
import { PERFIL, simularIngresoAnterior } from './apoyo/sesionFabricada.js'
import { HAY_CLAVE, MOTIVO_SIN_CLAVE, ingresarComo, leerDeLaApi } from './apoyo/usuarios.js'

/*
 * RF-22 / CU-22 · Sincronizar pendientes, sobre el build con service worker. El curso normal va
 * contra «staging» con la sesión del reportante de prueba; los demás, sin ingresar (sesión
 * fabricada). Cerrar la aplicación y volver está en rnf-07-sincronizar-sin-duplicados.
 */

const MOTIVO_WEBKIT =
  'Playwright WebKit no abre la aplicación sin red («WebKit encountered an internal error»): se verifica en un iPhone real (plan del Sprint 4, decisión 29)'

const pendiente = (id, minutos) => ({
  id_local: `${id}0000-0000-4000-8000-000000000001`,
  descripcion: `Pendiente ${id}`,
  prioridad: 'normal',
  area_id: '00000000-0000-4000-d000-000000000001',
  area: 'Mantenimiento',
  finca_id: PERFIL.finca_id,
  reportante_id: PERFIL.id,
  fecha_registro: new Date(Date.now() - minutos * 60_000).toISOString(),
  envio: 'pendiente',
  intentos: 0,
  ultimo_error: null,
})

const indicador = (page) => page.locator('[data-conexion]').filter({ visible: true }).first()

/** Abre la aplicación sin red, como después de un ingreso, con dos pendientes. */
async function abrirSinRed(page, context, segundosParaVencer) {
  await page.goto('/ingresar')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await simularIngresoAnterior(page, segundosParaVencer, {
    pendientes: [pendiente('8a10', 5), pendiente('7f3a', 30)],
  })
  await context.setOffline(true)
  await page.goto('/novedades')
}

test('RF-22 / CU-22: con la aplicación abierta, al volver la red se envía sola y 08 muestra su código', async ({
  page,
  context,
  browserName,
}, testInfo) => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)
  test.fixme(browserName === 'webkit', MOTIVO_WEBKIT)
  await ingresarComo(page, 'reportante')
  await esperarQueFuncioneSinRed(page)
  await context.setOffline(true)

  const descripcion = descripcionUnica(testInfo, 'Vuelve la red con la app abierta')
  await page.goto('/registrar')
  await llenarNovedad(page, { descripcion, prioridad: 'Normal', area: 'Mantenimiento' })
  await page.getByRole('button', { name: 'Guardar en el dispositivo' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Guardada en este teléfono' }),
  ).toBeVisible()
  await indicador(page).click()
  await expect(page.getByText('En espera de conexión')).toBeVisible()

  // Vuelve la red sin recargar ni cambiar de pantalla.
  await context.setOffline(false)

  await expect(page.getByText('Todo está sincronizado')).toBeVisible({ timeout: 30_000 })
  await expect(indicador(page)).toHaveText('En línea')
  const filas = await leerDeLaApi(
    page,
    `v_novedad?select=codigo&descripcion=eq.${encodeURIComponent(descripcion)}`,
  )
  expect(filas).toHaveLength(1)
  await expect(
    page.getByRole('list', { name: 'Pendientes de sincronizar' }).getByRole('listitem'),
  ).toContainText(`Enviada · código NOV-${String(filas[0].codigo).padStart(4, '0')}`)
})

test('RF-23 / CU-23: desde cualquier pantalla, el indicador lleva a las pendientes (08), en el orden en que se registraron', async ({
  page,
  context,
  browserName,
}) => {
  test.fixme(browserName === 'webkit', MOTIVO_WEBKIT)
  await abrirSinRed(page, context, 3600)

  await indicador(page).click()

  await expect(page).toHaveURL(/\/pendientes$/)
  await expect(page.getByText('En espera de conexión')).toBeVisible()
  const lista = page.getByRole('list', { name: 'Pendientes de sincronizar' })
  await expect(lista.getByText(/^LOC-/)).toHaveText(['LOC-7F3A', 'LOC-8A10'])
  await expect(lista.getByText('En espera')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Reintentar todo' })).toBeDisabled()
})

test('RF-22 / CU-22 3a: si la sesión ya no sirve al volver la red, pide el ingreso y la cola se conserva', async ({
  page,
  context,
  browserName,
}) => {
  test.fixme(browserName === 'webkit', MOTIVO_WEBKIT)
  await abrirSinRed(page, context, -3600)

  // Vuelve la red, pero el servidor ya no acepta la sesión: el token venció y no se renueva.
  await context.route(/supabase\.co\//, (ruta) => {
    const url = ruta.request().url()
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
    if (url.includes('/auth/v1/health'))
      return ruta.fulfill({ status: 200, headers: cors, body: '{}' })
    if (url.includes('/auth/v1/token')) {
      return ruta.fulfill({
        status: 400,
        headers: cors,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid Refresh Token',
        }),
      })
    }
    return ruta.fulfill({ status: 401, headers: cors, contentType: 'application/json', body: '{}' })
  })
  await context.setOffline(false)

  await expect(page).toHaveURL(/\/ingresar$/, { timeout: 20_000 })
  const cola = await page.evaluate(
    () =>
      new Promise((resolver, rechazar) => {
        const solicitud = indexedDB.open('novedades')
        solicitud.onerror = () => rechazar(solicitud.error)
        solicitud.onsuccess = () => {
          const lectura = solicitud.result
            .transaction('pendientes')
            .objectStore('pendientes')
            .getAll()
          lectura.onsuccess = () => {
            solicitud.result.close()
            resolver(lectura.result)
          }
        }
      }),
  )
  expect(cola.map((p) => p.descripcion).sort()).toEqual(['Pendiente 7f3a', 'Pendiente 8a10'])
})
