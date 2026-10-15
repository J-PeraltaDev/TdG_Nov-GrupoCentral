import { expect, test } from '@playwright/test'
import { PERFIL, simularIngresoAnterior, apiDeSupabase } from './apoyo/sesionFabricada.js'

/*
 * RF-23 / CU-23 · Mostrar estado de conexión y pendientes, sobre el build con service worker.
 *
 * Sin ingresar: una sesión fabricada y una pendiente sembrada en IndexedDB. Con red, el servidor
 * rechazaría la sesión fabricada; por eso la parte «con red» se hace con las solicitudes a
 * Supabase cortadas (la red conectada sin internet de un portal cautivo) y, al final, con solo la
 * verificación del monitor respondiendo. Se cortan en el contexto y no en la página: con el
 * service worker activo, `page.route` no ve todas las solicitudes.
 */

const PENDIENTE = {
  id_local: '7f3a0000-0000-4000-8000-000000000001',
  descripcion: 'El rodillo del cable vía del lote 5 está suelto.',
  prioridad: 'normal',
  area_id: '00000000-0000-4000-d000-000000000001',
  area: 'Mantenimiento',
  finca_id: PERFIL.finca_id,
  reportante_id: PERFIL.id,
  fecha_registro: new Date().toISOString(),
  envio: 'pendiente',
  intentos: 0,
  ultimo_error: null,
}

const indicador = (page) => page.locator('[data-conexion]').filter({ visible: true }).first()

test('RF-23 / CU-23: el indicador sigue la conexión real y cuenta las pendientes', async ({
  page,
  context,
  browserName,
}) => {
  test.fixme(
    browserName === 'webkit',
    'Playwright WebKit no abre la aplicación sin red («WebKit encountered an internal error»): se verifica en un iPhone real (plan del Sprint 4, decisión 29)',
  )
  await page.goto('/ingresar')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await simularIngresoAnterior(page, 3600, { pendientes: [PENDIENTE] })

  // CU-23 1 a 3: sin red, «Sin conexión» con la pendiente del usuario.
  await context.setOffline(true)
  await page.reload()
  await expect(page).toHaveURL(/\/novedades$/)
  await expect(indicador(page)).toHaveText('Sin conexión · 1 pendiente: ver la lista')
  await expect(page.locator('[aria-live="polite"]')).toHaveText('Sin conexión · 1 pendiente')

  // El navegador dice que volvió la red, pero Supabase no responde (portal cautivo): el
  // monitor no se deja engañar por el evento `online`.
  await context.route(apiDeSupabase(), (ruta) => ruta.abort('internetdisconnected'))
  await context.setOffline(false)
  await expect(indicador(page)).toHaveText('Sin conexión · 1 pendiente: ver la lista')
  await page.waitForTimeout(2000)
  await expect(indicador(page)).toHaveText('Sin conexión · 1 pendiente: ver la lista')

  // CU-23 4: cuando el servidor vuelve a responder, la verificación periódica (cada 15 s) lo
  // nota y el indicador vuelve a «En línea», con la pendiente todavía por enviar.
  // Las rutas nuevas se ponen antes de quitar la vieja: ninguna solicitud se cuela al servidor.
  const verificaciones = []
  await context.route(apiDeSupabase('auth/v1/health'), (ruta) => {
    verificaciones.push(Date.now())
    return ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
      body: '{}',
    })
  })
  // Lo demás queda sin respuesta. Un corte devolvería el indicador a «Sin conexión» apenas
  // arrancara la sincronización, y un 401 cerraría la sesión fabricada (la app lo hace bien:
  // una sesión que el servidor rechaza se cierra). Aquí solo importa la verificación.
  await context.route(apiDeSupabase('(?!auth/v1/health)'), () => new Promise(() => {}))
  await context.unroute(apiDeSupabase())
  await expect(indicador(page)).toHaveText(/^En línea/, { timeout: 20_000 })
  expect(verificaciones.length).toBeGreaterThan(0)
})
