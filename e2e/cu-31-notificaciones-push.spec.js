import { expect, test } from '@playwright/test'
import { enTelefono } from './apoyo/novedades.js'
import { HAY_CLAVE, ingresarComo, leerDeLaApi, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-31 · Notificaciones push en el cliente (RF-31). Pantalla 10-B y la fila de Cuenta.
 *
 * Chromium de Playwright no trae el servicio push de Google: `Notification` y `PushManager` se
 * simulan, con un punto de entrega de prueba que dura lo que la pestaña (sessionStorage). Lo que
 * se prueba de verdad es la suscripción guardada y borrada en «staging», con la sesión y la RLS.
 * La entrega real se prueba a mano en un teléfono (plan del Sprint 5, decisión 47).
 */

/** Un navegador con push que siempre concede el permiso y entrega un punto de entrega propio. */
async function simularPush(contexto) {
  await contexto.addInitScript(() => {
    const leer = (clave) => sessionStorage.getItem(`push-de-prueba:${clave}`)
    const guardar = (clave, valor) =>
      valor === null
        ? sessionStorage.removeItem(`push-de-prueba:${clave}`)
        : sessionStorage.setItem(`push-de-prueba:${clave}`, valor)

    const suscripcion = (endpoint) => ({
      endpoint,
      toJSON: () => ({
        endpoint,
        keys: {
          p256dh:
            'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
          auth: 'BTBZMqHH6r4Tts7J_aSIgg',
        },
      }),
      unsubscribe: async () => {
        guardar('endpoint', null)
        return true
      },
    })

    window.Notification = class {
      static get permission() {
        return leer('permiso') ?? 'default'
      }
      static async requestPermission() {
        guardar('permiso', 'granted')
        return 'granted'
      }
    }
    if (!window.PushManager) window.PushManager = class {}
    window.PushManager.prototype.getSubscription = async () =>
      leer('endpoint') ? suscripcion(leer('endpoint')) : null
    window.PushManager.prototype.subscribe = async () => {
      guardar('endpoint', `https://fcm.googleapis.com/fcm/send/e2e-${crypto.randomUUID()}`)
      return suscripcion(leer('endpoint'))
    }
  })
}

const endpointDePrueba = (page) =>
  page.evaluate(() => sessionStorage.getItem('push-de-prueba:endpoint'))

const suscripcionesConEse = async (page, endpoint) =>
  (await leerDeLaApi(page, 'suscripcion_push?select=endpoint')).filter(
    (fila) => fila.endpoint === endpoint,
  )

test.describe('CU-31 · Notificaciones push', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test('CU-31: 10-B al abrir Avisos; «Activar» guarda la suscripción y cerrar sesión la borra', async ({
    browser,
    context,
    page,
  }) => {
    await simularPush(context)
    await ingresarComo(page, 'reportante')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.goto('/avisos')

    const hoja = page.getByRole('dialog', { name: 'Activa las notificaciones' })
    await expect(hoja).toBeVisible()
    await expect(
      hoja.getByText(
        'Te avisaremos en este teléfono cuando tu novedad cambie de estado, aunque la app esté cerrada.',
      ),
    ).toBeVisible()
    await hoja.getByRole('button', { name: 'Activar notificaciones' }).click()
    await expect(hoja).toBeHidden()

    // La fila queda a nombre del reportante: la API la ve con su sesión.
    const endpoint = await endpointDePrueba(page)
    expect(endpoint).toMatch(/^https:\/\/fcm\.googleapis\.com\/fcm\/send\/e2e-/)
    await expect.poll(() => suscripcionesConEse(page, endpoint)).toHaveLength(1)

    // Cuenta dice que están activadas.
    if (enTelefono(page)) {
      await page
        .getByRole('navigation', { name: 'Principal' })
        .filter({ visible: true })
        .getByRole('link', { name: 'Cuenta' })
        .click()
    } else {
      await page.goto('/cuenta')
    }
    await expect(page.getByText('Notificaciones en este dispositivo')).toBeVisible()
    await expect(page.getByText('Activadas', { exact: true })).toBeVisible()

    // Cerrar sesión borra la suscripción de este dispositivo (decisión 45).
    await page.getByRole('main').getByRole('button', { name: 'Cerrar sesión' }).click()
    await page.waitForURL('**/ingresar')
    const otra = await (await browser.newContext()).newPage()
    await ingresarComo(otra, 'reportante')
    await expect.poll(() => suscripcionesConEse(otra, endpoint)).toHaveLength(0)
    await otra.context().close()
  })

  test('CU-31: «Ahora no» no vuelve a preguntar en este dispositivo', async ({ context, page }) => {
    await simularPush(context)
    await ingresarComo(page, 'aprobador')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.goto('/avisos')

    const hoja = page.getByRole('dialog', { name: 'Activa las notificaciones' })
    await expect(
      hoja.getByText(
        'Te avisaremos en este dispositivo cuando cambie una novedad que atiendes, aunque la app esté cerrada.',
      ),
    ).toBeVisible()
    await hoja.getByRole('button', { name: 'Ahora no' }).click()
    await expect(hoja).toBeHidden()
    // Queda anotado en el almacén meta de IndexedDB.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            new Promise((listo) => {
              const solicitud = indexedDB.open('novedades')
              solicitud.onsuccess = () => {
                const lectura = solicitud.result
                  .transaction('meta')
                  .objectStore('meta')
                  .get('push-ofrecida')
                lectura.onsuccess = () => {
                  solicitud.result.close()
                  listo(lectura.result ?? null)
                }
              }
            }),
        ),
      )
      .toBe(true)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Avisos' })).toBeAttached()
    await page.waitForTimeout(500)
    await expect(hoja).toBeHidden()
  })
})
