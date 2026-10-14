import { expect, test } from '@playwright/test'
import { descripcionUnica, llenarNovedad } from './apoyo/registro.js'
import { HAY_CLAVE, MOTIVO_SIN_CLAVE, ingresarComo, leerDeLaApi } from './apoyo/usuarios.js'

/*
 * RNF-07, RNF-08 y RNF-09 con RF-21 y RF-22 (CU-21, CU-22), sobre el build con service worker
 * y contra «staging», con la sesión del reportante de prueba: registrar dos novedades sin red,
 * cerrar la aplicación, volver con red y comprobar por la API, con esa misma sesión, que cada
 * una quedó una sola vez y con la fecha real del registro, anterior a la de sincronización.
 */

const indicador = (page) => page.locator('[data-conexion]').filter({ visible: true }).first()

test.describe('RNF-07 a RNF-09 · Registrar sin red y sincronizar sin duplicados', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test('RF-21 / RF-22 / RNF-07 a RNF-09: sin red, cerrar, volver con red: una sola vez y con su fecha real', async ({
    page,
    context,
    browserName,
  }, testInfo) => {
    test.fixme(
      browserName === 'webkit',
      'Playwright WebKit no abre la aplicación sin red («WebKit encountered an internal error»): se verifica en un iPhone real (plan del Sprint 4, decisión 29)',
    )

    await ingresarComo(page, 'reportante')
    // Antes de cortar la red: la aplicación en caché y el perfil guardado en el dispositivo, como
    // quedan después de un ingreso (RNF-10). Sin el perfil, sin red pediría ingresar.
    // Se sondea desde la prueba: `waitForFunction` no espera promesas (la promesa misma ya es un
    // valor verdadero) y daba por listo lo que todavía no estaba.
    await expect
      .poll(() => page.evaluate(async () => (await caches.keys()).length), { timeout: 20_000 })
      .toBeGreaterThan(0)
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              new Promise((resolver) => {
                const solicitud = indexedDB.open('novedades')
                solicitud.onsuccess = () => {
                  const lectura = solicitud.result
                    .transaction('meta')
                    .objectStore('meta')
                    .get('perfil')
                  lectura.onsuccess = () => {
                    solicitud.result.close()
                    resolver(Boolean(lectura.result))
                  }
                }
              }),
          ),
        { timeout: 20_000 },
      )
      .toBe(true)
    await context.setOffline(true)

    const descripciones = [
      descripcionUnica(testInfo, 'Primera sin red'),
      descripcionUnica(testInfo, 'Segunda sin red'),
    ]
    for (const descripcion of descripciones) {
      await page.goto('/registrar')
      await llenarNovedad(page, { descripcion, prioridad: 'Normal', area: 'Mantenimiento' })
      await page.getByRole('button', { name: 'Guardar en el dispositivo' }).click()
      await expect(
        page.getByRole('heading', { level: 1, name: 'Guardada en este teléfono' }),
      ).toBeVisible()
    }
    await expect(indicador(page)).toHaveText('Sin conexión · 2 pendientes: ver la lista')
    const antesDeSincronizar = Date.now()

    // Se cierra la aplicación y se vuelve a abrir con red.
    await page.close()
    await context.setOffline(false)
    const otra = await context.newPage()
    await otra.goto('/novedades')

    // RF-22: se envían solas al abrir; el indicador deja de contarlas.
    await expect(indicador(otra)).toHaveText('En línea', { timeout: 30_000 })

    for (const descripcion of descripciones) {
      const filas = await leerDeLaApi(
        otra,
        `v_novedad?select=codigo,fecha_registro,fecha_sincronizacion&descripcion=eq.${encodeURIComponent(descripcion)}`,
      )
      // RNF-08: una sola vez, aunque el envío se haya repetido.
      expect(filas).toHaveLength(1)
      const [fila] = filas
      // RNF-09: la fecha es la del registro en la finca, anterior a la de sincronización.
      expect(Date.parse(fila.fecha_registro)).toBeLessThan(antesDeSincronizar)
      expect(Date.parse(fila.fecha_registro)).toBeLessThan(Date.parse(fila.fecha_sincronizacion))
      expect(fila.codigo).toBeGreaterThan(0)
    }
  })
})
