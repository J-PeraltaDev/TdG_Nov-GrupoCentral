import { expect } from '@playwright/test'
import { menuVisible } from './usuarios.js'

/*
 * Ayudas para el formulario de registro (pantalla 05) y su constancia (pantalla 06).
 */

/** Descripción única por prueba: permite encontrar después la novedad en las listas. */
export function descripcionUnica(testInfo, texto) {
  return `${texto} · e2e ${testInfo.project.name} ${Date.now()}`
}

/** Abre el formulario desde el menú, como lo haría el reportante. */
export async function abrirRegistro(page) {
  await menuVisible(page).getByRole('link', { name: 'Registrar' }).click()
  await expect(page).toHaveURL(/\/registrar$/)
}

/**
 * Llena los campos que se indiquen. La prioridad y el área se eligen tocando su tarjeta.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ descripcion?: string, prioridad?: string, area?: string }} datos
 */
export async function llenarNovedad(page, { descripcion, prioridad, area }) {
  if (descripcion) await page.getByLabel('¿Qué está pasando?').fill(descripcion)
  if (prioridad) {
    await page
      .getByRole('group', { name: 'Prioridad' })
      .getByText(prioridad, { exact: true })
      .click()
    await expect(page.getByRole('radio', { name: new RegExp(`^${prioridad}`) })).toBeChecked()
  }
  if (area) {
    await page
      .getByRole('group', { name: 'Área que debe atenderla' })
      .getByText(area, { exact: true })
      .click()
    await expect(page.getByRole('radio', { name: new RegExp(`^${area}`) })).toBeChecked()
  }
}

export const enviarNovedad = (page) => page.getByRole('button', { name: 'Enviar novedad' }).click()

/**
 * Después de ingresar, espera lo que la aplicación necesita para abrir sin red: ella misma en
 * caché y el perfil guardado en el dispositivo (RNF-10). Sin el perfil, sin red pediría ingresar.
 * Se sondea desde la prueba: `waitForFunction` no espera promesas (la promesa misma ya es un valor
 * verdadero) y daba por listo lo que todavía no estaba.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function esperarQueFuncioneSinRed(page) {
  // La caché aparece apenas empieza la instalación; sin red, las navegaciones las atiende solo un
  // service worker activo. En el CI, más lento, la red se cortaba antes.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
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
}

/**
 * Espera la constancia y devuelve el código asignado (`NOV-0001`).
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
export async function codigoDeLaConstancia(page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Novedad recibida' })).toBeVisible()
  const codigo = page.getByText(/^NOV-\d{4,}$/)
  await expect(codigo).toBeVisible()
  return (await codigo.textContent()).trim()
}
