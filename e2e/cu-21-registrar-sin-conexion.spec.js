import { expect, test } from '@playwright/test'
import { simularIngresoAnterior } from './apoyo/sesionFabricada.js'

/*
 * RF-21 / CU-21 · Registrar novedad sin conexión, sobre el build con service worker.
 *
 * Sin ingresar: una sesión fabricada (sin red nadie la valida). Registra en «modo avión», ve la
 * constancia local (07) y el indicador, y comprueba que la pendiente sigue ahí después de volver
 * a abrir la aplicación sin red (RNF-07). El envío al servidor es de RF-22 (PR 3).
 */

const indicador = (page) => page.locator('[data-conexion]').filter({ visible: true }).first()

test('RF-21 / CU-21: sin red registra, ve 07 y la pendiente sobrevive a cerrar la aplicación', async ({
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
  await simularIngresoAnterior(page, 3600)
  await context.setOffline(true)
  await page.goto('/registrar')

  // 05-B
  await expect(
    page.getByText('Sin conexión', { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible()
  await expect(
    page.getByText(
      'La novedad se guardará en este teléfono y se enviará sola cuando vuelva el internet.',
    ),
  ).toBeVisible()

  const descripcion = `Registrada sin conexión ${Date.now()}`
  await page.getByLabel(/¿Qué está pasando\?/).fill(descripcion)
  await page.getByText('Normal', { exact: true }).click()
  await page.getByText('Mantenimiento', { exact: true }).click()
  await page.getByRole('button', { name: 'Guardar en el dispositivo' }).click()

  // 07, solo después de que la escritura quedó confirmada.
  await expect(
    page.getByRole('heading', { level: 1, name: 'Guardada en este teléfono' }),
  ).toBeVisible()
  await expect(page.getByText(/^LOC-[0-9A-F]{4}$/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver pendientes (1)' })).toBeVisible()
  await expect(indicador(page)).toHaveText('Sin conexión · 1 pendiente')

  // RNF-07: se cierra la aplicación (otra página, sin red) y la pendiente sigue en el dispositivo.
  await page.close()
  const otra = await context.newPage()
  await otra.goto('/novedades')
  await expect(indicador(otra)).toHaveText('Sin conexión · 1 pendiente')
  const guardada = await otra.evaluate(
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
  expect(guardada).toHaveLength(1)
  expect(guardada[0]).toMatchObject({
    descripcion,
    prioridad: 'normal',
    area: 'Mantenimiento',
    envio: 'pendiente',
  })
  expect(Date.parse(guardada[0].fecha_registro)).toBeLessThanOrEqual(Date.now())
})
