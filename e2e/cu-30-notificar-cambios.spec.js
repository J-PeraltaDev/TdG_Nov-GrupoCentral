import { expect, test } from '@playwright/test'
import { registrarPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import {
  HAY_CLAVE,
  ingresarComo,
  leerDeLaApi,
  llamarALaApi,
  MOTIVO_SIN_CLAVE,
} from './apoyo/usuarios.js'

/*
 * CU-30 · Notificar cambios dentro de la aplicación (RF-30). Pantalla 10 y las insignias.
 *
 * El reportante registra y el aprobador la toma, los dos por la API con su sesión (sin
 * ingresos nuevos). «staging» acumula los avisos de todas las corridas: el de esta prueba se
 * busca por el código de su novedad.
 */

const codigoDe = (novedad) => `NOV-${String(novedad.codigo).padStart(4, '0')}`

test.describe('CU-30 · Avisos dentro de la aplicación', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test('RF-30 / CU-30: el aprobador toma la novedad; el reportante ve la insignia, abre su aviso, queda leído y llega al detalle', async ({
    page,
    browser,
  }, testInfo) => {
    await ingresarComo(page, 'reportante')
    const novedad = await registrarPorLaApi(page, {
      descripcion: descripcionUnica(testInfo, 'La reja del acopio no cierra'),
      prioridad: 'normal',
      area: 'Mantenimiento',
    })

    // CU-30 1 y 2: el aprobador la toma; el aviso es para el reportante, no para quien actúa.
    const contexto = await browser.newContext()
    const aprobador = await contexto.newPage()
    await ingresarComo(aprobador, 'aprobador')
    await llamarALaApi(aprobador, 'tomar_novedad', { p_novedad_id: novedad.id })
    await contexto.close()

    // En WebKit el permiso de notificaciones empieza sin decidir y 10-B se abre en «Avisos»: aquí
    // no se prueba el push (CU-31), así que se cierra con «Ahora no».
    const hoja = page.getByRole('dialog', { name: 'Activa las notificaciones' })
    await page.addLocatorHandler(hoja, () => hoja.getByRole('button', { name: 'Ahora no' }).click())

    // CU-30 3: la insignia de «Avisos» (menú y campana) cuenta los sin leer.
    await page.reload()
    const avisos = page.getByRole('link', { name: /^Avisos ?, \d+ avisos? sin leer$/ })
    await expect(avisos.first()).toBeVisible()

    // CU-30 4: abre el aviso de su novedad.
    await avisos.first().click()
    const aviso = page.getByRole('button', {
      name: new RegExp(
        `^${codigoDe(novedad)} .*Mantenimiento tomó tu novedad para atención\\..*Sin leer`,
      ),
    })
    await aviso.click()

    // CU-30 5: queda leído y se ve la novedad, con el regreso a los avisos.
    await expect(page).toHaveURL(new RegExp(`/novedades/${novedad.id}$`))
    await expect(page.getByRole('link', { name: 'Volver a los avisos' })).toBeVisible()
    await expect
      .poll(() => leerDeLaApi(page, `notificacion?select=leida&novedad_id=eq.${novedad.id}`))
      .toEqual([{ leida: true }])
  })
})
