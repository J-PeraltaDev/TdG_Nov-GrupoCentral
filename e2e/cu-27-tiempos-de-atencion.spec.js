import { expect, test } from '@playwright/test'
import { enTelefono } from './apoyo/novedades.js'
import { HAY_CLAVE, ingresarComo, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-27 · Consultar los tiempos de atención (RF-27). Pantallas 24 y 24-B. Estructura y
 * navegación, no números (decisión 27): «staging» acumula las novedades de otras corridas.
 */

test.describe('CU-27 · Tiempos de atención', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test('RF-27 / CU-27: con «Últimos 3 meses», abre una de «Abiertas con más tiempo» y vuelve al panel', async ({
    page,
  }) => {
    await ingresarComo(page, 'director')
    await page.goto('/panel')
    await page
      .getByRole('tab', { name: enTelefono(page) ? 'Tiempos' : 'Tiempos de atención' })
      .click()

    await expect(page).toHaveURL(/\/panel\?indicador=tiempos$/)
    const periodo = page.getByRole('combobox', { name: 'Período' })
    await expect(periodo.locator('option:checked')).toHaveText(/^Últimos 3 meses/)
    // Una tarjeta por área, con su promedio o «No disponible».
    await expect(page.getByText(/· promedio de registro a resolución$/).first()).toBeVisible()
    await expect(
      page.getByText('Se mide desde la fecha de registro en finca, no desde la sincronización.'),
    ).toBeVisible()

    const tabla = page.getByRole('table', { name: /Las cinco novedades abiertas/ })
    const primera = tabla.getByRole('link').first()
    const codigo = await primera.textContent()
    await primera.click()

    await expect(page.getByRole('heading', { level: 1, name: codigo })).toBeVisible()
    await page.getByRole('link', { name: 'Volver al panel' }).click()
    await expect(page).toHaveURL(/\/panel\?indicador=tiempos$/)

    // Con otro período, la dirección lo guarda.
    await periodo.selectOption({ index: 0 })
    await expect(page).toHaveURL(/\/panel\?indicador=tiempos&periodo=mes$/)
  })
})
